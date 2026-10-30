import { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardList, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { vnd } from '../equipment/catalogApi';
import { refunds, type TransactionHistory, type RefundPreview } from './paymentApi';
import './payment-pages.css';
import { RefundTargetDetails } from './RefundTargetDetails';

const positiveId = (value: string | null) => value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

export function RefundsPage({ admin = false }: { admin?: boolean }) {
  const [params] = useSearchParams();
  const orderId = positiveId(params.get('orderId'));
  const participantId = positiveId(params.get('participantId'));
  const [rows, setRows] = useState<TransactionHistory[]>([]);
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<RefundPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [submitted, setSubmitted] = useState<TransactionHistory | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [confirmation, setConfirmation] = useState<TransactionHistory | null>(null);
  const fetchPage = useCallback(async () => {
    const request = admin ? refunds.pending : refunds.mine;
    const data = await request(page);
    // A full page alone does not prove that another page exists.
    const next = data.length === 20 ? await request(page + 1) : [];
    return { data, hasNext: next.length > 0 };
  }, [admin, page]);
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
    if (!admin && !reason.trim()) { setError('Vui lòng nhập lý do hoàn tiền.'); return; }
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = admin && id ? await refunds.confirm(id)
        : orderId && !participantId ? await refunds.request({ orderId, reason: reason.trim() })
        : participantId && !orderId ? await refunds.request({ participantId, reason: reason.trim() })
        : null;
      if (!result) throw new Error('Select exactly one order or tour ticket.');
      setNotice(result.status === 'SUCCEEDED'
        ? `Refund #${result.transactionId}: manual money return confirmed.`
        : `Request #${result.transactionId} received for ${vnd(result.amount)}. Money has not been returned yet.`);
      if (!admin) setSubmitted(result);
      setConfirmation(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to process refund.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const targetRows = [...rows, ...(submitted ? [submitted] : [])].filter(row => orderId ? row.orderId === orderId : row.participantId === participantId);
  return <main className="payment-pages space-y-5">
    <div className="pp-card pp-body"><h1 className="text-2xl font-bold">{admin ? 'Quản lý hoàn tiền thủ công' : 'Yêu cầu hoàn tiền'}</h1>
      <p>{admin ? 'Chỉ xác nhận sau khi đã chuyển tiền lại cho khách bên ngoài hệ thống.' : 'Kiểm tra đơn hàng hoặc vé tour, bổ sung lý do và gửi yêu cầu để được hỗ trợ.'}</p>
      {!admin && <div className="pp-actions"><Link className="pp-text-link" to="/orders">My Orders</Link><Link className="pp-text-link" to="/my-tours">My Tours</Link></div>}
    </div>
    {error && <div className="pp-error" role="alert">{error}</div>}{notice && <p className="pp-note" role="status">{notice}</p>}
    {!admin && (orderId || participantId) && <div className="rf-request-layout">
      <section className="pp-card pp-body"><RefundTargetDetails orderId={orderId} participantId={participantId}/>
        <form className="rf-reason-form" onSubmit={e => { e.preventDefault(); void submit(); }}>
          <label htmlFor="refund-reason">Lý do yêu cầu hoàn tiền <span>*</span></label>
          <p>Cho chúng tôi biết vì sao bạn muốn hoàn tiền để chi nhánh xử lý yêu cầu.</p>
          <textarea id="refund-reason" required maxLength={2000} rows={5} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ví dụ: Tôi thay đổi lịch trình và không thể tham gia chuyến đi…" disabled={busy || targetRows.some(row => row.status === 'PENDING')}/>
          <small>{reason.length}/2000 ký tự</small>
          <p className="rf-policy">Yêu cầu được kiểm tra trước khi hoàn tiền thủ công. Gửi yêu cầu không tự hủy đơn hoặc vé và chưa có nghĩa tiền đã được hoàn.</p>
          <button type="submit" className="pp-button" disabled={busy || loading || !preview || preview.refundableAmount <= 0 || !reason.trim() || targetRows.some(row => row.status === 'PENDING')}>{busy ? 'Đang gửi…' : targetRows.some(row => row.status === 'PENDING') ? 'Đã gửi yêu cầu hoàn tiền' : 'Gửi yêu cầu hoàn tiền'}</button>
        </form>
      </section>
      <aside className="pp-card pp-summary rf-money"><h2>Số tiền hoàn dự kiến</h2>{previewError ? <p className="pp-error" role="alert">{previewError}</p> : !preview ? <p>Đang kiểm tra thanh toán…</p> : <><dl><div><dt>Đã thanh toán thành công</dt><dd>{vnd(preview.receivedAmount)}</dd></div><div><dt>Đã hoàn trước đó</dt><dd>{vnd(preview.refundedAmount)}</dd></div></dl><div className="pp-total"><span>ĐỀ NGHỊ HOÀN TOÀN BỘ CÒN LẠI</span><strong>{vnd(preview.refundableAmount)}</strong></div><p>Số tiền được tính từ các giao dịch thành công. Hệ thống kiểm tra lại khi gửi và khi admin xác nhận.</p></>}</aside>
    </div>}
    {confirmation && <section className="pp-card pp-body" aria-label="Confirm manual refund"><h2 className="text-lg font-bold">Refund #{confirmation.transactionId} · {vnd(confirmation.amount)}</h2>
      <p>Bạn đã chuyển tiền lại cho khách? Xác nhận sẽ ghi nhận hoàn tiền thành công.</p><div className="rf-saved-reason"><strong>Lý do khách yêu cầu</strong><p>{confirmation.refundReason || 'Yêu cầu cũ chưa có lý do.'}</p></div>
      <div className="pp-actions"><button className="pp-button" disabled={busy} onClick={() => void submit(confirmation.transactionId)}>Confirm money returned</button><button className="pp-button secondary" disabled={busy} onClick={() => setConfirmation(null)}>Back</button></div>
    </section>}
    <section className="pp-card pp-body rf-history"><div className="rf-history-heading"><div><span className="tc-eyebrow">THEO DÕI HOÀN TIỀN</span><h2>{admin ? 'Yêu cầu chờ xử lý' : 'Yêu cầu đã gửi & kết quả'}</h2></div><button type="button" className="rf-refresh" disabled={busy || loading} onClick={() => { setError(''); void load().catch(e => setError(e instanceof Error ? e.message : 'Không thể tải lại.')); }}><RefreshCw size={15} className={loading ? 'pp-spin' : ''}/>Tải lại</button></div>
      {loading ? <div className="rf-history-empty" role="status"><RefreshCw size={24} className="pp-spin"/><p>Đang tải yêu cầu hoàn tiền…</p></div> : rows.length === 0 ? <div className="rf-history-empty"><span className="rf-history-empty-icon"><ClipboardList size={27}/></span><h3>{error ? 'Chưa tải được danh sách' : admin ? 'Không có yêu cầu chờ xử lý' : 'Bạn chưa gửi yêu cầu hoàn tiền'}</h3><p>{error ? 'Vui lòng tải lại để kiểm tra trạng thái yêu cầu.' : admin ? 'Các yêu cầu mới của khách sẽ xuất hiện tại đây.' : 'Sau khi gửi thành công, bạn có thể theo dõi tiến trình và kết quả tại đây.'}</p></div> : <div className="space-y-4">{rows.map(row => <article key={row.transactionId} className="border-b border-[#D8D2C5] py-4"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">Refund #{row.transactionId} · {vnd(row.amount)}</h3><p>{row.orderId ? `Order #${row.orderId}` : `Tour ticket #${row.participantId}`}</p><p>Ngày yêu cầu: {new Date(row.createdAt).toLocaleString('vi-VN')}</p><div className="rf-saved-reason"><strong>Lý do hoàn tiền</strong><p>{row.refundReason || 'Yêu cầu cũ chưa có lý do.'}</p></div></div><div><strong>{row.status === 'SUCCEEDED' ? 'Đã hoàn tiền' : row.status === 'PENDING' ? 'Chờ xử lý' : row.status}</strong>{admin && row.status === 'PENDING' && <div className="pp-actions"><button className="pp-button" disabled={busy} onClick={() => setConfirmation(row)}>Xác nhận đã hoàn tiền</button></div>}</div></div></article>)}</div>}
      {!loading && (page > 0 || hasNext) && <nav className="rf-pagination" aria-label="Phân trang yêu cầu hoàn tiền"><span>Trang <strong>{page + 1}</strong></span><div><button type="button" disabled={page === 0 || busy} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16}/>Trang trước</button><button type="button" disabled={!hasNext || busy} onClick={() => setPage(value => value + 1)}>Trang sau<ChevronRight size={16}/></button></div></nav>}
    </section>
  </main>;
}
