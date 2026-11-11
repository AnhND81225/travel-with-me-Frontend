import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeliverToSchedule, deliveryParticipants, tourDeliveryDate } from './deliveryRules';
import type { Participant, Schedule } from '../schedules/types';

test('rental dates use Vietnam dates across UTC midnight and year boundaries', () => {
  assert.equal(tourDeliveryDate('2026-12-09T17:30:00Z'), '2026-12-10');
  assert.equal(tourDeliveryDate('2026-12-10T00:30:00+07:00'), '2026-12-10');
  assert.equal(tourDeliveryDate('2026-12-31T18:00:00Z'), '2027-01-01');
  assert.equal(tourDeliveryDate('not-a-date'), '');
});

test('delivery excludes departed, cancelled, completed and invalid schedules', () => {
  const schedule = { startDatetime: '2026-12-10T00:00:00Z', endDatetime: '2026-12-11T00:00:00Z', status: 'OPEN' } as Schedule;
  const before = Date.parse('2026-12-09T00:00:00Z');
  for (const status of ['OPEN', 'FULL', 'CLOSED'] as const) {
    assert.equal(canDeliverToSchedule({ ...schedule, status }, before), true);
  }
  for (const status of ['CANCELLED', 'COMPLETED', 'IN_PROGRESS'] as const) {
    assert.equal(canDeliverToSchedule({ ...schedule, status }, before), false);
  }
  assert.equal(canDeliverToSchedule(schedule, Date.parse(schedule.startDatetime)), false);
  assert.equal(canDeliverToSchedule({ ...schedule, endDatetime: schedule.startDatetime }, before), false);
  assert.equal(canDeliverToSchedule({ ...schedule, startDatetime: 'invalid' }, before), false);
});

test('tour selector reads later ticket pages, deduplicates and filters unusable tickets', async () => {
  const ticket = (id: number, participantStatus: Participant['participantStatus'] = 'CONFIRMED') => ({ id, participantStatus }) as Participant;
  const pages = [[ticket(1, 'CANCELLED'), ticket(2)], [ticket(2), ticket(3, 'PENDING')], [ticket(4, 'EXPIRED')]];
  const calls: number[] = [];
  const result = await deliveryParticipants(async page => { calls.push(page); return pages[page]; }, 2);
  assert.deepEqual(calls, [0, 1, 2]);
  assert.deepEqual(result.map(row => row.id), [2, 3]);
});

test('empty ticket list stops after one request and API failures propagate', async () => {
  let calls = 0;
  assert.deepEqual(await deliveryParticipants(async () => { calls++; return []; }, 20), []);
  assert.equal(calls, 1);
  await assert.rejects(deliveryParticipants(async () => { throw new Error('offline'); }, 20), /offline/);
});
