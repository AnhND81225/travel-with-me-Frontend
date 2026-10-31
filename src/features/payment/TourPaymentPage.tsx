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
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Unable to load ticket.'); }
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
      if (!url || result.status !== 'PENDING') throw new Error(result.zalopay_response?.return_message || 'Unable to create payment.');
      const destination = new URL(url);
      if (!['https:', 'http:'].includes(destination.protocol)) throw new Error('Invalid payment URL.');
      window.location.assign(destination.toString());
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to process payment.'); }
    finally { setBusy(false); }
  }
  const remaining = ticket?.expiresAt ? Math.floor((Date.parse(ticket.expiresAt) - now) / 1000) : 0;
  const received = payment?.status === 'SUCCEEDED';
  const confirmed = ticket && ['CONFIRMED', 'COMPLETED', 'NO_SHOW'].includes(ticket.participantStatus);
  const canPay = ticket?.participantStatus === 'PENDING' && remaining >= 300 && !received;
  const formatTime = (value: string | null | undefined) => value ? new Date(value).toLocaleString('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
  }) : 'Updating';
  const name = event?.eventName || 'Trip details';
  const cover = event?.coverImageUrl || event?.images[0]?.imageUrl;
  const expired = ticket && (['CANCELLED', 'EXPIRED'].includes(ticket.participantStatus) || remaining <= 0);
  const statusText = confirmed ? 'Ticket confirmed' : received ? 'Payment received · Ticket under review' : expired ? 'Ticket cancelled or expired' : 'Awaiting payment';
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
    <nav className="pp-breadcrumb" aria-label="Breadcrumb"><Link to="/my-tours">My Tours</Link><span>/</span><span>Ticket checkout #{id}</span></nav>
    <header className="tc-heading"><div><span className="tc-eyebrow">YOUR NEXT ADVENTURE</span><h1>Your next adventure</h1><p>Review your trip details and complete your ticket payment.</p></div><span className="tc-security"><LockKeyhole size={15}/> Pay with ZaloPay</span></header>
    {error && <div className="pp-error" role="alert">{error}</div>}
    <div className="pp-grid tc-layout">
      <div className="pp-main">
        <section className="pp-card tc-trip">
          <div className="tc-cover">{cover ? <img src={cover} alt={name} onError={e => { e.currentTarget.style.display = 'none'; }}/> : <Mountain size={90} strokeWidth={1}/>}
            <span className="tc-cover-tag"><Compass size={14}/>{event?.eventType === 'CAMPING' ? 'CAMPING' : 'TREKKING & EXPLORATION'}</span>
          </div>
          <div className="pp-body tc-trip-body"><div className="tc-trip-title"><div><span className="tc-eyebrow">YOUR TRIP</span><h2>{name}</h2>{event?.location && <p className="tc-location"><MapPin size={15}/>{event.location}</p>}</div><span className={'tc-status' + (confirmed ? ' is-confirmed' : '')}>{confirmed ? <CheckCircle2 size={14}/> : <Ticket size={14}/>} {statusText}</span></div>
            <div className="tc-details">
              <div><CalendarDays size={19}/><div><span>Departure</span><strong>{formatTime(schedule?.startDatetime)}</strong></div></div>
              <div><Clock3 size={19}/><div><span>Estimated end</span><strong>{formatTime(schedule?.endDatetime)}</strong></div></div>
              <div><MapPin size={19}/><div><span>Meeting point</span><strong>{event?.details?.meetingPoint || 'See your ticket details or contact the branch'}</strong></div></div>
              <div><Users size={19}/><div><span>Participants</span><strong>01 guest · Individual ticket</strong></div></div>
            </div>
            <div className="tc-reference"><span>Tour ticket <strong>#{id}</strong></span><span>Departure schedule <strong>{ticket ? `#${ticket.scheduleId}` : '—'}</strong></span>{event && <Link to={`/tours/${event.eventId}`}>View trip <ArrowRight size={14}/></Link>}</div>
          </div>
        </section>
        <section className="pp-card"><div className="pp-card-title"><MapPin size={18}/><h2>ORGANIZER & SUPPORT</h2></div>
          <div className="pp-body tc-participation">
            <div className="tc-organizer"><span className="tc-organizer-icon"><Compass size={24}/></span><div><span className="tc-eyebrow">ORGANIZING BRANCH</span><h3>{branchName || 'Branch information is being updated'}</h3><p>Support for your trip, departure schedule and ticket.</p></div></div>
            <dl className="tc-contact-details"><div><dt><MapPin size={16}/>Branch address</dt><dd>{branchAddress || 'Address not available'}</dd></div><div><dt><Phone size={16}/>Support phone</dt><dd>{callablePhone ? <a href={`tel:${callablePhone}`}>{branchPhone}</a> : 'Phone number not available'}</dd></div></dl>
            {ticket?.note && <div className="tc-customer-note"><span className="tc-eyebrow">YOUR NOTES</span><p>{ticket.note}</p></div>}
            <p className="tc-attendance-note"><ShieldCheck size={17}/>The branch address is for support. For your trip, go to the meeting point shown in the trip details above.</p>
          </div>
        </section>
      </div>
      <aside className="pp-side">
        <section className="pp-card pp-summary tc-summary"><div className="pp-summary-heading"><Ticket size={20}/><h2>Payment summary</h2></div><p className="tc-summary-name">{name}</p><dl><div><dt>Ticket price</dt><dd>{price !== undefined ? vnd(price) : '—'}</dd></div><div><dt>Quantity</dt><dd>01 guest</dd></div><div><dt>Ticket ID</dt><dd>#{id}</dd></div>{payment && <div><dt>Transaction ID</dt><dd>#{payment.transaction_id}</dd></div>}</dl><div className="pp-total"><span>{received || confirmed ? 'TICKET VALUE' : 'TOTAL DUE'}</span><strong>{price !== undefined ? vnd(price) : '—'}</strong><small>Price locked at the time of registration.</small></div>
          <div className="tc-payment-state"><span className="tc-status">{statusText}</span></div>
          {ticket?.participantStatus === 'PENDING' && !received && <div className="tc-deadline"><Clock3 size={18}/><div><strong>{remaining > 0 ? 'Reservation deadline' : 'Reservation expired'}</strong><p>{formatTime(ticket.expiresAt)}</p><small>Pay before the deadline to confirm your ticket.</small></div></div>}
          {received && !confirmed && <p className="tc-review" role="status">Payment received, but your ticket is not confirmed. Check again or contact the branch for assistance.</p>}
          {ticket?.participantStatus === 'PENDING' && remaining < 300 && !received && <p className="tc-review">New payment attempts require at least 5 minutes of reservation time. If you have already paid, check the result.</p>}
          {!received && !confirmed && <><div className="tc-provider"><span className="pp-zalo">Z</span><div><strong>ZaloPay</strong><small>Choose a payment method at checkout</small></div></div><button className="pp-button tc-pay" disabled={busy || !canPay} onClick={() => void act('pay')}><CreditCard size={17}/>{busy ? 'Processing…' : 'Pay for tour ticket'}<ArrowRight size={16}/></button></>}
          <button className="pp-button secondary tc-secondary" disabled={busy} onClick={() => void act('check')}><RefreshCw size={16}/>Check payment status</button>
          {payment?.status === 'PENDING' && <button className="tc-cancel" disabled={busy} onClick={() => void act('cancel')}>Cancel payment attempt</button>}
          <p className="pp-secure"><ShieldCheck size={14}/>Verified with the payment provider</p>
          <Link className="tc-ticket-link" to={`/my-tours/${id}`}>View tour ticket details <ArrowRight size={14}/></Link>
        </section>
        <Link className="tc-back" to="/my-tours"><ArrowLeft size={15}/>Back to My Tours</Link>
      </aside>
    </div>
  </main>;
}
