import { useCallback, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, Compass, Filter, LogOut, MapPin, Mountain, Plus, RefreshCw, UserRound, Users } from 'lucide-react';
import { eventGuideApi, type EventSummary, type PublicGuide } from '../../services/eventGuideApi';
import type { Account, Branch } from '../equipment/catalogApi';
import { useAuth } from '../../hooks/useAuth';
import { PAGE_SIZE, participantApi, scheduleApi } from './api';
import { errorMessage, managedBranches, useClock, usePages, useResource } from './hooks';
import { attendance, cancellable, dateTime, editable, guideConflicts, labels, money, toLocal, toOffset, transitions, validId, validateDates } from './rules';
import { Dialog, Loading, Message, More, Page, Status, Timeline, TicketTimeline } from './ui';
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
function DepartureCover({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="schedule-card-cover">
    {src && !failed ? <img src={src} alt={name} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <div className="schedule-cover-placeholder"><Mountain size={36} strokeWidth={1.2} /><span>Tour image unavailable</span></div>}
  </div>;
}
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
  const reserved = list.items.reduce((sum, s) => sum + s.currentParticipants, 0);
  const capacity = list.items.reduce((sum, s) => sum + s.maxParticipants, 0);
  const occupancy = capacity ? Math.round(reserved / capacity * 100) : 0;
  const branchNames = new Map(c.branches.map(b => [b.id, b.name]));
  const eventNames = new Map(c.events.map(e => [e.eventId, e.eventName]));
  const eventCovers = new Map(c.events.map(e => [e.eventId, e.coverImageUrl]));
  return <div className="schedule-workspace"><Page title="Schedules & Departures" subtitle="Plan the journey. Manage departures, teams and every reserved spot." action={<div className="schedule-header-actions"><Link to={`${root}/schedule-payment-reviews`}>Payment Reviews <ArrowRight size={15} /></Link><button className="m5-primary" disabled={!c.branches.length} onClick={() => setCreate(true)}><Plus size={17} /> Create Departure</button></div>}>
    <div className="schedule-metrics" aria-label="Summary of loaded departures">
      <div className="schedule-metric"><span><CalendarDays size={17} /> Departures</span><strong>{list.items.length}</strong><small>Loaded with current filters</small></div>
      <div className="schedule-metric schedule-metric-orange"><span><Mountain size={17} /> Open for registration</span><strong>{list.items.filter(s => s.status === 'OPEN').length}</strong><small>Departures with open status</small></div>
      <div className="schedule-metric"><span><Users size={17} /> Reserved spots</span><strong>{reserved}<em> / {capacity}</em></strong><small>Across loaded departures</small></div>
      <div className="schedule-metric schedule-metric-dark"><span><Clock3 size={17} /> Capacity reserved</span><strong>{occupancy}%</strong><small>Reserved spots · not attendance</small></div>
    </div>
    <div className="schedule-filter-panel">
      <div className="schedule-filter-title"><span><Filter size={15} /> Filter departures</span><small>Vietnam time · UTC+7</small></div>
      <div className="m5-toolbar"><label>Branch<select value={branch} onChange={e => setBranch(e.target.value)}>{c.account.role === 'ADMIN' && <option value="">All branches</option>}{c.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label>Tour<select value={event} onChange={e => setEvent(e.target.value)}><option value="">All tours</option>{c.events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}</select></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['OPEN', 'FULL', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></label><button onClick={list.refresh} disabled={list.loading}><RefreshCw size={15} className={list.loading ? 'animate-spin' : ''} /> Refresh</button></div>
    </div>
    <div className="schedule-section-heading"><div><h2>Departure board</h2><p>Every journey, at a glance.</p></div><span>{list.items.length} departures loaded{list.more ? ' · more available' : ''}</span></div>
    {!allowed && <Message error>No active branch assignment was found. Contact your administrator.</Message>}
    <div className="m5-ticket-grid schedule-board">{list.items.map(s => {
      const fill = s.maxParticipants ? Math.min(100, Math.max(0, s.currentParticipants / s.maxParticipants * 100)) : 0;
      const start = new Date(s.startDatetime);
      return <Link className="schedule-departure-card" key={s.id} to={`${root}/schedules/${s.id}`}>
        <DepartureCover key={eventCovers.get(s.eventId) || 'placeholder'} src={eventCovers.get(s.eventId) || null} name={eventNames.get(s.eventId) || `Tour #${s.eventId}`} />
        <div className="schedule-card-top"><span className="schedule-reference">DEPARTURE #{String(s.id).padStart(3, '0')}</span><Status value={s.status} /></div>
        <div className="schedule-card-title"><div className="schedule-date"><span>{new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(start)}</span><strong>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(start)}</strong></div><div><h2>{eventNames.get(s.eventId) || `Tour #${s.eventId}`}</h2><p><MapPin size={13} /> {branchNames.get(s.branchId) || `Branch #${s.branchId}`}</p></div></div>
        <div className="schedule-timing"><div><span><CalendarDays size={14} /> Departure</span><strong>{dateTime(s.startDatetime)}</strong></div><div><span><Clock3 size={14} /> Return</span><strong>{dateTime(s.endDatetime)}</strong></div></div>
        <div className="schedule-capacity"><div><span><Users size={14} /> Reserved spots</span><strong>{s.currentParticipants}<small> / {s.maxParticipants}</small></strong></div><div className="schedule-progress" role="progressbar" aria-label="Reserved capacity" aria-valuenow={Math.round(fill)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${fill}%` }} /></div></div>
        <div className="schedule-card-footer"><span>{s.guideId ? (c.guides.find(g => g.guideId === s.guideId)?.displayName || `Guide #${s.guideId}`) : 'Guide unassigned'}</span><strong>View participants <ArrowRight size={15} /></strong></div>
      </Link>;
    })}</div>
    {!list.loading && !list.error && !list.items.length && <div className="schedule-empty"><CalendarDays size={32} /><h2>No departures found</h2><p>Try another branch, tour or status to find your next journey.</p></div>}<More list={list} />
    {create && <ScheduleEditor context={c} assignedBranchId={Number(branch)} onClose={() => setCreate(false)} onSaved={s => navigate(`${root}/schedules/${s.id}`)} />}
  </Page></div>;
}

function ScheduleEditor({ context: c, schedule: s, assignedBranchId, onClose, onSaved }: { context: Context; schedule?: Schedule; assignedBranchId?: number; onClose: () => void; onSaved: (s: Schedule) => void }) {
  const [eventId, setEventId] = useState(String(s?.eventId || c.events[0]?.eventId || ''));
  const staffBranch = c.account.role === 'STAFF' ? c.branches.find(b => b.id === assignedBranchId) || c.branches[0] : undefined;
  const [branchId, setBranchId] = useState(String(s?.branchId || c.branches[0]?.id || ''));
  const createBranchId = c.account.role === 'STAFF' ? staffBranch?.id : Number(branchId);
  const [guideId, setGuideId] = useState(s?.guideId ? String(s.guideId) : '');
  const [capacity, setCapacity] = useState(String(s?.maxParticipants || 16));
  const [start, setStart] = useState(s ? toLocal(s.startDatetime) : ''), [end, setEnd] = useState(s ? toLocal(s.endDatetime) : ''), [cutoff, setCutoff] = useState(s ? toLocal(s.registrationClosesAt) : '');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const lock = useRef(false);
  const availability = useResource(useCallback(async () => {
    const schedules: Schedule[] = [];
    for (let page = 0; ; page++) {
      const rows = await scheduleApi.list({ page });
      schedules.push(...rows);
      if (rows.length < PAGE_SIZE) return schedules;
    }
  }, []));
  const validWindow = !!start && !!end && Date.parse(toOffset(end)) > Date.parse(toOffset(start));
  const conflicts = guideConflicts(availability.data || [], toOffset(start), toOffset(end), s?.id);
  const selectedConflicts = conflicts.get(Number(guideId)) || [];
  const guideUnavailable = !!guideId && (!validWindow || availability.loading || !!availability.error || selectedConflicts.length > 0);
  const availableCount = c.guides.filter(g => !conflicts.has(g.guideId)).length;

  async function save(e: FormEvent) {
    e.preventDefault(); if (lock.current) return;
    if (guideUnavailable) { setError('Choose an available guide after checking the departure dates.'); return; }
    if (!s && (!createBranchId || !c.branches.some(b => b.id === createBranchId))) { setError('No active branch assignment was found. Contact your administrator.'); return; }
    const invalid = !s ? validateDates(start, end, cutoff || start) : '';
    if (invalid) { setError(invalid); return; }
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < Math.max(1, s?.currentParticipants || 0)) { setError('Capacity must be a positive whole number and cannot be lower than the number of reserved spots.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const fields = { guideId: guideId ? Number(guideId) : null, maxParticipants: Number(capacity) };
      const result = s ? await scheduleApi.update(s.id, fields) : await scheduleApi.create({ ...fields, eventId: Number(eventId), branchId: createBranchId!, startDatetime: toOffset(start), endDatetime: toOffset(end), registrationClosesAt: toOffset(cutoff || start) });
      onSaved(result);
    } catch (e) { setError(e instanceof TypeError ? `${errorMessage(e)} If the connection was interrupted, close and reload the list before retrying.` : errorMessage(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Dialog title={s ? 'Edit Guide & Capacity' : 'Create Departure'} busy={busy} onClose={onClose}><form onSubmit={save}>
    {!s && <><label>Published tour<select required value={eventId} onChange={e => setEventId(e.target.value)}><option value="">Choose a tour</option>{c.events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}</select></label><label>Branch{c.account.role === 'STAFF' ? <><input readOnly value={staffBranch?.name || 'No assigned branch'} /><small>Automatically assigned to your branch.</small></> : <select required value={branchId} onChange={e => setBranchId(e.target.value)}><option value="">Choose a branch</option>{c.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}</label><label>Departure · UTC+7<input type="datetime-local" required value={start} onChange={e => setStart(e.target.value)} /></label><label>End · UTC+7<input type="datetime-local" required value={end} onChange={e => setEnd(e.target.value)} /></label><label>Registration closes · UTC+7<input type="datetime-local" value={cutoff} onChange={e => setCutoff(e.target.value)} /><small>Leave blank to close registration at departure.</small></label></>}
    <label>Guide<select value={guideId} disabled={!validWindow || availability.loading || !!availability.error} onChange={e => { setGuideId(e.target.value); setError(''); }}><option value="">Unassigned / remove assignment</option>{s?.guideId && !c.guides.some(g => g.guideId === s.guideId) && <option value={s.guideId}>Guide #{s.guideId} (current)</option>}{[...c.guides].sort((a, b) => Number(conflicts.has(a.guideId)) - Number(conflicts.has(b.guideId))).map(g => <option key={g.guideId} value={g.guideId} disabled={conflicts.has(g.guideId)}>{g.displayName} · {conflicts.has(g.guideId) ? 'Schedule conflict' : 'Available'} · {g.specialization}</option>)}</select></label>
    {!validWindow ? <p className="m5-muted">Enter the departure and return times to see available guides.</p> : availability.loading ? <p className="m5-muted" role="status">Checking guide schedules…</p> : availability.error ? <><Message error>Unable to check guide availability. Please retry before selecting a guide.</Message><button type="button" onClick={availability.refresh}>Retry availability check</button></> : <div className="schedule-guide-availability"><div className="m5-row"><span><strong>{availableCount}</strong> available · <strong>{c.guides.length - availableCount}</strong> with conflicts</span><button type="button" onClick={availability.refresh}><RefreshCw size={13} /> Recheck</button></div>{selectedConflicts.length > 0 && <p role="alert">This guide is unavailable: {selectedConflicts.map(row => `${dateTime(row.startDatetime)} – ${dateTime(row.endDatetime)} (Departure #${row.id})`).join('; ')}. Choose another guide.</p>}</div>}
    <label>Capacity<input type="number" required min={Math.max(1, s?.currentParticipants || 0)} step={1} value={capacity} onChange={e => setCapacity(e.target.value)} /></label><p className="m5-muted">Availability is based on the loaded schedules. The server checks again when saving to catch any new assignments.</p>{error && <Message error>{error}</Message>}<button className="m5-primary" disabled={busy || !c.branches.length || guideUnavailable}>{busy ? 'Saving…' : 'Save Departure'}</button>
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
  const tour = c?.events.find(e => e.eventId === s?.eventId);
  const tourName = s?.eventName || tour?.eventName || `Tour #${s?.eventId}`;
  return <div className="schedule-detail-workspace"><Page title={`Departure #${id}`} subtitle="View departure details, participants and trip status." action={<Link to={`${root}/schedules`}>← Departures</Link>}>
    {(resource.loading || context.loading) && <Loading />}{resource.error && <><Message error>{resource.error}</Message><button onClick={resource.refresh}>Reload departure</button></>}{context.error && <><Message error>{contextError(context.error)}</Message><button onClick={context.refresh}>Retry operations information</button></>}
    {s && c && <><div className="schedule-detail-hero"><DepartureCover key={tour?.coverImageUrl || 'placeholder'} src={tour?.coverImageUrl || null} name={tourName} /><div className="schedule-detail-hero-content"><div className="m5-row"><span className="schedule-hero-kicker"><Mountain size={15} /> THE JOURNEY · #{String(id).padStart(3, '0')}</span><Status value={s.status} /></div><h2>{tourName}</h2><p><MapPin size={14} /> {s.branchName || c.branches.find(b => b.id === s.branchId)?.name || `Branch #${s.branchId}`} · Guide: {(isGuide ? c.account.fullName : c.guides.find(g => g.guideId === s.guideId)?.displayName) || (s.guideId ? `#${s.guideId}` : 'Unassigned')}</p><Link className="schedule-hero-link" to={`/tours/${s.eventId}?schedule=${s.id}`}>Explore public tour <ArrowRight size={15} /></Link></div></div><div className="schedule-detail-summary"><ScheduleSummary schedule={s} /></div><div className="schedule-detail-actions"><span className="schedule-action-caption">Departure controls</span><div className="m5-actions">{manager && editable(s, now) && <><button onClick={() => setEdit(true)}>Edit Guide / Capacity</button><button onClick={() => setAction('RESCHEDULE')}>Reschedule</button></>}{manager && transitions(s, now).map(target => <button className={target === 'CANCELLED' ? 'm5-danger' : ''} key={target} onClick={() => setAction(target)}>{({ OPEN: 'Reopen Registration', CLOSED: 'Close Registration', IN_PROGRESS: 'Start Trip', COMPLETED: 'Complete Trip', CANCELLED: 'Cancel Departure' } as Partial<Record<ScheduleStatus, string>>)[target]}</button>)}<button onClick={resource.refresh}><RefreshCw size={14} /> Refresh Departure</button></div></div>
    <nav className="m5-tabs" aria-label="Departure Details">{[['overview', 'Overview'], ['roster', 'Participants'], ['history', 'Departure History']].map(([key, name]) => <button key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)}>{name}</button>)}</nav>
    {tab === 'overview' && <div className="schedule-overview-grid"><div className="schedule-operations-panel"><span className="schedule-panel-kicker">FIELD OPERATIONS</span><h2>Ready for the journey</h2><div className="schedule-operation-note"><span className="schedule-note-icon"><Users size={20} /></span><div><h3>Reservations & capacity</h3><p>Reserved spots include pending tickets and historical reservations. This is not an attendance count.</p></div></div><div className="schedule-operation-note"><span className="schedule-note-icon"><Clock3 size={20} /></span><div><h3>Check-in window</h3><p>Check-in normally opens 2 hours before departure and closes 30 minutes after. The departure must be closed or in progress. The server enforces the configured check-in window.</p></div></div></div><aside className="schedule-capacity-panel"><span className="schedule-panel-kicker">GROUP CAPACITY</span><Users size={26} /><strong>{s.currentParticipants}<small> / {s.maxParticipants}</small></strong><p>reserved spots</p><div className="schedule-progress" role="progressbar" aria-label="Reserved capacity" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.maxParticipants ? Math.round(Math.min(100, Math.max(0, s.currentParticipants / s.maxParticipants * 100))) : 0}><span style={{ width: `${s.maxParticipants ? Math.min(100, Math.max(0, s.currentParticipants / s.maxParticipants * 100)) : 0}%` }} /></div><button onClick={() => setTab('roster')}>Manage participants <ArrowRight size={16} /></button><small>Review reservations and check-in details.</small></aside></div>}

    {tab === 'roster' && <Roster schedule={s} manager={manager} onChanged={resource.refresh} />}{tab === 'history' && <ScheduleHistory id={id} />}
    {edit && <ScheduleEditor context={c} schedule={s} onClose={() => { setEdit(false); resource.refresh(); }} onSaved={saved} />}{action && <ScheduleAction schedule={s} action={action} onClose={() => { setAction(null); resource.refresh(); }} onSaved={saved} />}</>}
  </Page></div>;
}
function ScheduleHistory({ id }: { id: number }) {
  const list = usePages(useCallback((page: number) => scheduleApi.histories(id, page), [id]));
  return <div className="m5-card"><h2>Departure History</h2><p className="m5-muted">Updates to the trip, guide assignment and booking availability.</p><Timeline rows={list.items} />{list.loading && <Loading />}{list.error && <><Message error>{list.error}</Message><button onClick={list.refresh}>Retry</button></>}{list.more && !list.loading && !list.error && <button onClick={list.loadMore}>Load more updates</button>}{!list.loading && !list.error && !list.items.length && <p>No updates yet.</p>}</div>;
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
  const [selected, setSelected] = useState<{ ticket: Participant; action: 'cancel' | 'checkIn' | 'noShow' } | null>(null);
  const now = useClock();
  return <div className="m5-card"><div className="m5-row"><h2>Participant Roster</h2><button onClick={list.refresh}>Refresh List</button></div><p className="m5-muted">Search loaded participants by ticket ID, customer ID or notes. Ticket history is available to managers.</p><Message>Tickets are confirmed automatically after verified ZaloPay payment. Admin approval is not required. Refresh the list to see the latest status.</Message>
    <label>Search loaded participants<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ticket ID, customer ID, notes" /></label>
    <div className="m5-table-wrap"><table><thead><tr><th>Ticket / Customer</th><th>Locked Price / Hold</th><th>Status</th><th>Actions</th></tr></thead><tbody>{list.items.filter(p => `${p.id} ${p.userId} ${p.note || ''}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))).map(p => { const flags = attendance(p, s, now); return <tr key={p.id}><td><b>Ticket #{p.id} · Customer #{p.userId}</b><small>{p.note || 'No notes'}</small>{manager && <button type="button" onClick={() => setHistoryId(p.id)}>Ticket history</button>}</td><td>{money(p.registeredPrice)}{p.participantStatus === 'PENDING' && <small>Until {dateTime(p.expiresAt)}</small>}</td><td><Status value={p.participantStatus} /><Status value={p.checkInStatus} /></td><td><div className="m5-actions">{manager && cancellable(p, s, now) && <button className="m5-danger" onClick={() => setSelected({ ticket: p, action: 'cancel' })}>Cancel Ticket</button>}{flags.checkIn && <button onClick={() => setSelected({ ticket: p, action: 'checkIn' })}>Check In</button>}{flags.noShow && <button onClick={() => setSelected({ ticket: p, action: 'noShow' })}>No-show</button>}</div></td></tr>; })}</tbody></table></div>
    {!list.loading && !list.error && !list.items.length && <Message>No participants yet.</Message>}<More list={list} />{selected && <ParticipantAction ticket={selected.ticket} action={selected.action} onClose={() => { setSelected(null); list.refresh(); }} onSaved={() => { setSelected(null); list.refresh(); onChanged(); }} />}{historyId && manager && <Dialog title={`Ticket history #${historyId}`} onClose={() => setHistoryId(null)}><ParticipantHistory id={historyId} /></Dialog>}
  </div>;
}
function ParticipantHistory({ id }: { id: number }) {
  const list = usePages(useCallback((page: number) => participantApi.histories(id, page), [id]));
  return <><p className="m5-muted">Follow your booking, payment and trip activity.</p><TicketTimeline rows={list.items} />{list.loading && <p role="status">Loading history…</p>}{list.error && <Message error>{list.error}</Message>}{list.more && !list.loading && <button onClick={list.loadMore}>Load more history</button>}{!list.loading && !list.error && !list.items.length && <p>No activity for this ticket yet.</p>}</>;
}
function ParticipantAction({ ticket: p, action, onClose, onSaved }: { ticket: Participant; action: 'cancel' | 'checkIn' | 'noShow'; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''); const lock = useRef(false);
  const titles = { cancel: 'Cancel Customer Ticket', checkIn: 'Check In', noShow: 'Mark as No-show' };
  async function submit(e: FormEvent) {
    e.preventDefault(); if (lock.current) return; if (action === 'cancel' && !value.trim()) { setError('Please fill in the required information.'); return; }
    lock.current = true; setBusy(true); setError('');
    try { if (action === 'cancel') await participantApi.cancel(p.id, value.trim()); else if (action === 'checkIn') await participantApi.checkIn(p.id); else await participantApi.noShow(p.id); onSaved(); }
    catch (e) { setError(`${errorMessage(e)} Close and refresh the list to check the result before retrying.`); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Dialog title={titles[action]} busy={busy} onClose={onClose}><form onSubmit={submit}><p>Ticket #{p.id} · Customer #{p.userId} · {money(p.registeredPrice)}</p>{action === 'cancel' && <Message>Confirmed tickets require reconciliation. This does not mark them as refunded.</Message>}{action === 'cancel' && <label>Reason for cancelling the customer ticket<textarea required maxLength={2000} value={value} onChange={e => setValue(e.target.value)} /></label>}{error && <Message error>{error}</Message>}<button className="m5-primary" disabled={busy}>{busy ? 'Processing…' : 'Confirm'}</button></form></Dialog>;
}
export function GuideLayout() {
  const { account, logout } = useAuth();
  return <div className="guide-console"><aside className="guide-sidebar" aria-label="Guide navigation">
    <Link className="guide-brand" to="/guide/schedules"><span><Mountain size={22} /></span><div><strong>TERRAPEAK</strong><small>GUIDE OPERATIONS</small></div></Link>
    <div className="guide-sidebar-caption">YOUR FIELD WORKSPACE</div>
    <nav><NavLink to="/guide/schedules"><CalendarDays size={17} /> Assignments & Check-in</NavLink><Link to="/tours"><Compass size={17} /> Browse Tours</Link><Link to="/passport"><UserRound size={17} /> My Profile</Link></nav>
    <div className="guide-sidebar-footer"><Link to="/"><ArrowLeft size={15} /> Return to Storefront</Link><button type="button" onClick={logout}><LogOut size={15} /> Sign Out</button></div>
  </aside><div className="guide-main"><header className="guide-topbar"><span><Compass size={17} /> GUIDE · FIELD OPERATIONS</span><div className="guide-account"><span className="guide-avatar">{account?.fullName?.charAt(0).toUpperCase() || 'G'}</span><div><strong>{account?.fullName || 'Tour Guide'}</strong><small>Expedition guide</small></div></div></header><main><Outlet /></main></div></div>;
}
export function GuideSchedulesPage() {
  const [status, setStatus] = useState('');
  const list = usePages(useCallback((page: number) => scheduleApi.assigned({ page, status }), [status]));
  const participants = list.items.reduce((sum, s) => sum + s.currentParticipants, 0);
  return <div className="schedule-workspace"><Page title="My Assignments" subtitle="Your next adventure starts here. Review your trips and welcome your group." action={<Link className="guide-browse-link" to="/tours">Explore tours <ArrowRight size={15} /></Link>}>
    <div className="schedule-metrics">
      <div className="schedule-metric"><span><CalendarDays size={17} /> Assigned departures</span><strong>{list.items.length}</strong><small>Loaded with current filters</small></div>
      <div className="schedule-metric schedule-metric-orange"><span><Compass size={17} /> In progress</span><strong>{list.items.filter(s => s.status === 'IN_PROGRESS').length}</strong><small>Trips currently in progress</small></div>
      <div className="schedule-metric"><span><CheckCircle2 size={17} /> Completed trips</span><strong>{list.items.filter(s => s.status === 'COMPLETED').length}</strong><small>Across loaded assignments</small></div>
      <div className="schedule-metric schedule-metric-dark"><span><Users size={17} /> Reserved spots</span><strong>{participants}</strong><small>Reservations · not attendance</small></div>
    </div>
    <div className="schedule-filter-panel"><div className="schedule-filter-title"><span><Filter size={15} /> Find your assignment</span><small>Vietnam time · UTC+7</small></div><div className="m5-toolbar"><label>Trip status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['OPEN', 'FULL', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></label><button onClick={list.refresh} disabled={list.loading}><RefreshCw size={15} className={list.loading ? 'animate-spin' : ''} /> Refresh</button></div></div>
    <div className="schedule-section-heading"><div><h2>Your departure board</h2><p>Trip details, participants and check-in in one place.</p></div><span>{list.items.length} assignments loaded</span></div>
    <div className="m5-ticket-grid schedule-board">{list.items.map(s => <Link className="schedule-departure-card" key={s.id} to={`/guide/schedules/${s.id}`}><div className="schedule-card-top"><span className="schedule-reference">DEPARTURE #{String(s.id).padStart(3, '0')}</span><Status value={s.status} /></div><div className="schedule-card-title"><span className="guide-trip-icon"><Mountain size={25} /></span><div><h2>{s.eventName}</h2><p><MapPin size={13} /> {s.branchName}</p></div></div><div className="schedule-timing"><div><span><CalendarDays size={14} /> Departure</span><strong>{dateTime(s.startDatetime)}</strong></div><div><span><Clock3 size={14} /> Return</span><strong>{dateTime(s.endDatetime)}</strong></div></div><div className="schedule-card-footer"><span><Users size={14} /> {s.currentParticipants}/{s.maxParticipants} reserved</span><strong>View & check in <ArrowRight size={15} /></strong></div></Link>)}</div>
    {!list.loading && !list.error && !list.items.length && <div className="guide-empty"><span className="guide-empty-icon"><Compass size={34} strokeWidth={1.4} /></span><span className="schedule-panel-kicker">YOUR NEXT JOURNEY AWAITS</span><h2>{status ? 'No trips with this status' : 'Ready for your first assignment'}</h2><p>{status ? 'Try a different status to see your assigned departures.' : 'When a branch assigns you to a departure, your trip details and participant list will appear here.'}</p>{status ? <button onClick={() => setStatus('')}>Show all assignments</button> : <Link className="m5-primary" to="/tours">Explore our tours <ArrowRight size={15} /></Link>}<small><Users size={14} /> Open an assigned trip to review the group and record check-in.</small></div>}
    {(list.loading || list.error || list.more) && <More list={list} />}
  </Page></div>;
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
