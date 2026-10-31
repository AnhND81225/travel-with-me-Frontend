import { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardList, ChevronLeft, ChevronRight, RefreshCw, ReceiptText, MessageSquareText, Clock3, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { vnd } from '../equipment/catalogApi';
import { refunds, type TransactionHistory, type RefundPreview } from './paymentApi';
import './payment-pages.css';
import { RefundTargetDetails } from './RefundTargetDetails';
import { Modal } from '../../components/ui';

const positiveId = (value: string | null) => value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

export function RefundsPage({ admin = false }: { admin?: boolean }) {
  const [params] = useSearchParams();
  const orderId = positiveId(params.get('orderId'));
  const participantId = positiveId(params.get('participantId'));
  const [rows, setRows] = useState<TransactionHistory[]>([]);
  const [reason, setReason] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [confirmationNote, setConfirmationNote] = useState('');
  const [preview, setPreview] = useState<RefundPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [submitted, setSubmitted] = useState<TransactionHistory | null>(null);
  const [page, setPage] = useState(0);
  const [refundStatus, setRefundStatus] = useState<'PENDING' | 'SUCCEEDED'>('PENDING');
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [confirmation, setConfirmation] = useState<TransactionHistory | null>(null);
  const fetchPage = useCallback(async () => {
    const request = admin ? (pageNumber: number) => refunds.list(pageNumber, refundStatus) : refunds.mine;
    const data = await request(page);
    // A full page alone does not prove that another page exists.
    const next = data.length === 20 ? await request(page + 1) : [];
    return { data, hasNext: next.length > 0 };
  }, [admin, page, refundStatus]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPage();
      if (!result.data.length && page > 0) { setPage(value => value - 1); return; }
      setRows(result.data); setHasNext(result.hasNext);
    } finally { setLoading(false); }
  }, [fetchPage, page]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setHasNext(false);
    fetchPage().then(result => {
      if (!active) return;
      if (!result.data.length && page > 0) { setPage(value => value - 1); return; }
      setRows(result.data); setHasNext(result.hasNext);
    }).catch(e => { if (active) { setRows([]); setError(e instanceof Error ? e.message : 'Unable to load refund requests.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchPage, page]);
  useEffect(() => {
    if (admin || (!orderId && !participantId) || (orderId && participantId)) return;
    let active = true;
    setPreview(null); setPreviewError(''); setSubmitted(null); setReason('');
    refunds.preview(orderId ? { orderId } : { participantId: participantId! })
      .then(data => { if (active) setPreview(data); })
      .catch(e => { if (active) setPreviewError(e instanceof Error ? e.message : 'Unable to load the refundable amount.'); });
    return () => { active = false; };
  }, [admin, orderId, participantId]);

  async function submit(id?: number) {
    if (inFlight.current) return;
    if (admin && !transferReference.trim()) { setError('Please enter the transfer reference.'); return; }
    if (!admin && !reason.trim()) { setError('Please enter a reason for your refund request.'); return; }
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = admin && id ? await refunds.confirm(id, { transferReference: transferReference.trim(), note: confirmationNote.trim() })
        : orderId && !participantId ? await refunds.request({ orderId, reason: reason.trim() })
        : participantId && !orderId ? await refunds.request({ participantId, reason: reason.trim() })
        : null;
      if (!result) throw new Error('Select exactly one order or tour ticket.');
      setNotice(result.status === 'SUCCEEDED'
        ? `Refund #${result.transactionId} confirmed · ${vnd(result.amount)}.`
        : `Request #${result.transactionId} submitted · ${vnd(result.amount)}. Awaiting review.`);
      if (!admin) setSubmitted(result);
      setConfirmation(null);
      await load().catch(() => setError('The action succeeded, but the list could not be refreshed. Please click Refresh.'));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to process refund.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const targetRows = [...rows, ...(submitted ? [submitted] : [])].filter(row => orderId ? row.orderId === orderId : row.participantId === participantId);
  return <main className="payment-pages space-y-5">
    <div className="pp-card pp-body"><h1 className="text-2xl font-bold">{admin ? 'Refund Request Management' : 'Request refund'}</h1>
      <p>{admin ? 'Confirm only after returning the money to the customer outside this application.' : 'Review your order or tour ticket, provide a reason and submit your refund request.'}</p>
      {!admin && <div className="pp-actions"><Link className="pp-text-link" to="/orders">My Orders</Link><Link className="pp-text-link" to="/my-tours">My Tours</Link></div>}
    </div>
    {error && <div className="pp-error" role="alert">{error}</div>}{notice && <div className="rf-feedback-toast" role="status"><CheckCircle2 size={20}/><span>{notice}</span><button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
    {!admin && (orderId || participantId) && <div className="rf-request-layout">
      <section className="pp-card pp-body"><RefundTargetDetails orderId={orderId} participantId={participantId}/>
        <form className="rf-reason-form" onSubmit={e => { e.preventDefault(); void submit(); }}>
          <label htmlFor="refund-reason">Reason for refund <span>*</span></label>
          <p>Tell us why you are requesting a refund so the branch can review your request.</p>
          <textarea id="refund-reason" required maxLength={2000} rows={5} value={reason} onChange={e => setReason(e.target.value)} placeholder="For example: My plans have changed and I can no longer join the trip…" disabled={busy || targetRows.some(row => row.status === 'PENDING')}/>
          <small>{reason.length}/2000 characters</small>
          <p className="rf-policy">Requests are reviewed before a manual refund. Payment and approval are paused while a refund is pending. The order is cancelled after an admin confirms the full refund. Submitting a request does not mean the money has been returned.</p>
          <button type="submit" className="pp-button" disabled={busy || loading || !preview || preview.refundableAmount <= 0 || !reason.trim() || targetRows.some(row => row.status === 'PENDING')}>{busy ? 'Submitting…' : targetRows.some(row => row.status === 'PENDING') ? 'Refund requested' : 'Submit refund request'}</button>
        </form>
      </section>
      <aside className="pp-card pp-summary rf-money"><h2>Estimated refund</h2>{previewError ? <p className="pp-error" role="alert">{previewError}</p> : !preview ? <p>Checking payment…</p> : <><dl><div><dt>Successfully paid</dt><dd>{vnd(preview.receivedAmount)}</dd></div><div><dt>Previously refunded</dt><dd>{vnd(preview.refundedAmount)}</dd></div></dl><div className="pp-total"><span>REMAINING REFUND AMOUNT</span><strong>{vnd(preview.refundableAmount)}</strong></div><p>Calculated from successful transactions. The amount is checked again on submission and admin confirmation.</p></>}</aside>
    </div>}
    {confirmation && <Modal isOpen onClose={() => { if (!inFlight.current) { setConfirmation(null); setError(''); } }} title="Confirm refund" badge={`#${confirmation.transactionId}`} maxWidth="lg">
      <div className="rf-confirm-body"><div className="rf-confirm-icon"><ReceiptText size={26}/></div><h2>Have you returned the money to the customer?</h2><p>Confirm only after returning the money outside this application.</p><strong className="rf-confirm-amount">{vnd(confirmation.amount)}</strong><span>{confirmation.orderId ? `Order #${confirmation.orderId}` : `Tour ticket #${confirmation.participantId}`}</span></div>
      <div className="rf-saved-reason"><strong>Customer reason</strong><p>{confirmation.refundReason || 'No reason was recorded for this older request.'}</p></div>
      {error && <div className="pp-error" role="alert">{error}</div>}
      <div className="rf-reason-form"><label htmlFor="refund-reference">Transfer reference *</label><input id="refund-reference" required maxLength={200} value={transferReference} onChange={e => setTransferReference(e.target.value)} disabled={busy}/><label htmlFor="refund-note">Transfer notes</label><textarea id="refund-note" maxLength={2000} value={confirmationNote} onChange={e => setConfirmationNote(e.target.value)} disabled={busy}/></div>
      <div className="rf-confirm-actions"><button type="button" className="pp-button secondary" disabled={busy} onClick={() => { setConfirmation(null); setError(''); }}>Back</button><button type="button" className="pp-button" disabled={busy || !transferReference.trim()} onClick={() => void submit(confirmation.transactionId)}>{busy ? <RefreshCw size={16} className="pp-spin"/> : <CheckCircle2 size={16}/>} {busy ? 'Confirming…' : 'Confirm money returned'}</button></div>
    </Modal>}
    <section className="pp-card pp-body rf-history"><div className="rf-history-heading"><div><span className="tc-eyebrow">REFUND TRACKING</span><h2>{admin ? refundStatus === 'PENDING' ? 'Pending requests' : 'Completed refunds' : 'Requests & outcomes'}</h2></div><button type="button" className="rf-refresh" disabled={busy || loading} onClick={() => { setError(''); void load().catch(e => setError(e instanceof Error ? e.message : 'Unable to refresh.')); }}><RefreshCw size={15} className={loading ? 'pp-spin' : ''}/>Refresh</button></div>
      {admin && <div className="rf-filter-tabs" role="group" aria-label="Filter refund status">
        <button type="button" className={refundStatus === 'PENDING' ? 'is-selected' : ''} aria-pressed={refundStatus === 'PENDING'} disabled={busy} onClick={() => { setRefundStatus('PENDING'); setPage(0); setConfirmation(null); }}><span>Pending</span></button>
        <button type="button" className={refundStatus === 'SUCCEEDED' ? 'is-selected' : ''} aria-pressed={refundStatus === 'SUCCEEDED'} disabled={busy} onClick={() => { setRefundStatus('SUCCEEDED'); setPage(0); setConfirmation(null); }}><span>Refunded</span></button>
      </div>}
      {loading ? <div className="rf-history-empty" role="status"><RefreshCw size={24} className="pp-spin"/><p>Loading refund requests…</p></div> : rows.length === 0 ? <div className="rf-history-empty"><span className="rf-history-empty-icon"><ClipboardList size={27}/></span><h3>{error ? 'Unable to load requests' : admin ? refundStatus === 'PENDING' ? 'No pending requests' : 'No completed refunds yet' : 'No refund requests yet'}</h3><p>{error ? 'Refresh to check your request status.' : admin ? refundStatus === 'PENDING' ? 'New customer requests will appear here.' : 'Confirmed refunds will appear here.' : 'After submitting a request, you can track its progress and outcome here.'}</p></div> : <div className="rf-request-list">{rows.map(row => <article key={row.transactionId} className="rf-request-row">
        <div className="rf-request-info"><div className="rf-request-id"><span className="rf-receipt-icon"><ReceiptText size={20}/></span><div><span className="tc-eyebrow">REFUND REQUEST</span><h3>Refund #{row.transactionId}</h3></div></div><strong className="rf-request-amount">{vnd(row.amount)}</strong><Link to={row.orderId ? (admin ? '/admin/orders' : '/orders') : (admin ? '/admin/schedule-payment-reviews' : `/my-tours/${row.participantId}`)}>{row.orderId ? `Order #${row.orderId}` : `Tour ticket #${row.participantId}`}</Link><p className="rf-request-date"><Clock3 size={13}/><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</time></p></div>
        <div className="rf-request-reason"><span className="rf-reason-heading"><MessageSquareText size={15}/>REFUND REASON</span><p>{row.refundReason || 'No reason was recorded for this older request.'}</p>{row.status === 'SUCCEEDED' && <p>Refunded at: {row.succeededAt ? new Date(row.succeededAt).toLocaleString('en-GB') : 'Not available'}{row.refundTransferReference && <> · Transfer reference: {row.refundTransferReference}</>}{row.refundConfirmationNote && <> · {row.refundConfirmationNote}</>}</p>}</div>
        <div className="rf-request-actions"><span className={`rf-status-badge ${row.status === 'SUCCEEDED' ? 'is-complete' : ''}`}><span className="rf-status-dot"/>{row.status === 'SUCCEEDED' ? 'Refunded' : row.status === 'PENDING' ? 'Pending' : row.status}</span>{admin && row.status === 'PENDING' && <button className="pp-button" disabled={busy} onClick={() => { setError(''); setTransferReference(''); setConfirmationNote(''); setConfirmation(row); }}><CheckCircle2 size={15}/>Confirm money returned</button>}</div>
      </article>)}</div>}
      {!loading && (page > 0 || hasNext) && <nav className="rf-pagination" aria-label="Refund request pagination"><span>Trang <strong>{page + 1}</strong></span><div><button type="button" disabled={page === 0 || busy} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16}/>Previous</button><button type="button" disabled={!hasNext || busy} onClick={() => setPage(value => value + 1)}>Next<ChevronRight size={16}/></button></div></nav>}
    </section>
  </main>;
}
