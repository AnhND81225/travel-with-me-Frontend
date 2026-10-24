import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, RefreshCw } from 'lucide-react';
import { participantApi, scheduleApi } from '../schedules/api';
import type { Participant } from '../schedules/types';
import { eventGuideApi } from '../../services/eventGuideApi';
import { payments, type Payment } from './paymentApi';
import { vnd } from '../equipment/catalogApi';

export function TourPaymentPage({ id }: { id: number }) {
  const [ticket, setTicket] = useState<Participant | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [name, setName] = useState('Vé tour');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const check = useCallback(async () => {
    const result = await payments.forParticipant(id);
    setPayment(result);
    const data = await participantApi.get(id);
    setTicket(data);
    return data;
  }, [id]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await payments.forParticipant(id);
        const data = await participantApi.get(id);
        if (!active) return;
        setPayment(result); setTicket(data); setError('');
        const schedule = await scheduleApi.get(data.scheduleId);
        const event = await eventGuideApi.getEvent(schedule.eventId);
        if (active) setName(event.eventName);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Không tải được vé.'); }
    };
    void load();
    const timer = window.setInterval(() => { setNow(Date.now()); if (document.visibilityState === 'visible') void load(); }, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [id]);
  async function act(action: 'pay' | 'check' | 'cancel') {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (action === 'check') { await check(); return; }
      if (action === 'cancel' && payment) { await payments.cancel(payment.transaction_id); await check(); return; }
      const result = await (payment?.status === 'PENDING' ? payments.retry : payments.create)({ participantId: id });
      setPayment(result);
      if (result.status === 'SUCCEEDED') { await check(); return; }
      const url = result.zalopay_response?.order_url;
      if (!url || result.status !== 'PENDING') throw new Error(result.zalopay_response?.return_message || 'Không tạo được thanh toán.');
      const destination = new URL(url);
      if (!['https:', 'http:'].includes(destination.protocol)) throw new Error('Đường dẫn thanh toán không hợp lệ.');
      window.location.assign(destination.toString());
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể xử lý thanh toán.'); }
    finally { setBusy(false); }
  }
  const remaining = ticket?.expiresAt ? Math.floor((Date.parse(ticket.expiresAt) - now) / 1000) : 0;
  const received = payment?.status === 'SUCCEEDED';
  const confirmed = ticket && ['CONFIRMED', 'COMPLETED', 'NO_SHOW'].includes(ticket.participantStatus);
  const canPay = ticket?.participantStatus === 'PENDING' && remaining >= 300 && !received;
  return <div className="payment-pages">
    <div className="pp-breadcrumb"><Link to="/my-tours">Tour của tôi</Link><span>/</span><span>Thanh toán vé #{id}</span></div>
    {error && <div className="pp-error" role="alert">{error}</div>}
    <div className="pp-grid"><section className="pp-card"><div className="pp-card-title"><CreditCard size={20}/><h2>THANH TOÁN VÉ TOUR</h2></div><div className="pp-body">
      <h3>{name}</h3><p>Vé #{id}{ticket ? ` · Lịch khởi hành #${ticket.scheduleId}` : ''}</p>
      <p>{confirmed ? 'Vé đã được xác nhận.' : received ? 'Đã nhận thanh toán. Vé chưa được xác nhận; vui lòng kiểm tra lại hoặc liên hệ chi nhánh để đối soát.' : ticket?.participantStatus === 'PENDING' ? `Giữ chỗ đến ${ticket.expiresAt ? new Date(ticket.expiresAt).toLocaleString('vi-VN') : '—'}` : `Trạng thái vé: ${ticket?.participantStatus || 'Đang tải…'}`}</p>
      {ticket?.participantStatus === 'PENDING' && remaining < 300 && !received && <p>Không thể mở lượt thanh toán mới khi thời gian giữ chỗ còn dưới 5 phút. Nếu đã trả tiền, hãy kiểm tra lại kết quả.</p>}
      <div className="pp-actions"><button className="pp-button" disabled={busy || !canPay} onClick={() => void act('pay')}><CreditCard size={16}/>Thanh toán</button><button className="pp-button secondary" disabled={busy} onClick={() => void act('check')}><RefreshCw size={16}/>Kiểm tra lại</button>{payment?.status === 'PENDING' && <button className="pp-button secondary" disabled={busy} onClick={() => void act('cancel')}>Hủy lượt thanh toán</button>}</div>
    </div></section><aside className="pp-card pp-summary"><h2>Chi tiết thanh toán</h2><dl><div><dt>Vé tour</dt><dd>#{id}</dd></div><div><dt>Giao dịch</dt><dd>{payment ? `#${payment.transaction_id}` : '—'}</dd></div><div><dt>Thanh toán</dt><dd>{payment?.status || 'Chưa thanh toán'}</dd></div></dl><div className="pp-total"><span>GIÁ VÉ</span><strong>{ticket ? vnd(ticket.registeredPrice) : '—'}</strong></div><Link className="pp-button" to={`/my-tours/${id}`}>Xem vé tour</Link></aside></div>
  </div>;
}
