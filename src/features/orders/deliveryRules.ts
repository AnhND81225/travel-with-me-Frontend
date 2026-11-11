import { toLocal } from '../schedules/rules';
import type { Participant, Schedule } from '../schedules/types';

export function tourDeliveryDate(value: string): string {
  return Number.isFinite(Date.parse(value)) ? toLocal(value).slice(0, 10) : '';
}

export function canDeliverToSchedule(schedule: Schedule, now = Date.now()): boolean {
  return ['OPEN', 'FULL', 'CLOSED'].includes(schedule.status) &&
    Date.parse(schedule.startDatetime) > now &&
    Date.parse(schedule.endDatetime) > Date.parse(schedule.startDatetime);
}

export async function deliveryParticipants(
  load: (page: number) => Promise<Participant[]>,
  pageSize: number,
): Promise<Participant[]> {
  const participants = new Map<number, Participant>();
  let page = 0;
  for (;;) {
    const rows = await load(page++);
    for (const row of rows) participants.set(row.id, row);
    if (rows.length < pageSize) break;
  }
  return [...participants.values()].filter(row =>
    row.participantStatus === 'CONFIRMED' || row.participantStatus === 'PENDING');
}
