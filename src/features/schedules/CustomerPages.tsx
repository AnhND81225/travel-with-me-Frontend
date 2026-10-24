import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Ticket } from 'lucide-react';
import { eventGuideApi } from '../../services/eventGuideApi';
import { participantApi, scheduleApi } from './api';
import { errorMessage, useClock, usePages, useResource, useScheduleAccount } from './hooks';
import { bookable, cancellable, dateTime, money, validId } from './rules';
import { Dialog, Loading, Message, More, Page, Status, Timeline } from './ui';
import { ScheduleSummary } from './BookingPanel';
import type { Participant } from './types';

export function MyToursPage() {
  const auth = useScheduleAccount();
  if (auth.loading) return <Page title="My Tours"><Loading /></Page>;
  if (!auth.data) return <Page title="My Tours"><Message error>{auth.error || 'Please sign in.'}</Message></Page>;
  return <MyTickets userId={auth.data.id} />;
}
function MyTickets({ userId }: { userId: number }) {
  const loader = useCallback((page: number) => participantApi.mine(userId, page), [userId]);
  const list = usePages(loader);
  const scheduleCache = useRef(new Map<number, ReturnType<typeof scheduleApi.get>>());
  const eventCache = useRef(new Map<number, ReturnType<typeof eventGuideApi.getEvent>>());
  const summaries = useResource(useCallback(async () => {
    const schedules = await Promise.allSettled([...new Set(list.items.map(p => p.scheduleId))].map(id => {
      if (!scheduleCache.current.has(id)) scheduleCache.current.set(id, scheduleApi.get(id).catch(e => { scheduleCache.current.delete(id); throw e; }));
      return scheduleCache.current.get(id)!;
    }));
    const found = schedules.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    const events = await Promise.allSettled([...new Set(found.map(s => s.eventId))].map(id => {
      if (!eventCache.current.has(id)) eventCache.current.set(id, eventGuideApi.getEvent(id).catch(e => { eventCache.current.delete(id); throw e; }));
      return eventCache.current.get(id)!;
    }));
    return { schedules: found, events: events.flatMap(result => result.status === 'fulfilled' ? [result.value] : []) };
  }, [list.items]));
  return <Page title="My Tours" subtitle="Your tickets, departures and participation status." action={<Link className="m5-primary" to="/tours">Explore Tours</Link>}>
    <div className="m5-ticket-grid">{list.items.map(p => {
      const s = summaries.data?.schedules.find(s => s.id === p.scheduleId);
      const event = summaries.data?.events.find(e => e.eventId === s?.eventId);
      return <Link className="m5-card m5-ticket-link" key={p.id} to={`/my-tours/${p.id}`}>{event?.coverImageUrl ? <img className="m5-cover" src={event.coverImageUrl} alt="" /> : <Ticket size={27} />}<div className="m5-row"><h2>{event?.eventName || `Ticket #${p.id}`}</h2><Status value={p.participantStatus} /></div><p><CalendarDays size={15} /> {s ? dateTime(s.startDatetime) : `Departure #${p.scheduleId}`}</p><small>Ticket #{p.id} · Departure #{p.scheduleId}</small><p>Registered {dateTime(p.registrationDate)}</p><strong>{money(p.registeredPrice)}</strong>{p.participantStatus === 'PENDING' && <p>Held until {dateTime(p.expiresAt)}</p>}<Status value={p.checkInStatus} /><span>View ticket & departure →</span></Link>;
    })}</div>
    {!list.loading && !list.error && !list.items.length && <Message>You have no tour registrations yet. Choose a tour to get started.</Message>}<More list={list} />
  </Page>;
}
export function TicketDetailPage() {
  const id = validId(useParams().participantId);
  if (!id) return <Page title="Invalid Ticket ID"><Link to="/my-tours">Back to My Tickets</Link></Page>;
  return <TicketDetail key={id} id={id} />;
}
function TicketDetail({ id }: { id: number }) {
  const resource = useResource(useCallback(() => participantApi.get(id), [id]));
  const ticket = resource.data;
  const now = useClock(1000), refresh = resource.refresh;
  useEffect(() => {
    if (ticket?.participantStatus !== 'PENDING') return;
    const poll = () => { if (document.visibilityState === 'visible') refresh(); };
    const timer = window.setInterval(poll, 30000);
    window.addEventListener('focus', poll);
    return () => { clearInterval(timer); window.removeEventListener('focus', poll); };
  }, [ticket?.participantStatus, refresh]);
  const expiredAttempt = useRef('');
  useEffect(() => {
    if (ticket?.participantStatus === 'PENDING' && ticket.expiresAt && now >= Date.parse(ticket.expiresAt) && expiredAttempt.current !== ticket.registrationReference) {
      expiredAttempt.current = ticket.registrationReference; refresh();
    }
  }, [ticket, now, refresh]);
  return <Page title={`Tour Ticket #${id}`} subtitle="Times are shown in Vietnam time (UTC+7)." action={<Link to="/my-tours">← My Tours</Link>}>
    {resource.loading && <Loading />}{resource.error && <><Message error>{resource.error}</Message><button onClick={refresh}>Reload ticket</button></>}{ticket && <TicketContent ticket={ticket} refresh={refresh} now={now} />}
  </Page>;
}
function TicketContent({ ticket: p, refresh, now }: { ticket: Participant; refresh: () => void; now: number }) {
  // Refresh schedule alongside each fetched ticket, including a reschedule that leaves ticket status unchanged.
  const schedule = useResource(useCallback(() => scheduleApi.get(p.scheduleId), [p]));
  const histories = usePages(useCallback((page: number) => participantApi.histories(p.id, page), [p.id, p.participantStatus, p.registrationReference]));
  const s = schedule.data;
  const event = useResource(useCallback(async () => s ? eventGuideApi.getEvent(s.eventId) : null, [s?.eventId]));
  const branches = useResource(useCallback(() => scheduleApi.branches(), []));
  const [cancelOpen, setCancelOpen] = useState(false), [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const busyRef = useRef(false);
  const navigate = useNavigate();
  async function cancel(e: FormEvent) {
    e.preventDefault(); if (busyRef.current) return; busyRef.current = true; setBusy(true); setError('');
    try { await participantApi.cancel(p.id, reason); setCancelOpen(false); refresh(); }
    catch (e) { setError(`${errorMessage(e)} Check your ticket before taking another action.`); }
    finally { busyRef.current = false; setBusy(false); }
  }
  const remaining = Math.max(0, Math.ceil((Date.parse(p.expiresAt || '') - now) / 1000));
  return <><div className="m5-card"><div className="m5-row"><div><p className="m5-eyebrow">YOUR TICKET</p><h2>{event.data?.eventName || `Departure #${p.scheduleId}`}</h2></div><Status value={p.participantStatus} /></div>
    {event.data?.coverImageUrl && <img className="m5-cover" src={event.data.coverImageUrl} alt={event.data.eventName} />}
    <p>Locked price: <b>{money(p.registeredPrice)}</b></p><p>Registration reference: <code>{p.registrationReference}</code></p><Status value={p.checkInStatus} />
    {p.participantStatus === 'PENDING' && <Message>{remaining > 0 ? `Remaining: ${Math.floor(remaining / 60)} min ${remaining % 60} sec · Held until ${dateTime(p.expiresAt)}` : 'The reservation deadline has passed. Waiting for the server to update your ticket; it is not confirmed yet.'}</Message>}
    {p.participantStatus === 'PENDING' && <p className="m5-muted">Contact the branch for payment instructions before your reservation expires. Your ticket is confirmed when its status is updated.</p>}
    {p.note && <p>Notes: {p.note}</p>}{schedule.loading && <Loading />}{schedule.error && <><Message error>Unable to load departure: {schedule.error}</Message><button onClick={schedule.refresh}>Retry departure</button></>}
    {s && <><ScheduleSummary schedule={s} /><p>{branches.data?.find(b => b.id === s.branchId)?.name || `Branch #${s.branchId}`}</p>{event.data?.details?.meetingPoint && <p>Meeting point: {event.data.details.meetingPoint}</p>}<div className="m5-actions"><Link to={`/tours/${s.eventId}?schedule=${s.id}`}>View Tour</Link>{cancellable(p, s, now) && <button className="m5-danger" onClick={() => setCancelOpen(true)}>Cancel Registration</button>}{['CANCELLED', 'EXPIRED'].includes(p.participantStatus) && bookable(s, now) && <button onClick={() => navigate(`/tours/${s.eventId}?schedule=${s.id}`)}>Register Again</button>}</div></>}
    {['CANCELLED', 'EXPIRED'].includes(p.participantStatus) && <Message>This ticket is no longer valid. If a payment exists, contact the branch for reconciliation. Cancellation does not confirm a refund.</Message>}
  </div><div className="m5-card"><h2>Ticket History</h2><Timeline rows={histories.items} /><More list={histories} /></div>
    {cancelOpen && <Dialog title="Cancel Tour Registration" busy={busy} onClose={() => setCancelOpen(false)}><form onSubmit={cancel}><Message>Your spot will be released. Confirmed tickets enter reconciliation; this does not confirm a refund.</Message><label>Reason (optional)<textarea maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label>{error && <Message error>{error}</Message>}<button className="m5-danger" disabled={busy}>{busy ? 'Processing…' : 'Confirm Cancellation'}</button><button type="button" disabled={busy} onClick={() => { setCancelOpen(false); refresh(); }}>Close & Reload Ticket</button></form></Dialog>}
  </>;
}
