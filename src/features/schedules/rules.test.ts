import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attendance, bookable, cancellable, editable, payable, toLocal, toOffset, transitions, validId, validateDates } from './rules';
import type { Participant, Schedule } from './types';
const start = Date.parse('2026-12-20T07:00:00+07:00');
const s: Schedule = { id: 1, eventId: 2, branchId: 3, guideId: 4, startDatetime: '2026-12-20T07:00:00+07:00', endDatetime: '2026-12-20T17:00:00+07:00', registrationClosesAt: '2026-12-20T06:00:00+07:00', maxParticipants: 2, currentParticipants: 1, status: 'OPEN', createdAt: '2026-11-01T00:00:00Z' };
const p: Participant = { id: 5, userId: 6, scheduleId: 1, participantStatus: 'CONFIRMED', checkInStatus: 'NOT_CHECKED_IN', registeredPrice: 1500000, registrationDate: '2026-12-19T00:00:00Z', expiresAt: '2026-12-20T06:00:00+07:00', registrationReference: 'current-attempt', note: null };
test('registration rejects cutoff equality, full capacity, closed or started schedules', () => {
  assert.equal(bookable(s, start - 7200000), true);
  assert.equal(bookable(s, start - 3600000), false);
  assert.equal(bookable({ ...s, currentParticipants: 2 }, start - 7200000), false);
  assert.equal(bookable({ ...s, status: 'FULL' }, start - 7200000), false);
  assert.equal(bookable({ ...s, status: 'CLOSED' }, start - 7200000), false);
  assert.equal(bookable(s, start), false);
});
test('cancellation requires pre-departure, active ticket and not checked-in', () => {
  assert.equal(cancellable(p, s, start - 1), true);
  assert.equal(cancellable(p, s, start), false);
  assert.equal(cancellable({ ...p, checkInStatus: 'CHECKED_IN' }, s, start - 1), false);
  for (const status of ['EXPIRED', 'CANCELLED', 'NO_SHOW', 'COMPLETED'] as const) assert.equal(cancellable({ ...p, participantStatus: status }, s, start - 1), false);
});
test('manual payment rejects expired hold even before cutoff', () => {
  const pending = { ...p, participantStatus: 'PENDING' as const, expiresAt: new Date(start - 5400000).toISOString() };
  assert.equal(payable(pending, s, start - 6000000), true);
  assert.equal(payable(pending, s, start - 5400000), false);
  assert.equal(payable(p, s, start - 6000000), false);
  assert.equal(payable(pending, { ...s, status: 'CANCELLED' }, start - 6000000), false);
});
test('check-in window inclusive, no-show starts strictly after window', () => {
  const closed = { ...s, status: 'CLOSED' as const };
  assert.equal(attendance(p, closed, start - 7200001).checkIn, false);
  assert.equal(attendance(p, closed, start - 7200000).checkIn, true);
  assert.deepEqual(attendance(p, closed, start + 1800000), { checkIn: true, noShow: false });
  assert.deepEqual(attendance(p, closed, start + 1800001), { checkIn: false, noShow: true });
  assert.deepEqual(attendance(p, closed, Date.parse(s.endDatetime)), { checkIn: false, noShow: false });
  assert.equal(attendance(p, s, start).checkIn, false);
  assert.equal(attendance({ ...p, checkInStatus: 'CHECKED_IN' }, closed, start).checkIn, false);
  assert.equal(attendance({ ...p, participantStatus: 'PENDING' }, closed, start).checkIn, false);
});
test('schedule transitions enforce guide, time and terminal states', () => {
  assert.deepEqual(transitions(s, start - 1), ['CLOSED', 'CANCELLED']);
  assert.deepEqual(transitions({ ...s, status: 'CLOSED' }, start), ['IN_PROGRESS']);
  assert.deepEqual(transitions({ ...s, status: 'CLOSED', guideId: null }, start), []);
  assert.deepEqual(transitions({ ...s, status: 'IN_PROGRESS' }, start), []);
  assert.deepEqual(transitions({ ...s, status: 'IN_PROGRESS' }, Date.parse(s.endDatetime)), ['COMPLETED']);
  assert.deepEqual(transitions({ ...s, status: 'CANCELLED' }, start - 1), []);
  assert.deepEqual(transitions({ ...s, status: 'COMPLETED' }, start - 1), []);
  assert.equal(editable({ ...s, status: 'IN_PROGRESS' }, start - 1), false);
});
test('Vietnam local datetime round trip preserves instant independent of browser timezone', () => {
  assert.equal(toLocal('2026-12-20T00:00:00Z'), '2026-12-20T07:00');
  assert.equal(Date.parse(toOffset('2026-12-20T07:00')), start);
  assert.equal(validateDates('2026-12-20T07:00', '2026-12-20T17:00', '2026-12-20T06:00', start - 7200000), '');
  assert.ok(validateDates('2026-12-20T07:00', '2026-12-20T06:00', '2026-12-20T06:00', start - 7200000));
  assert.ok(validateDates('2026-12-20T07:00', '2026-12-20T17:00', '2026-12-20T08:00', start - 7200000));
  assert.ok(validateDates('', '', '', start));
});
test('route IDs reject malformed and unsafe numeric IDs', () => {
  for (const value of ['0', '-1', '1.5', '1abc', 'Infinity', '9007199254740992', null, undefined]) assert.equal(validId(value), null);
  assert.equal(validId('12'), 12);
});
