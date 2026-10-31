import type { Audit } from './types';

const states: Record<string, [string, string]> = {
  OPEN: ['Registration opened', 'Guests can reserve a spot on this departure.'],
  FULL: ['Departure fully booked', 'All available spots have been reserved.'],
  CLOSED: ['Registration closed', 'This departure is no longer accepting new reservations.'],
  IN_PROGRESS: ['Trip started', 'The group has started the trip.'],
  COMPLETED: ['Trip completed', 'The trip has finished.'],
  CANCELLED: ['Departure cancelled', 'This departure will no longer take place.'],
};
export function departureHistoryText(row: Audit): { title: string; details: string[] } {
  const reason = row.changeReason || row.reason || '';
  const guide = reason.match(/(?:Đổi guide|Change guide)\s+(null|\d+)\s*->\s*(null|\d+)/i);
  const capacity = reason.match(/(?:sức chứa|capacity)\s+(\d+)\s*->\s*(\d+)/i);
  if (guide || capacity) {
    const details: string[] = [];
    if (guide && guide[1] !== guide[2]) details.push(guide[2] === 'null' ? 'The guide assignment was removed.' : guide[1] === 'null' ? 'A guide has been assigned to this trip.' : 'The assigned guide has been changed.');
    if (capacity && capacity[1] !== capacity[2]) details.push(`Group capacity changed from ${capacity[1]} to ${capacity[2]} guests.`);
    return { title: 'Trip arrangements updated', details: details.length ? details : ['Trip arrangements were reviewed.'] };
  }
  if (row.newStartDatetime) return { title: 'Departure rescheduled', details: ['The departure and return times have been updated.'] };
  if (!row.oldStatus) return { title: 'Departure created', details: ['The departure was added to the trip schedule.'] };
  if (row.oldStatus !== row.newStatus) {
    const [title, description] = states[row.newStatus] || ['Departure updated', 'The trip information has been updated.'];
    const automatic = /Tự động đóng đăng ký|automatically clos/i.test(reason);
    return { title, details: [automatic ? 'Registration closed automatically when the booking deadline was reached.' : description] };
  }
  return { title: 'Trip information updated', details: ['The departure details have been reviewed and updated.'] };
}
