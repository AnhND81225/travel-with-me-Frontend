import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { CalendarDays, Mountain, RefreshCw, X } from 'lucide-react';
import { auditLabels, dateTime, labels, money } from './rules';
import { useScheduleAccount } from './hooks';
import type { Audit } from './types';
import './schedules.css';

export function Status({ value }: { value: string }) { return <span className={`m5-badge m5-${value.toLowerCase()}`}>{labels[value] || value}</span>; }
export function Message({ children, error = false }: { children: ReactNode; error?: boolean }) { return <p className={`m5-message ${error ? 'm5-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</p>; }
export function Loading() { return <Message><RefreshCw size={16} className="animate-spin" /> Loading…</Message>; }
export function Page({ title, subtitle, children, action }: { title: string; subtitle?: string; children?: ReactNode; action?: ReactNode }) {
  return <section className="m5"><header className="m5-heading"><div><p className="m5-eyebrow"><Mountain size={15} /> TERRAPEAK · TOURS & PARTICIPANTS</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</header>{children}</section>;
}
export function ScheduleGuard({ roles, children }: { roles: string[]; children: ReactNode }) {
  const auth = useScheduleAccount(), location = useLocation();
  if (auth.loading) return <div className="m5"><Loading /></div>;
  if (auth.error) return <div className="m5"><Message error>{auth.error}</Message><button onClick={auth.refresh}>Retry authentication</button></div>;
  if (!auth.data) return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!roles.includes(auth.data.role)) return <Page title="Access Denied"><Message error>Your role does not have access to this feature.</Message><Link to="/">Back to Home</Link></Page>;
  return <>{children}</>;
}
export function Dialog({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null), titleId = useId();
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog className="m5-dialog" ref={ref} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <div className="m5"><header className="m5-dialog-header"><h2 id={titleId}>{title}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close"><X size={19} /></button></header>{children}</div>
  </dialog>;
}
export function More({ list }: { list: { more: boolean; loading: boolean; error: string; loadMore: () => void; refresh: () => void } }) {
  return <div className="m5-more">{list.error && <Message error>{list.error}</Message>}{list.loading ? <Loading /> : list.more ? <button onClick={list.loadMore}>{list.error ? 'Retry' : 'Load More'}</button> : <small>All items loaded.</small>}</div>;
}
export function Timeline({ rows }: { rows: Audit[] }) {
  return <ol className="m5-timeline">{rows.map(h => <li key={h.id}><p><b>{(h.action && auditLabels[h.action]) || h.action || 'Departure Updated'}</b> · {dateTime(h.changedAt)}</p><p>{h.oldStatus && `${labels[h.oldStatus] || h.oldStatus} → `}{labels[h.newStatus] || h.newStatus}</p>{h.newStartDatetime && <p><CalendarDays size={14} /> {dateTime(h.oldStartDatetime)} → {dateTime(h.newStartDatetime)}<br />End: {dateTime(h.oldEndDatetime)} → {dateTime(h.newEndDatetime)}</p>}<p>{h.reason || h.changeReason}</p>{h.registeredPrice != null && <small>{money(h.registeredPrice)} · {h.registrationReference}</small>}<small>Changed by: {h.changedBy ? `#${h.changedBy}` : 'System'}</small></li>)}</ol>;
}

const ticketSteps: Record<string, [string, string]> = {
  REGISTER: ['Reservation created', 'Your spot is reserved while payment is pending.'],
  RE_REGISTER: ['Reservation renewed', 'A new reservation has been created for this trip.'],
  PAYMENT_CONFIRM: ['Payment received', 'Payment has been received and your ticket is confirmed.'],
  MANUAL_CONFIRM: ['Payment confirmed', 'A staff member has verified and confirmed the payment.'],
  CANCEL: ['Reservation cancelled', 'This ticket has been cancelled. If you have paid, contact the branch for assistance.'],
  EXPIRE_HOLD: ['Reservation expired', 'The spot was released because payment was not completed before the deadline.'],
  CHECK_IN: ['Checked in', 'Attendance has been recorded at the departure point.'],
  NO_SHOW: ['Did not attend', 'No check-in was recorded during the check-in window.'],
  FINISH_TOUR: ['Trip completed', 'The trip has ended. Thank you for joining us!'],
};
export function TicketTimeline({ rows }: { rows: Audit[] }) {
  return <ol className="list-none m-0 p-0 space-y-4" aria-label="Ticket history">{rows.map(row => {
    const [title, description] = ticketSteps[row.action || ''] || ['Ticket updated', 'Contact the branch if you need further assistance.'];
    return <li key={row.id} className="rounded-lg border border-[#D8D2C5] bg-[#FFFDF8] p-4">
      <div className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#789881]" /><div className="min-w-0">
        <strong className="block text-sm text-[#152A20]">{title}</strong>
        <time dateTime={row.changedAt} className="block mt-1 text-xs text-[#737C75]">{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(row.changedAt))}</time>
        <p className="text-xs text-[#5C665F] leading-relaxed mt-3">{description}</p>
        {row.registeredPrice != null && <span className="inline-block mt-2 rounded bg-[#E8EEE5] px-2 py-1 text-xs font-semibold text-[#152A20]">Ticket price: {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'VND' }).format(row.registeredPrice)}</span>}
      </div></div>
    </li>;
  })}</ol>;
}
