import { useCallback, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { scheduleApi } from './api';
import { errorMessage, useClock, usePages, useResource, useScheduleAccount } from './hooks';
import { bookable, dateTime, money, validId } from './rules';
import { Dialog, Message } from './ui';
import { ArrowUpRight, CalendarDays, Check, ChevronRight, RefreshCw } from 'lucide-react';
import './booking-panel.css';
import type { Schedule } from './types';
import { eventGuideApi } from '../../services/eventGuideApi';

export function BookingPanel({ eventId, eventName, price }: { eventId: number; eventName: string; price: number }) {
  const list = usePages(useCallback((page: number) => scheduleApi.list({ eventId, page }), [eventId]));
  const branches = useResource(useCallback(() => scheduleApi.branches(), []));
  const auth = useScheduleAccount(), now = useClock(), navigate = useNavigate(), location = useLocation();
  const [params, setParams] = useSearchParams();
  const selected = validId(params.get('schedule'));
  const inPage = list.items.find(s => s.id === selected);
  const direct = useResource(useCallback(async () => {
    if (!selected || inPage) return null;
    const result = await scheduleApi.get(selected);
    if (result.eventId !== eventId) throw new Error('The selected departure does not belong to this tour.');
    return result;
  }, [selected, eventId, inPage]));
  const directSchedule = direct.data?.id === selected && direct.data.eventId === eventId ? direct.data : null;
  const schedule = inPage || directSchedule;
  const departures = directSchedule && !inPage ? [directSchedule, ...list.items] : list.items;
  const guide = useResource(useCallback(async () => schedule?.guideId ? eventGuideApi.getGuide(schedule.guideId) : null, [schedule?.guideId]));
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [note, setNote] = useState('');
  const submitting = useRef(false);
  async function register(e: FormEvent) {
    e.preventDefault(); if (!schedule || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try { const ticket = await scheduleApi.register(schedule.id, note); navigate(`/my-tours/${ticket.id}`); }
    catch (e) {
      const message = errorMessage(e);
      setError(message.includes('Vé có giao dịch cũ')
        ? 'Bạn đang đăng ký lại cùng lịch khởi hành. Vé cũ đã có giao dịch nên hệ thống hiện chưa hỗ trợ đặt lại vé này. Mở My Tours → vé cũ → Kiểm tra thanh toán để xem kết quả hoặc liên hệ chi nhánh đối soát. Bạn có thể chọn lịch khởi hành khác còn mở.'
        : `${message} Check My Tours before retrying if the connection was interrupted.`);
      list.refresh();
    }
    finally { submitting.current = false; setBusy(false); }
  }
  const hasAvailableDeparture = departures.some(item => bookable(item, now));
  return <div className="tour-booking">
    <p className="tour-booking-eyebrow">Hành trình của bạn bắt đầu từ đây</p>
    <h2>{money(price)} <small>/ khách</small></h2>
    <p className="tour-booking-caption">Giá mỗi người · Theo thông tin chuyến đi</p>
    <div className="tour-departure-heading"><CalendarDays size={17} aria-hidden="true" /><h3>Chọn lịch khởi hành</h3><span>UTC+7</span></div>
    <div aria-busy={list.loading} aria-live="polite">
      {list.loading && departures.length === 0 && <div className="tour-departure-loading" role="status"><span className="sr-only">Đang tải lịch khởi hành…</span><div /><div /></div>}
      {list.error && <div className="tour-departure-state" role="alert"><h4>Chưa thể tải lịch khởi hành</h4><p>Kết nối đang gián đoạn. Hãy thử lại để xem lịch và số chỗ mới nhất.</p><button type="button" onClick={list.loadMore} disabled={list.loading}><RefreshCw size={14} aria-hidden="true" />Thử lại</button></div>}
      {!list.loading && !list.error && !departures.length && <div className="tour-departure-state"><CalendarDays size={26} aria-hidden="true" /><h4>Hẹn bạn ở chuyến đi tiếp theo</h4><p>Lịch khởi hành mới đang được chuẩn bị. Bạn có thể quay lại sau hoặc khám phá những hành trình khác.</p><Link to="/tours">Khám phá chuyến đi khác <ArrowUpRight size={14} aria-hidden="true" /></Link><button type="button" className="tour-departure-recheck" onClick={list.refresh}><RefreshCw size={13} aria-hidden="true" />Kiểm tra lại lịch</button></div>}
    </div>
    {departures.length > 0 && <fieldset className="tour-departure-list"><legend className="sr-only">Lịch khởi hành của chuyến đi</legend>{departures.map(s => <label className={`tour-departure ${selected === s.id ? 'is-selected' : ''}`} key={s.id}>
      <input type="radio" name="departure" checked={selected === s.id} onChange={() => setParams(previous => { const next = new URLSearchParams(previous); next.set('schedule', String(s.id)); return next; }, { replace: true })} />
      <span className="tour-departure-content"><strong>{dateTime(s.startDatetime)}</strong><span className="tour-departure-end">Đến {dateTime(s.endDatetime)}</span><span className="tour-departure-branch">{branches.data?.find(b => b.id === s.branchId)?.name || 'Thông tin chi nhánh đang cập nhật'}</span><span className={`tour-departure-availability ${bookable(s, now) ? 'available' : ''}`}><span aria-hidden="true" />{bookable(s, now) ? `${Math.max(0, s.maxParticipants - s.currentParticipants)} / ${s.maxParticipants} chỗ còn trống` : s.status === 'FULL' ? 'Đã đủ chỗ' : 'Đã đóng đăng ký'}</span><span className="tour-departure-cutoff">Hạn đăng ký: {dateTime(s.registrationClosesAt)}</span></span>
      {selected === s.id && <Check size={15} aria-hidden="true" className="tour-departure-check" />}
    </label>)}</fieldset>}
    {list.loading && departures.length > 0 && <p className="tour-booking-caption" role="status">Đang tải thêm lịch…</p>}
    {!list.loading && !list.error && list.more && <button type="button" className="tour-load-departures" onClick={list.loadMore}>Xem thêm lịch khởi hành <ChevronRight size={14} aria-hidden="true" /></button>}
    {!list.loading && !list.error && departures.length > 0 && !hasAvailableDeparture && <p className="tour-booking-caption">Các lịch đang hiển thị hiện chưa nhận đăng ký. {list.more ? 'Xem thêm lịch để tìm chuyến phù hợp.' : 'Bạn có thể kiểm tra lại sau hoặc khám phá chuyến đi khác.'}</p>}
    {direct.loading && selected && !inPage && <p className="tour-booking-caption" role="status">Đang kiểm tra lịch đã chọn…</p>}
    {direct.error && <div className="tour-departure-state" role="alert"><p>Chưa thể mở lịch đã chọn. Hãy chọn lịch khác hoặc thử lại.</p><button type="button" onClick={direct.refresh}>Thử lại lịch đã chọn</button></div>}
    {schedule && <div className="tour-selected-guide"><span>Hướng dẫn viên</span><strong>{guide.loading ? 'Đang tải…' : guide.data?.displayName || 'Thông tin sẽ được cập nhật'}</strong>{guide.error && <button type="button" onClick={guide.refresh}>Thử tải lại</button>}</div>}
    {auth.error && <div className="tour-departure-state" role="alert"><p>Chưa thể kiểm tra tài khoản của bạn.</p><button type="button" onClick={auth.refresh}>Thử lại tài khoản</button></div>}
    {auth.loading ? <p className="tour-booking-caption" role="status">Đang kiểm tra tài khoản…</p> : !auth.data ? (hasAvailableDeparture ? <Link className="tour-reserve-button" to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search + location.hash)}`}>Đăng nhập để đặt chỗ <ArrowUpRight size={16} aria-hidden="true" /></Link> : <button className="tour-reserve-button" disabled>Chưa có lịch nhận đăng ký</button>) : auth.data.role !== 'CUSTOMER' ? <p className="tour-booking-caption">Đặt chỗ dành cho tài khoản khách hàng.</p> : <button className="tour-reserve-button" disabled={!schedule || !bookable(schedule, now) || !!auth.error} onClick={() => { setError(''); setOpen(true); }}>Đặt chỗ chuyến đi <ArrowUpRight size={16} aria-hidden="true" /></button>}
    {hasAvailableDeparture && <p className="tour-booking-reassurance">Chọn lịch và kiểm tra thông tin trước khi xác nhận.</p>}
    {auth.data?.role === 'CUSTOMER' && <Link className="tour-my-tickets" to="/my-tours">Vé chuyến đi của tôi <ArrowUpRight size={13} aria-hidden="true" /></Link>}
    {open && schedule && <Dialog title="Confirm Reservation" busy={busy} onClose={() => setOpen(false)}><form onSubmit={register}><h3>{eventName}</h3><p>{dateTime(schedule.startDatetime)} → {dateTime(schedule.endDatetime)}</p><p>{auth.data?.fullName} · One guest · {money(price)}</p><label>Notes<textarea maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></label><Message>Reservations expire. Your ticket shows the payment confirmation deadline. Cancelling a confirmed ticket requires reconciliation.</Message>{error && <Message error>{error}</Message>}<Link to="/my-tours">Check My Tickets</Link><button className="m5-primary" disabled={busy || !bookable(schedule, now)}>{busy ? 'Reserving…' : 'Confirm Registration'}</button></form></Dialog>}
  </div>;
}

export function ScheduleSummary({ schedule }: { schedule: Schedule }) {
  return <div className="m5-grid"><div><small>DEPARTURE · UTC+7</small><strong>{dateTime(schedule.startDatetime)}</strong></div><div><small>END</small><strong>{dateTime(schedule.endDatetime)}</strong></div><div><small>REGISTRATION CLOSES</small><strong>{dateTime(schedule.registrationClosesAt)}</strong></div><div><small>RESERVED / CAPACITY</small><strong>{schedule.currentParticipants} / {schedule.maxParticipants}</strong></div></div>;
}
