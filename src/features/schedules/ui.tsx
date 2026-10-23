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
