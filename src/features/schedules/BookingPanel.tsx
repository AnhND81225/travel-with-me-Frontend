import { useCallback, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { scheduleApi } from './api';
import { errorMessage, useClock, usePages, useResource, useScheduleAccount } from './hooks';
import { bookable, dateTime, money, validId } from './rules';
import { Dialog, Loading, Message, More, Status } from './ui';
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
      setError(message.includes('This ticket has an existing payment')
        ? 'This departure cannot be booked again because the previous ticket has an existing payment. Open My Tours → previous ticket → Check payment result, or contact the branch. You can also choose another open departure.'
        : `${message} Check My Tours before retrying if the connection was interrupted.`);
      list.refresh();
    }
    finally { submitting.current = false; setBusy(false); }
  }
  return <div className="m5 m5-booking"><p className="m5-eyebrow">BOOK YOUR TOUR</p><h2>{money(price)} <small>/ guest</small></h2><p className="m5-muted">Choose a departure · Vietnam time (UTC+7)</p>
    <div className="m5-departures">{departures.map(s => <label className={`m5-departure ${selected === s.id ? 'is-selected' : ''}`} key={s.id}>
      <input type="radio" name="departure" checked={selected === s.id} onChange={() => setParams(previous => { const next = new URLSearchParams(previous); next.set('schedule', String(s.id)); return next; }, { replace: true })} />
      <span><strong>{dateTime(s.startDatetime)}</strong><small>Until {dateTime(s.endDatetime)}</small><small>{branches.data?.find(b => b.id === s.branchId)?.name || `Branch #${s.branchId}`} · Departure #{s.id}</small><Status value={s.status} /><small>Remaining: {Math.max(0, s.maxParticipants - s.currentParticipants)}/{s.maxParticipants} spots · Closes {dateTime(s.registrationClosesAt)}</small>{!bookable(s, now) && <small>Registration is currently closed.</small>}</span>
    </label>)}</div>
    {!list.loading && !list.error && !list.items.length && <Message>No departures are available for this tour yet.</Message>}<More list={list} />
    {direct.error && <Message error>{direct.error}</Message>}
    {schedule && <p className="m5-muted">Guide: {guide.data?.displayName || (schedule.guideId ? `#${schedule.guideId}` : 'Unassigned')}</p>}
    {auth.error && <><Message error>{auth.error}</Message><button onClick={auth.refresh}>Retry authentication</button></>}
    {auth.loading ? <Loading /> : !auth.data ? <Link className="m5-primary" to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>Sign in to register</Link> : auth.data.role !== 'CUSTOMER' ? <Message>Tour registration is available to customer accounts.</Message> : <button className="m5-primary" disabled={!schedule || !bookable(schedule, now) || !!auth.error} onClick={() => { setError(''); setOpen(true); }}>Reserve My Spot</button>}
    <p className="m5-muted">One spot per account per departure. The price is locked when registration succeeds.</p>{auth.data?.role === 'CUSTOMER' && <Link to="/my-tours">My Tour Tickets →</Link>}
    {open && schedule && <Dialog title="Confirm Reservation" busy={busy} onClose={() => setOpen(false)}><form onSubmit={register}><h3>{eventName}</h3><p>{dateTime(schedule.startDatetime)} → {dateTime(schedule.endDatetime)}</p><p>{auth.data?.fullName} · One guest · {money(price)}</p><label>Notes<textarea maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></label><Message>Reservations expire. Your ticket shows the payment confirmation deadline. Cancelling a confirmed ticket requires reconciliation.</Message>{error && <Message error>{error}</Message>}<Link to="/my-tours">Check My Tickets</Link><button className="m5-primary" disabled={busy || !bookable(schedule, now)}>{busy ? 'Reserving…' : 'Confirm Registration'}</button></form></Dialog>}
  </div>;
}

export function ScheduleSummary({ schedule }: { schedule: Schedule }) {
  return <div className="m5-grid"><div><small>DEPARTURE · UTC+7</small><strong>{dateTime(schedule.startDatetime)}</strong></div><div><small>END</small><strong>{dateTime(schedule.endDatetime)}</strong></div><div><small>REGISTRATION CLOSES</small><strong>{dateTime(schedule.registrationClosesAt)}</strong></div><div><small>RESERVED / CAPACITY</small><strong>{schedule.currentParticipants} / {schedule.maxParticipants}</strong></div></div>;
}
