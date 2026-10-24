import { useCallback, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Mountain, Plus, Users } from 'lucide-react';
import { eventGuideApi, type EventSummary, type PublicGuide } from '../../services/eventGuideApi';
import type { Account, Branch } from '../equipment/catalogApi';
import { useAuth } from '../../hooks/useAuth';
import { participantApi, scheduleApi } from './api';
import { errorMessage, managedBranches, useClock, usePages, useResource } from './hooks';
import { attendance, cancellable, dateTime, editable, labels, money, payable, toLocal, toOffset, transitions, validId, validateDates } from './rules';
import { Dialog, Loading, Message, More, Page, Status, Timeline } from './ui';
import { ScheduleSummary } from './BookingPanel';
import type { Participant, Schedule, ScheduleStatus } from './types';

type Context = { account: Account; branches: Branch[]; events: EventSummary[]; guides: PublicGuide[] };
async function lookups(): Promise<{ events: EventSummary[]; guides: PublicGuide[] }> {
  const [events, guides] = await Promise.all([
    (async () => { const items: EventSummary[] = []; let page = 0, total = 1; while (page < total) { const result = await eventGuideApi.listEvents({ page: page++, size: 100 }); total = result.totalPages; items.push(...result.items); } return items; })(),
    (async () => { const items: PublicGuide[] = []; let page = 0, total = 1; while (page < total) { const result = await eventGuideApi.listGuides({ page: page++, size: 100 }); total = result.totalPages; items.push(...result.items); } return items; })(),
  ]);
  return { events, guides };
}
function useContext() {
  return useResource(useCallback(async () => {
    const account = await scheduleApi.me();
    if (account.status !== 'ACTIVE') throw new Error('Your account is inactive.');
    if (account.role === 'GUIDE') return { account, branches: [], events: [], guides: [] };
    const [branches, reference] = await Promise.all([managedBranches(account), lookups()]);
    return { account, branches, ...reference };
  }, []));
}
const contextError = (message: string) => `Unable to load operations information: ${message}`;
export function SchedulesPage() {
  const context = useContext();
  if (context.loading) return <Page title="Departure"><Loading /></Page>;
  if (context.error || !context.data) return <Page title="Departure"><Message error>{contextError(context.error)}</Message><button onClick={context.refresh}>Retry</button></Page>;
  return <ScheduleList context={context.data} />;
}
function ScheduleList({ context: c }: { context: Context }) {
  const root = useLocation().pathname.startsWith('/admin') ? '/admin' : '/staff';
  const [branch, setBranch] = useState(c.account.role === 'STAFF' ? String(c.branches[0]?.id || '') : '');
  const [event, setEvent] = useState(''), [status, setStatus] = useState(''), [create, setCreate] = useState(false);
  const navigate = useNavigate();
  const allowed = c.account.role === 'ADMIN' || !!branch && c.branches.some(b => b.id === Number(branch));
  const list = usePages(useCallback((page: number) => allowed ? scheduleApi.list({ page, branchId: branch ? Number(branch) : undefined, eventId: event ? Number(event) : undefined, status }) : Promise.resolve([]), [allowed, branch, event, status]));
  return <Page title="Departure" subtitle="Manage departures, capacity and participants · Vietnam time (UTC+7)." action={<button className="m5-primary" disabled={!c.branches.length} onClick={() => setCreate(true)}><Plus size={17} /> Create Departure</button>}>
    <div className="m5-toolbar"><label>Branch<select value={branch} onChange={e => setBranch(e.target.value)}>{c.account.role === 'ADMIN' && <option value="">All branches</option>}{c.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label>Tour<select value={event} onChange={e => setEvent(e.target.value)}><option value="">All tours</option>{c.events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}</select></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['OPEN', 'FULL', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></label><button onClick={list.refresh}>Refresh</button><Link to={`${root}/schedule-payment-reviews`}>Payment Reviews →</Link></div>
    {!allowed && <Message error>No active branch assignment was found. Contact your administrator.</Message>}
    <div className="m5-ticket-grid">{list.items.map(s => <Link className="m5-card m5-ticket-link" key={s.id} to={`${root}/schedules/${s.id}`}><div className="m5-row"><CalendarDays size={23} /><Status value={s.status} /></div><h2>{c.events.find(e => e.eventId === s.eventId)?.eventName || `Tour #${s.eventId}`}</h2><p>{c.branches.find(b => b.id === s.branchId)?.name || `Branch #${s.branchId}`} · Departure #{s.id}</p><strong>{dateTime(s.startDatetime)}</strong><p>Until {dateTime(s.endDatetime)}</p><div className="m5-row"><span><Users size={15} /> {s.currentParticipants}/{s.maxParticipants} reserved spots</span><span>View Participants →</span></div></Link>)}</div>
    {!list.loading && !list.error && !list.items.length && <Message>No departures match these filters.</Message>}<More list={list} />
    {create && <ScheduleEditor context={c} onClose={() => setCreate(false)} onSaved={s => navigate(`${root}/schedules/${s.id}`)} />}
  </Page>;
}

function ScheduleEditor({ context: c, schedule: s, onClose, onSaved }: { context: Context; schedule?: Schedule; onClose: () => void; onSaved: (s: Schedule) => void }) {
  const [eventId, setEventId] = useState(String(s?.eventId || c.events[0]?.eventId || ''));
  const [branchId, setBranchId] = useState(String(s?.branchId || c.branches[0]?.id || ''));
  const [guideId, setGuideId] = useState(s?.guideId ? String(s.guideId) : '');
  const [capacity, setCapacity] = useState(String(s?.maxParticipants || 16));
  const [start, setStart] = useState(s ? toLocal(s.startDatetime) : ''), [end, setEnd] = useState(s ? toLocal(s.endDatetime) : ''), [cutoff, setCutoff] = useState(s ? toLocal(s.registrationClosesAt) : '');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const lock = useRef(false);
  async function save(e: FormEvent) {
    e.preventDefault(); if (lock.current) return;
    const invalid = !s ? validateDates(start, end, cutoff || start) : '';
    if (invalid) { setError(invalid); return; }
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < Math.max(1, s?.currentParticipants || 0)) { setError('Capacity must be a positive whole number and cannot be lower than the number of reserved spots.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const fields = { guideId: guideId ? Number(guideId) : null, maxParticipants: Number(capacity) };
      const result = s ? await scheduleApi.update(s.id, fields) : await scheduleApi.create({ ...fields, eventId: Number(eventId), branchId: Number(branchId), startDatetime: toOffset(start), endDatetime: toOffset(end), registrationClosesAt: toOffset(cutoff || start) });
      onSaved(result);
    } catch (e) { setError(`${errorMessage(e)} If the connection was interrupted, close and reload the list before retrying.`); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Dialog title={s ? 'Edit Guide & Capacity' : 'Create Departure'} busy={busy} onClose={onClose}><form onSubmit={save}>
    {!s && <><label>Published tour<select required value={eventId} onChange={e => setEventId(e.target.value)}><option value="">Choose a tour</option>{c.events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}</select></label><label>Branch<select required value={branchId} onChange={e => setBranchId(e.target.value)}><option value="">Choose a branch</option>{c.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label>Departure · UTC+7<input type="datetime-local" required value={start} onChange={e => setStart(e.target.value)} /></label><label>End · UTC+7<input type="datetime-local" required value={end} onChange={e => setEnd(e.target.value)} /></label><label>Registration closes · UTC+7<input type="datetime-local" value={cutoff} onChange={e => setCutoff(e.target.value)} /><small>Leave blank to close registration at departure.</small></label></>}
    <label>Guide<select value={guideId} onChange={e => setGuideId(e.target.value)}><option value="">Unassigned / remove assignment</option>{s?.guideId && !c.guides.some(g => g.guideId === s.guideId) && <option value={s.guideId}>Guide #{s.guideId} (current)</option>}{c.guides.map(g => <option key={g.guideId} value={g.guideId}>{g.displayName} · {g.specialization}</option>)}</select></label><label>Capacity<input type="number" required min={Math.max(1, s?.currentParticipants || 0)} step={1} value={capacity} onChange={e => setCapacity(e.target.value)} /></label><p className="m5-muted">The server checks guide availability and scheduling conflicts when saving.</p>{error && <Message error>{error}</Message>}<button className="m5-primary" disabled={busy || !c.branches.length}>{busy ? 'Saving…' : 'Save Departure'}</button>
  </form></Dialog>;
}
export function ScheduleDetailPage() {
  const id = validId(useParams().id);
  if (!id) return <Page title="Invalid Departure ID" />;
  return <ScheduleDetail key={id} id={id} />;
}
function ScheduleDetail({ id }: { id: number }) {
  const pathname = useLocation().pathname;
  const isGuide = pathname.startsWith('/guide');
  const resource = useResource<Schedule & { eventName?: string; branchName?: string }>(useCallback(() => isGuide ? scheduleApi.assignedDetail(id) : scheduleApi.get(id), [id, isGuide]));
  const context = useContext(), now = useClock();
  const root = pathname.startsWith('/admin') ? '/admin' : pathname.startsWith('/guide') ? '/guide' : '/staff';
  const [tab, setTab] = useState('overview'), [edit, setEdit] = useState(false), [action, setAction] = useState<ScheduleStatus | 'RESCHEDULE' | null>(null);
  const s = resource.data, c = context.data;
  const manager = !!s && !!c && (c.account.role === 'ADMIN' || c.account.role === 'STAFF' && c.branches.some(b => b.id === s.branchId));
  const saved = () => { setEdit(false); setAction(null); resource.refresh(); };
  return <Page title={`Departure #${id}`} subtitle="View departure details, participants and trip status." action={<Link to={`${root}/schedules`}>← Departures</Link>}>
    {(resource.loading || context.loading) && <Loading />}{resource.error && <><Message error>{resource.error}</Message><button onClick={resource.refresh}>Reload departure</button></>}{context.error && <><Message error>{contextError(context.error)}</Message><button onClick={context.refresh}>Retry operations information</button></>}
    {s && c && <><div className="m5-card"><div className="m5-row"><h2>{s.eventName || c.events.find(e => e.eventId === s.eventId)?.eventName || `Tour #${s.eventId}`}</h2><Status value={s.status} /></div><p>{s.branchName || c.branches.find(b => b.id === s.branchId)?.name || `Branch #${s.branchId}`} · Guide: {(isGuide ? c.account.fullName : c.guides.find(g => g.guideId === s.guideId)?.displayName) || (s.guideId ? `#${s.guideId}` : 'Unassigned')}</p><ScheduleSummary schedule={s} /><div className="m5-actions">{manager && editable(s, now) && <><button onClick={() => setEdit(true)}>Edit Guide / Capacity</button><button onClick={() => setAction('RESCHEDULE')}>Reschedule</button></>}{manager && transitions(s, now).map(target => <button className={target === 'CANCELLED' ? 'm5-danger' : ''} key={target} onClick={() => setAction(target)}>{({ OPEN: 'Reopen Registration', CLOSED: 'Close Registration', IN_PROGRESS: 'Start Trip', COMPLETED: 'Complete Trip', CANCELLED: 'Cancel Departure' } as Partial<Record<ScheduleStatus, string>>)[target]}</button>)}<button onClick={resource.refresh}>Refresh Departure</button></div></div>
    <nav className="m5-tabs" aria-label="Departure Details">{[['overview', 'Overview'], ['roster', 'Participants'], ['history', 'Departure History']].map(([key, name]) => <button key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)}>{name}</button>)}</nav>
    {tab === 'overview' && <div className="m5-card"><h2>Operations Information</h2><p>Reserved spots include pending tickets and historical reservations. This is not an attendance count.</p><p>Check-in normally opens 2 hours before departure and closes 30 minutes after. The departure must be closed or in progress. The server enforces the configured check-in window.</p><Link to={`/tours/${s.eventId}?schedule=${s.id}`}>View Public Tour →</Link></div>}
    {tab === 'roster' && <Roster schedule={s} manager={manager} onChanged={resource.refresh} />}{tab === 'history' && <ScheduleHistory id={id} />}
    {edit && <ScheduleEditor context={c} schedule={s} onClose={() => { setEdit(false); resource.refresh(); }} onSaved={saved} />}{action && <ScheduleAction schedule={s} action={action} onClose={() => { setAction(null); resource.refresh(); }} onSaved={saved} />}</>}
  </Page>;
}
function ScheduleHistory({ id }: { id: number }) {
  const list = usePages(useCallback((page: number) => scheduleApi.histories(id, page), [id]));
  return <div className="m5-card"><h2>Departure History</h2><Timeline rows={list.items} /><More list={list} /></div>;
}
function ScheduleAction({ schedule: s, action, onClose, onSaved }: { schedule: Schedule; action: ScheduleStatus | 'RESCHEDULE'; onClose: () => void; onSaved: () => void }) {
  const [start, setStart] = useState(toLocal(s.startDatetime)), [end, setEnd] = useState(toLocal(s.endDatetime)), [cutoff, setCutoff] = useState(toLocal(s.registrationClosesAt)), [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const lock = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (lock.current) return;
    if (!reason.trim()) { setError('Please enter a reason.'); return; }
    if (action === 'RESCHEDULE') { const invalid = validateDates(start, end, cutoff); if (invalid) { setError(invalid); return; } }
    lock.current = true; setBusy(true); setError('');
    try { if (action === 'RESCHEDULE') await scheduleApi.reschedule(s.id, { newStartDatetime: toOffset(start), newEndDatetime: toOffset(end), registrationClosesAt: toOffset(cutoff), changeReason: reason.trim() }); else await scheduleApi.status(s.id, action, reason.trim()); onSaved(); }
    catch (e) { setError(`${errorMessage(e)} Close and reload the departure to check its status before retrying.`); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Dialog title={action === 'RESCHEDULE' ? 'Reschedule Departure' : `Confirm: ${labels[action]}`} onClose={onClose} busy={busy}><form onSubmit={submit}>{action === 'RESCHEDULE' && <><p>Previous dates: {dateTime(s.startDatetime)} → {dateTime(s.endDatetime)}</p><label>New departure · UTC+7<input type="datetime-local" required value={start} onChange={e => setStart(e.target.value)} /></label><label>New end · UTC+7<input type="datetime-local" required value={end} onChange={e => setEnd(e.target.value)} /></label><label>New registration deadline · UTC+7<input type="datetime-local" required value={cutoff} onChange={e => setCutoff(e.target.value)} /></label><Message>Moving the deadline earlier may shorten existing reservations. Moving it later does not extend existing holds.</Message></>}{action === 'CANCELLED' && <Message>Cancelling this departure cancels pending and confirmed tickets and creates reconciliation requests. It does not confirm refunds.</Message>}{action === 'COMPLETED' && <Message>Checked-in tickets will be completed. Confirmed tickets without check-in will be marked as no-shows.</Message>}<label>Reason<textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label>{error && <Message error>{error}</Message>}<button disabled={busy} className={action === 'CANCELLED' ? 'm5-danger' : 'm5-primary'}>{busy ? 'Processing…' : 'Confirm Changes'}</button></form></Dialog>;
}
function Roster({ schedule: s, manager, onChanged }: { schedule: Schedule; manager: boolean; onChanged: () => void }) {
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const list = usePages(useCallback((page: number) => scheduleApi.roster(s.id, page), [s.id]));
  const [selected, setSelected] = useState<{ ticket: Participant; action: 'confirm' | 'cancel' | 'checkIn' | 'noShow' } | null>(null);
  const now = useClock();
  return <div className="m5-card"><div className="m5-row"><h2>Participant Roster</h2><button onClick={list.refresh}>Refresh List</button></div><p className="m5-muted">Search loaded participants by ticket ID, customer ID or notes. Ticket history is available to managers.</p>
    <label>Search loaded participants<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ticket ID, customer ID, notes" /></label>
    <div className="m5-table-wrap"><table><thead><tr><th>Ticket / Customer</th><th>Locked Price / Hold</th><th>Status</th><th>Actions</th></tr></thead><tbody>{list.items.filter(p => `${p.id} ${p.userId} ${p.note || ''}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))).map(p => { const flags = attendance(p, s, now); return <tr key={p.id}><td><b>Ticket #{p.id} · Customer #{p.userId}</b><small>{p.note || 'No notes'}</small>{manager && <button type="button" onClick={() => setHistoryId(p.id)}>Ticket History</button>}</td><td>{money(p.registeredPrice)}{p.participantStatus === 'PENDING' && <small>Until {dateTime(p.expiresAt)}</small>}</td><td><Status value={p.participantStatus} /><Status value={p.checkInStatus} /></td><td><div className="m5-actions">{manager && payable(p, s, now) && <button onClick={() => setSelected({ ticket: p, action: 'confirm' })}>Confirm Receipt</button>}{manager && cancellable(p, s, now) && <button className="m5-danger" onClick={() => setSelected({ ticket: p, action: 'cancel' })}>Cancel Ticket</button>}{flags.checkIn && <button onClick={() => setSelected({ ticket: p, action: 'checkIn' })}>Check In</button>}{flags.noShow && <button onClick={() => setSelected({ ticket: p, action: 'noShow' })}>No-show</button>}</div></td></tr>; })}</tbody></table></div>
    {!list.loading && !list.error && !list.items.length && <Message>No participants yet.</Message>}<More list={list} />{selected && <ParticipantAction ticket={selected.ticket} action={selected.action} onClose={() => { setSelected(null); list.refresh(); }} onSaved={() => { setSelected(null); list.refresh(); onChanged(); }} />}{historyId && manager && <Dialog title={`Ticket History #${historyId}`} onClose={() => setHistoryId(null)}><ParticipantHistory id={historyId} /></Dialog>}
  </div>;
}
function ParticipantHistory({ id }: { id: number }) {
  const list = usePages(useCallback((page: number) => participantApi.histories(id, page), [id]));
  return <><Timeline rows={list.items} /><More list={list} /></>;
}
function ParticipantAction({ ticket: p, action, onClose, onSaved }: { ticket: Participant; action: 'confirm' | 'cancel' | 'checkIn' | 'noShow'; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''); const lock = useRef(false);
  const titles = { confirm: 'Confirm Manual Payment', cancel: 'Cancel Customer Ticket', checkIn: 'Check In', noShow: 'Mark as No-show' };
  async function submit(e: FormEvent) {
    e.preventDefault(); if (lock.current) return; if (['confirm', 'cancel'].includes(action) && !value.trim()) { setError('Please fill in the required information.'); return; }
    lock.current = true; setBusy(true); setError('');
    try { if (action === 'confirm') await participantApi.confirm(p.id, p.registrationReference, value.trim()); else if (action === 'cancel') await participantApi.cancel(p.id, value.trim()); else if (action === 'checkIn') await participantApi.checkIn(p.id); else await participantApi.noShow(p.id); onSaved(); }
    catch (e) { setError(`${errorMessage(e)} Close and refresh the list to check the result before retrying.`); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Dialog title={titles[action]} busy={busy} onClose={onClose}><form onSubmit={submit}><p>Ticket #{p.id} · Customer #{p.userId} · {money(p.registeredPrice)}</p>{action === 'confirm' && <><Message>Confirm only after verifying the receipt. Tickets with payment transactions require reconciliation by the payment team.</Message><p>Registration reference: <code>{p.registrationReference}</code></p></>}{action === 'cancel' && <Message>Confirmed tickets require reconciliation. This does not mark them as refunded.</Message>}{['confirm', 'cancel'].includes(action) && <label>{action === 'confirm' ? 'Receipt / Payment reference' : 'Reason for cancelling the customer ticket'}<textarea required maxLength={action === 'confirm' ? 180 : 2000} value={value} onChange={e => setValue(e.target.value)} /></label>}{error && <Message error>{error}</Message>}<button className="m5-primary" disabled={busy}>{busy ? 'Processing…' : 'Confirm'}</button></form></Dialog>;
}
export function GuideLayout() {
  const { logout } = useAuth();
  return <div className="m5-guide"><aside aria-label="Guide navigation">
    <Link to="/guide/schedules"><Mountain /> TERRAPEAK · GUIDE</Link>
    <NavLink to="/guide/schedules">Assignments & Check-in</NavLink>
    <Link to="/tours">Browse Tours</Link>
    <Link to="/passport">My Profile</Link>
    <button type="button" onClick={logout}>Sign Out</button>
  </aside><Outlet /></div>;
}
export function GuideSchedulesPage() {
  const [status, setStatus] = useState('');
  const list = usePages(useCallback((page: number) => scheduleApi.assigned({ page, status }), [status]));
  return <Page title="My Assignments" subtitle="Your assigned departures · Vietnam time (UTC+7).">
    <div className="m5-toolbar"><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['OPEN', 'FULL', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></label><button onClick={list.refresh}>Refresh</button></div>
    <div className="m5-ticket-grid">{list.items.map(s => <Link className="m5-card m5-ticket-link" key={s.id} to={`/guide/schedules/${s.id}`}><div className="m5-row"><CalendarDays size={23} /><Status value={s.status} /></div><h2>{s.eventName}</h2><p>{s.branchName} · Departure #{s.id}</p><strong>{dateTime(s.startDatetime)}</strong><p>Until {dateTime(s.endDatetime)}</p><div className="m5-row"><span><Users size={15} /> {s.currentParticipants}/{s.maxParticipants} reserved spots</span><span>View & Check In →</span></div></Link>)}</div>
    {!list.loading && !list.error && !list.items.length && <Message>{status ? 'You have no assigned departures with this status.' : 'You have no assigned departures yet. They will appear when a branch assigns you.'}</Message>}<More list={list} />
  </Page>;
}
export function PaymentReviewsPage() {
  const context = useContext();
  if (context.loading) return <Page title="Payment Reviews"><Loading /></Page>;
  if (!context.data) return <Page title="Payment Reviews"><Message error>{context.error}</Message><button onClick={context.refresh}>Retry</button></Page>;
  return <Reviews context={context.data} />;
}
function Reviews({ context: c }: { context: Context }) {
  const [branch, setBranch] = useState(c.account.role === 'STAFF' ? String(c.branches[0]?.id || '') : '');
  const allowed = c.account.role === 'ADMIN' || !!branch && c.branches.some(b => b.id === Number(branch));
  const list = usePages(useCallback((page: number) => allowed ? participantApi.reviews(branch ? Number(branch) : undefined, page) : Promise.resolve([]), [branch, allowed]));
  return <Page title="Payment Reviews" subtitle="Requests for the payment team to review. These do not confirm refunds."><div className="m5-toolbar"><label>Branch<select value={branch} onChange={e => setBranch(e.target.value)}>{c.account.role === 'ADMIN' && <option value="">All branches</option>}{c.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><button onClick={list.refresh}>Refresh</button></div>{!allowed && <Message error>No branch assignment was found.</Message>}<div className="m5-table-wrap"><table><thead><tr><th>Request</th><th>Ticket / Transaction</th><th>Recorded Amount</th><th>Reason</th></tr></thead><tbody>{list.items.map(r => <tr key={r.id}><td>#{r.id}<small>{dateTime(r.createdAt)}</small>{r.kind}</td><td>Ticket #{r.participantId}<small>Transaction: {r.transactionId || 'None'}</small><code>{r.registrationReference}</code></td><td>{money(r.amount)}</td><td>{r.reason}</td></tr>)}</tbody></table></div>{!list.loading && !list.error && !list.items.length && <Message>No payment review requests in the loaded data.</Message>}<More list={list} /></Page>;
}
