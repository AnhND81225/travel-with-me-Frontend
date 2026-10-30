import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, Compass, CreditCard, LockKeyhole, MapPin, Mountain, Phone, RefreshCw, ShieldCheck, Ticket, Users } from 'lucide-react';
import { participantApi, scheduleApi } from '../schedules/api';
import type { Participant, Schedule } from '../schedules/types';
import { eventGuideApi, type EventResponse } from '../../services/eventGuideApi';
import { payments, type Payment } from './paymentApi';
import { vnd, type Branch } from '../equipment/catalogApi';

export function TourPaymentPage({ id }: { id: number }) {
  const [ticket, setTicket] = useState<Participant | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
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
        const [tourResult, branchesResult] = await Promise.allSettled([
          eventGuideApi.getEvent(schedule.eventId), scheduleApi.branches(),
        ]);
        if (active) {
          setSchedule(schedule);
          if (tourResult.status === 'fulfilled') setEvent(tourResult.value);
          if (branchesResult.status === 'fulfilled') setBranch(branchesResult.value.find(item => item.id === schedule.branchId) || null);
        }
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
  const formatTime = (value: string | null | undefined) => value ? new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
  }) : 'Đang cập nhật';
  const name = event?.eventName || 'Thông tin chuyến đi';
  const cover = event?.coverImageUrl || event?.images[0]?.imageUrl;
  const expired = ticket && (['CANCELLED', 'EXPIRED'].includes(ticket.participantStatus) || remaining <= 0);
  const statusText = confirmed ? 'Vé đã xác nhận' : received ? 'Đã nhận thanh toán · Chờ đối soát vé' : expired ? 'Vé đã hủy hoặc hết hạn' : 'Chờ thanh toán';
  const price = ticket?.registeredPrice;
  const displayText = (value?: string | null) => {
    const text = value?.trim();
    return text && !/^(string|null|undefined)$/i.test(text) ? text : null;
  };
  const branchName = displayText(branch?.name);
  const branchAddress = displayText(branch?.address);
  const branchPhone = displayText(branch?.phone);
  const phoneTarget = branchPhone?.replace(/[^+\d]/g, '');
  const callablePhone = phoneTarget && /^\+?\d{8,15}$/.test(phoneTarget) ? phoneTarget : null;
  return <main className="payment-pages tour-checkout">
    <nav className="pp-breadcrumb" aria-label="Đường dẫn"><Link to="/my-tours">Tour của tôi</Link><span>/</span><span>Thanh toán vé #{id}</span></nav>
    <header className="tc-heading"><div><span className="tc-eyebrow">CHUẨN BỊ CHO HÀNH TRÌNH</span><h1>Chuyến đi tiếp theo của bạn</h1><p>Kiểm tra thông tin chuyến đi và hoàn tất thanh toán vé tour.</p></div><span className="tc-security"><LockKeyhole size={15}/> Thanh toán qua ZaloPay</span></header>
    {error && <div className="pp-error" role="alert">{error}</div>}
    <div className="pp-grid tc-layout">
      <div className="pp-main">
        <section className="pp-card tc-trip">
          <div className="tc-cover">{cover ? <img src={cover} alt={name} onError={e => { e.currentTarget.style.display = 'none'; }}/> : <Mountain size={90} strokeWidth={1}/>}
            <span className="tc-cover-tag"><Compass size={14}/>{event?.eventType === 'CAMPING' ? 'CẮM TRẠI' : 'TREKKING & KHÁM PHÁ'}</span>
          </div>
          <div className="pp-body tc-trip-body"><div className="tc-trip-title"><div><span className="tc-eyebrow">CHUYẾN ĐI CỦA BẠN</span><h2>{name}</h2>{event?.location && <p className="tc-location"><MapPin size={15}/>{event.location}</p>}</div><span className={'tc-status' + (confirmed ? ' is-confirmed' : '')}>{confirmed ? <CheckCircle2 size={14}/> : <Ticket size={14}/>} {statusText}</span></div>
            <div className="tc-details">
              <div><CalendarDays size={19}/><div><span>Khởi hành</span><strong>{formatTime(schedule?.startDatetime)}</strong></div></div>
              <div><Clock3 size={19}/><div><span>Kết thúc dự kiến</span><strong>{formatTime(schedule?.endDatetime)}</strong></div></div>
              <div><MapPin size={19}/><div><span>Điểm tập trung</span><strong>{event?.details?.meetingPoint || 'Xem chi tiết vé hoặc liên hệ chi nhánh'}</strong></div></div>
              <div><Users size={19}/><div><span>Người tham gia</span><strong>01 khách · Vé cá nhân</strong></div></div>
            </div>
            <div className="tc-reference"><span>Vé tour <strong>#{id}</strong></span><span>Lịch khởi hành <strong>{ticket ? `#${ticket.scheduleId}` : '—'}</strong></span>{event && <Link to={`/tours/${event.eventId}`}>Xem chuyến đi <ArrowRight size={14}/></Link>}</div>
          </div>
        </section>
        <section className="pp-card"><div className="pp-card-title"><MapPin size={18}/><h2>ĐƠN VỊ TỔ CHỨC & HỖ TRỢ</h2></div>
          <div className="pp-body tc-participation">
            <div className="tc-organizer"><span className="tc-organizer-icon"><Compass size={24}/></span><div><span className="tc-eyebrow">CHI NHÁNH PHỤ TRÁCH</span><h3>{branchName || 'Thông tin chi nhánh đang được cập nhật'}</h3><p>Hỗ trợ thông tin chuyến đi, lịch khởi hành và vé của bạn.</p></div></div>
            <dl className="tc-contact-details"><div><dt><MapPin size={16}/>Địa chỉ chi nhánh</dt><dd>{branchAddress || 'Chưa cập nhật địa chỉ'}</dd></div><div><dt><Phone size={16}/>Điện thoại hỗ trợ</dt><dd>{callablePhone ? <a href={`tel:${callablePhone}`}>{branchPhone}</a> : 'Chưa cập nhật số điện thoại'}</dd></div></dl>
            {ticket?.note && <div className="tc-customer-note"><span className="tc-eyebrow">GHI CHÚ CỦA BẠN</span><p>{ticket.note}</p></div>}
            <p className="tc-attendance-note"><ShieldCheck size={17}/>Địa chỉ chi nhánh là nơi liên hệ hỗ trợ. Khi tham gia, vui lòng đến điểm tập trung được ghi trong thông tin chuyến đi phía trên.</p>
          </div>
        </section>
      </div>
      <aside className="pp-side">
        <section className="pp-card pp-summary tc-summary"><div className="pp-summary-heading"><Ticket size={20}/><h2>Chi tiết thanh toán</h2></div><p className="tc-summary-name">{name}</p><dl><div><dt>Đơn giá vé</dt><dd>{price !== undefined ? vnd(price) : '—'}</dd></div><div><dt>Số lượng</dt><dd>01 khách</dd></div><div><dt>Mã vé</dt><dd>#{id}</dd></div>{payment && <div><dt>Mã giao dịch</dt><dd>#{payment.transaction_id}</dd></div>}</dl><div className="pp-total"><span>{received || confirmed ? 'GIÁ TRỊ VÉ TOUR' : 'TỔNG THANH TOÁN'}</span><strong>{price !== undefined ? vnd(price) : '—'}</strong><small>Giá vé được giữ tại thời điểm đăng ký.</small></div>
          <div className="tc-payment-state"><span className="tc-status">{statusText}</span></div>
          {ticket?.participantStatus === 'PENDING' && !received && <div className="tc-deadline"><Clock3 size={18}/><div><strong>{remaining > 0 ? 'Thời hạn giữ chỗ' : 'Đã hết hạn giữ chỗ'}</strong><p>{formatTime(ticket.expiresAt)}</p><small>Thanh toán trong hạn để xác nhận vé.</small></div></div>}
          {received && !confirmed && <p className="tc-review" role="status">Đã nhận tiền nhưng vé chưa được xác nhận. Kiểm tra lại hoặc liên hệ chi nhánh để đối soát.</p>}
          {ticket?.participantStatus === 'PENDING' && remaining < 300 && !received && <p className="tc-review">Không thể mở lượt thanh toán mới khi còn dưới 5 phút giữ chỗ. Nếu đã trả tiền, hãy kiểm tra kết quả.</p>}
          {!received && !confirmed && <><div className="tc-provider"><span className="pp-zalo">Z</span><div><strong>ZaloPay</strong><small>Chọn phương thức tại cổng thanh toán</small></div></div><button className="pp-button tc-pay" disabled={busy || !canPay} onClick={() => void act('pay')}><CreditCard size={17}/>{busy ? 'Đang xử lý…' : 'Thanh toán vé tour'}<ArrowRight size={16}/></button></>}
          <button className="pp-button secondary tc-secondary" disabled={busy} onClick={() => void act('check')}><RefreshCw size={16}/>Kiểm tra kết quả</button>
          {payment?.status === 'PENDING' && <button className="tc-cancel" disabled={busy} onClick={() => void act('cancel')}>Hủy lượt thanh toán</button>}
          <p className="pp-secure"><ShieldCheck size={14}/>Kết quả được xác minh với cổng thanh toán</p>
          <Link className="tc-ticket-link" to={`/my-tours/${id}`}>Xem chi tiết vé tour <ArrowRight size={14}/></Link>
        </section>
        <Link className="tc-back" to="/my-tours"><ArrowLeft size={15}/>Quay lại tour của tôi</Link>
      </aside>
    </div>
  </main>;
}
