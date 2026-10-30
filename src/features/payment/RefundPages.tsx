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
    }).catch(e => { if (active) { setRows([]); setError(e instanceof Error ? e.message : 'Không tải được yêu cầu hoàn tiền.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchPage, page]);
  useEffect(() => {
    if (admin || (!orderId && !participantId) || (orderId && participantId)) return;
    let active = true;
    setPreview(null); setPreviewError(''); setSubmitted(null); setReason('');
    refunds.preview(orderId ? { orderId } : { participantId: participantId! })
      .then(data => { if (active) setPreview(data); })
      .catch(e => { if (active) setPreviewError(e instanceof Error ? e.message : 'Không tải được số tiền hoàn.'); });
    return () => { active = false; };
  }, [admin, orderId, participantId]);

  async function submit(id?: number) {
    if (inFlight.current) return;
    if (admin && !transferReference.trim()) { setError('Vui lòng nhập mã tham chiếu chuyển tiền.'); return; }
    if (!admin && !reason.trim()) { setError('Vui lòng nhập lý do hoàn tiền.'); return; }
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = admin && id ? await refunds.confirm(id, { transferReference: transferReference.trim(), note: confirmationNote.trim() })
        : orderId && !participantId ? await refunds.request({ orderId, reason: reason.trim() })
        : participantId && !orderId ? await refunds.request({ participantId, reason: reason.trim() })
        : null;
      if (!result) throw new Error('Select exactly one order or tour ticket.');
      setNotice(result.status === 'SUCCEEDED'
        ? `Đã xác nhận hoàn tiền phiếu #${result.transactionId} · ${vnd(result.amount)}.`
        : `Đã gửi yêu cầu #${result.transactionId} · ${vnd(result.amount)}. Đang chờ xử lý.`);
      if (!admin) setSubmitted(result);
      setConfirmation(null);
      await load().catch(() => setError('Thao tác đã thành công nhưng chưa tải lại được danh sách. Vui lòng bấm Tải lại.'));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to process refund.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const targetRows = [...rows, ...(submitted ? [submitted] : [])].filter(row => orderId ? row.orderId === orderId : row.participantId === participantId);
  return <main className="payment-pages space-y-5">
    <div className="pp-card pp-body"><h1 className="text-2xl font-bold">{admin ? 'Quản lý yêu cầu hoàn tiền' : 'Yêu cầu hoàn tiền'}</h1>
      <p>{admin ? 'Chỉ xác nhận sau khi đã chuyển tiền lại cho khách bên ngoài hệ thống.' : 'Kiểm tra đơn hàng hoặc vé tour, bổ sung lý do và gửi yêu cầu để được hỗ trợ.'}</p>
      {!admin && <div className="pp-actions"><Link className="pp-text-link" to="/orders">My Orders</Link><Link className="pp-text-link" to="/my-tours">My Tours</Link></div>}
    </div>
    {error && <div className="pp-error" role="alert">{error}</div>}{notice && <div className="rf-feedback-toast" role="status"><CheckCircle2 size={20}/><span>{notice}</span><button type="button" aria-label="Đóng thông báo" onClick={() => setNotice('')}>×</button></div>}
    {!admin && (orderId || participantId) && <div className="rf-request-layout">
      <section className="pp-card pp-body"><RefundTargetDetails orderId={orderId} participantId={participantId}/>
        <form className="rf-reason-form" onSubmit={e => { e.preventDefault(); void submit(); }}>
          <label htmlFor="refund-reason">Lý do yêu cầu hoàn tiền <span>*</span></label>
          <p>Cho chúng tôi biết vì sao bạn muốn hoàn tiền để chi nhánh xử lý yêu cầu.</p>
          <textarea id="refund-reason" required maxLength={2000} rows={5} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ví dụ: Tôi thay đổi lịch trình và không thể tham gia chuyến đi…" disabled={busy || targetRows.some(row => row.status === 'PENDING')}/>
          <small>{reason.length}/2000 ký tự</small>
          <p className="rf-policy">Yêu cầu được kiểm tra trước khi hoàn tiền thủ công. Đơn hàng sẽ bị khóa duyệt và thanh toán khi chờ hoàn tiền; sau khi admin xác nhận hoàn toàn bộ, đơn tự chuyển sang đã hủy. Gửi yêu cầu chưa có nghĩa tiền đã được hoàn.</p>
          <button type="submit" className="pp-button" disabled={busy || loading || !preview || preview.refundableAmount <= 0 || !reason.trim() || targetRows.some(row => row.status === 'PENDING')}>{busy ? 'Đang gửi…' : targetRows.some(row => row.status === 'PENDING') ? 'Đã gửi yêu cầu hoàn tiền' : 'Gửi yêu cầu hoàn tiền'}</button>
        </form>
      </section>
      <aside className="pp-card pp-summary rf-money"><h2>Số tiền hoàn dự kiến</h2>{previewError ? <p className="pp-error" role="alert">{previewError}</p> : !preview ? <p>Đang kiểm tra thanh toán…</p> : <><dl><div><dt>Đã thanh toán thành công</dt><dd>{vnd(preview.receivedAmount)}</dd></div><div><dt>Đã hoàn trước đó</dt><dd>{vnd(preview.refundedAmount)}</dd></div></dl><div className="pp-total"><span>ĐỀ NGHỊ HOÀN TOÀN BỘ CÒN LẠI</span><strong>{vnd(preview.refundableAmount)}</strong></div><p>Số tiền được tính từ các giao dịch thành công. Hệ thống kiểm tra lại khi gửi và khi admin xác nhận.</p></>}</aside>
    </div>}
    {confirmation && <Modal isOpen onClose={() => { if (!inFlight.current) { setConfirmation(null); setError(''); } }} title="Xác nhận hoàn tiền" badge={`#${confirmation.transactionId}`} maxWidth="lg">
      <div className="rf-confirm-body"><div className="rf-confirm-icon"><ReceiptText size={26}/></div><h2>Bạn đã hoàn tiền cho khách?</h2><p>Chỉ xác nhận khi đã chuyển tiền lại bên ngoài hệ thống.</p><strong className="rf-confirm-amount">{vnd(confirmation.amount)}</strong><span>{confirmation.orderId ? `Đơn hàng #${confirmation.orderId}` : `Vé tour #${confirmation.participantId}`}</span></div>
      <div className="rf-saved-reason"><strong>Lý do khách yêu cầu</strong><p>{confirmation.refundReason || 'Yêu cầu cũ chưa có lý do.'}</p></div>
      {error && <div className="pp-error" role="alert">{error}</div>}
      <div className="rf-reason-form"><label htmlFor="refund-reference">Mã tham chiếu chuyển tiền *</label><input id="refund-reference" required maxLength={200} value={transferReference} onChange={e => setTransferReference(e.target.value)} disabled={busy}/><label htmlFor="refund-note">Ghi chú chuyển tiền</label><textarea id="refund-note" maxLength={2000} value={confirmationNote} onChange={e => setConfirmationNote(e.target.value)} disabled={busy}/></div>
      <div className="rf-confirm-actions"><button type="button" className="pp-button secondary" disabled={busy} onClick={() => { setConfirmation(null); setError(''); }}>Quay lại</button><button type="button" className="pp-button" disabled={busy || !transferReference.trim()} onClick={() => void submit(confirmation.transactionId)}>{busy ? <RefreshCw size={16} className="pp-spin"/> : <CheckCircle2 size={16}/>} {busy ? 'Đang xác nhận…' : 'Xác nhận đã hoàn tiền'}</button></div>
    </Modal>}
    <section className="pp-card pp-body rf-history"><div className="rf-history-heading"><div><span className="tc-eyebrow">THEO DÕI HOÀN TIỀN</span><h2>{admin ? refundStatus === 'PENDING' ? 'Yêu cầu chờ xử lý' : 'Yêu cầu đã hoàn tiền' : 'Yêu cầu đã gửi & kết quả'}</h2></div><button type="button" className="rf-refresh" disabled={busy || loading} onClick={() => { setError(''); void load().catch(e => setError(e instanceof Error ? e.message : 'Không thể tải lại.')); }}><RefreshCw size={15} className={loading ? 'pp-spin' : ''}/>Tải lại</button></div>
      {admin && <div className="rf-filter-tabs" role="group" aria-label="Lọc trạng thái hoàn tiền">
        <button type="button" className={refundStatus === 'PENDING' ? 'is-selected' : ''} aria-pressed={refundStatus === 'PENDING'} disabled={busy} onClick={() => { setRefundStatus('PENDING'); setPage(0); setConfirmation(null); }}><span>Chờ xử lý</span></button>
        <button type="button" className={refundStatus === 'SUCCEEDED' ? 'is-selected' : ''} aria-pressed={refundStatus === 'SUCCEEDED'} disabled={busy} onClick={() => { setRefundStatus('SUCCEEDED'); setPage(0); setConfirmation(null); }}><span>Đã hoàn tiền</span></button>
      </div>}
      {loading ? <div className="rf-history-empty" role="status"><RefreshCw size={24} className="pp-spin"/><p>Đang tải yêu cầu hoàn tiền…</p></div> : rows.length === 0 ? <div className="rf-history-empty"><span className="rf-history-empty-icon"><ClipboardList size={27}/></span><h3>{error ? 'Chưa tải được danh sách' : admin ? refundStatus === 'PENDING' ? 'Không có yêu cầu chờ xử lý' : 'Chưa có phiếu đã hoàn tiền' : 'Bạn chưa gửi yêu cầu hoàn tiền'}</h3><p>{error ? 'Vui lòng tải lại để kiểm tra trạng thái yêu cầu.' : admin ? refundStatus === 'PENDING' ? 'Các yêu cầu mới của khách sẽ xuất hiện tại đây.' : 'Các phiếu được xác nhận hoàn tiền sẽ được lưu tại đây.' : 'Sau khi gửi thành công, bạn có thể theo dõi tiến trình và kết quả tại đây.'}</p></div> : <div className="rf-request-list">{rows.map(row => <article key={row.transactionId} className="rf-request-row">
        <div className="rf-request-info"><div className="rf-request-id"><span className="rf-receipt-icon"><ReceiptText size={20}/></span><div><span className="tc-eyebrow">PHIẾU HOÀN TIỀN</span><h3>Refund #{row.transactionId}</h3></div></div><strong className="rf-request-amount">{vnd(row.amount)}</strong><Link to={row.orderId ? (admin ? '/admin/orders' : '/orders') : (admin ? '/admin/schedule-payment-reviews' : `/my-tours/${row.participantId}`)}>{row.orderId ? `Đơn hàng #${row.orderId}` : `Vé tour #${row.participantId}`}</Link><p className="rf-request-date"><Clock3 size={13}/><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</time></p></div>
        <div className="rf-request-reason"><span className="rf-reason-heading"><MessageSquareText size={15}/>LÝ DO HOÀN TIỀN</span><p>{row.refundReason || 'Yêu cầu cũ chưa có lý do.'}</p>{row.status === 'SUCCEEDED' && <p>Hoàn lúc: {row.succeededAt ? new Date(row.succeededAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}{row.refundTransferReference && <> · Mã chuyển tiền: {row.refundTransferReference}</>}{row.refundConfirmationNote && <> · {row.refundConfirmationNote}</>}</p>}</div>
        <div className="rf-request-actions"><span className={`rf-status-badge ${row.status === 'SUCCEEDED' ? 'is-complete' : ''}`}><span className="rf-status-dot"/>{row.status === 'SUCCEEDED' ? 'Đã hoàn tiền' : row.status === 'PENDING' ? 'Chờ xử lý' : row.status}</span>{admin && row.status === 'PENDING' && <button className="pp-button" disabled={busy} onClick={() => { setError(''); setTransferReference(''); setConfirmationNote(''); setConfirmation(row); }}><CheckCircle2 size={15}/>Xác nhận đã hoàn tiền</button>}</div>
      </article>)}</div>}
      {!loading && (page > 0 || hasNext) && <nav className="rf-pagination" aria-label="Phân trang yêu cầu hoàn tiền"><span>Trang <strong>{page + 1}</strong></span><div><button type="button" disabled={page === 0 || busy} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16}/>Trang trước</button><button type="button" disabled={!hasNext || busy} onClick={() => setPage(value => value + 1)}>Trang sau<ChevronRight size={16}/></button></div></nav>}
    </section>
  </main>;
}
