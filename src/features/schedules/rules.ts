import type { Participant, Schedule, ScheduleStatus } from './types';
export const labels: Record<string, string> = {
  OPEN: 'Open for Registration', FULL: 'Full', CLOSED: 'Registration Closed', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled', PENDING: 'Pending', EXPIRED: 'Hold Expired',
  CONFIRMED: 'Confirmed', NO_SHOW: 'No-show', CHECKED_IN: 'Checked In', NOT_CHECKED_IN: 'Not Checked In',
};
export const auditLabels: Record<string, string> = {
  REGISTER: 'Reserve Spot', RE_REGISTER: 'Re-register', CANCEL: 'Cancel Registration',
  EXPIRE_HOLD: 'Hold Expired', MANUAL_CONFIRM: 'Confirm Receipt', PAYMENT_CONFIRM: 'Confirm Payment',
  CHECK_IN: 'Check In', NO_SHOW: 'Mark as No-show', FINISH_TOUR: 'Complete Trip',
};
export const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date(value)) : '—';
export const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'VND' }).format(value);
export const validId = (id: unknown): number | null => typeof id === 'string' && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) ? Number(id) : null;
export const editable = (s: Schedule, now = Date.now()) => now < Date.parse(s.startDatetime) && ['OPEN', 'FULL', 'CLOSED'].includes(s.status);
export const bookable = (s: Schedule, now = Date.now()) => s.status === 'OPEN' && now < Date.parse(s.registrationClosesAt) && now < Date.parse(s.startDatetime) && s.currentParticipants < s.maxParticipants;
export const cancellable = (p: Participant, s: Schedule, now = Date.now()) => editable(s, now) && ['PENDING', 'CONFIRMED'].includes(p.participantStatus) && p.checkInStatus !== 'CHECKED_IN';
export const payable = (p: Participant, s: Schedule, now = Date.now()) => p.participantStatus === 'PENDING' && ['OPEN', 'FULL', 'CLOSED'].includes(s.status) && now < Date.parse(s.registrationClosesAt) && now < Date.parse(s.startDatetime) && !!p.expiresAt && now < Date.parse(p.expiresAt);
// Defaults match ScheduleSettings. The server enforces any deployment-specific overrides.
export function attendance(p: Participant, s: Schedule, now = Date.now()) {
  const start = Date.parse(s.startDatetime);
  const eligible = ['CLOSED', 'IN_PROGRESS'].includes(s.status) && now < Date.parse(s.endDatetime) && p.participantStatus === 'CONFIRMED' && p.checkInStatus === 'NOT_CHECKED_IN';
  return { checkIn: eligible && now >= start - 2 * 3600000 && now <= start + 30 * 60000, noShow: eligible && now > start + 30 * 60000 };
}
export function transitions(s: Schedule, now = Date.now()): ScheduleStatus[] {
  if (s.status === 'CANCELLED' || s.status === 'COMPLETED') return [];
  const result: ScheduleStatus[] = [];
  if (['OPEN', 'FULL'].includes(s.status)) result.push('CLOSED');
  if (s.status === 'CLOSED' && now < Date.parse(s.registrationClosesAt)) result.push('OPEN');
  if (s.status === 'CLOSED' && s.guideId && now >= Date.parse(s.startDatetime) && now < Date.parse(s.endDatetime)) result.push('IN_PROGRESS');
  if (s.status === 'IN_PROGRESS' && now >= Date.parse(s.endDatetime)) result.push('COMPLETED');
  if (editable(s, now)) result.push('CANCELLED');
  return result;
}
// Explicit Vietnam offset prevents datetime-local from depending on the operator's browser timezone.
export function toOffset(local: string) { return `${local}:00+07:00`; }
export function toLocal(value: string) {
  const shifted = new Date(Date.parse(value) + 7 * 3600000);
  return shifted.toISOString().slice(0, 16);
}
export function validateDates(start: string, end: string, cutoff: string, now = Date.now()) {
  const a = Date.parse(toOffset(start)), b = Date.parse(toOffset(end)), c = Date.parse(toOffset(cutoff));
  if (![a, b, c].every(Number.isFinite)) return 'Please enter valid dates and times.';
  if (a <= now || b <= a) return 'Departure must be in the future and the end must be after departure.';
  if (c <= now || c > a) return 'The registration deadline must be in the future and no later than departure.';
  return '';
}

/** Match the server overlap boundaries: touching endpoints do not overlap. */
export function guideConflicts(schedules: Schedule[], start: string, end: string, excludeId?: number) {
  const from = Date.parse(start), until = Date.parse(end);
  const conflicts = new Map<number, Schedule[]>();
  if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from) return conflicts;
  for (const schedule of schedules) {
    if (!schedule.guideId || schedule.id === excludeId || ['CANCELLED', 'COMPLETED'].includes(schedule.status)) continue;
    if (Date.parse(schedule.startDatetime) < until && Date.parse(schedule.endDatetime) > from) {
      const rows = conflicts.get(schedule.guideId) || [];
      rows.push(schedule);
      conflicts.set(schedule.guideId, rows);
    }
  }
  return conflicts;
}
