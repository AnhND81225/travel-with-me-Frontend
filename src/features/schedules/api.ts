import { catalogApi, type Account, type Branch } from '../equipment/catalogApi';
import type { Audit, GuideAssignment, Participant, PaymentReview, Schedule, ScheduleInput, ScheduleStatus, StaffAssignment } from './types';

export const PAGE_SIZE = 20;
export const query = (values: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  return `?${params}`;
};
const write = <T>(path: string, method: string, body?: unknown) => catalogApi<T>(path, {
  method, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
export const scheduleApi = {
  me: () => catalogApi<Account>('/users/me'),
  branches: () => catalogApi<Branch[]>('/branches'),
  staff: (branchId: number) => catalogApi<StaffAssignment[]>(`/staff/branch/${branchId}`),
  list: (filters: { eventId?: number; branchId?: number; status?: string; page?: number }, signal?: AbortSignal) =>
    catalogApi<Schedule[]>(`/schedules${query({ ...filters, size: PAGE_SIZE })}`, { signal }),
  assigned: (filters: { status?: string; page?: number }, signal?: AbortSignal) =>
    catalogApi<GuideAssignment[]>(`/schedules/my-assignments${query({ ...filters, size: PAGE_SIZE })}`, { signal }),
  assignedDetail: (id: number) => catalogApi<GuideAssignment>(`/schedules/my-assignments/${id}`),
  get: (id: number) => catalogApi<Schedule>(`/schedules/${id}`),
  create: (body: ScheduleInput) => write<Schedule>('/schedules', 'POST', body),
  update: (id: number, body: { guideId: number | null; maxParticipants: number }) => write<Schedule>(`/schedules/${id}`, 'PUT', body),
  reschedule: (id: number, body: { newStartDatetime: string; newEndDatetime: string; registrationClosesAt?: string; changeReason: string }) => write<Schedule>(`/schedules/${id}/reschedule`, 'POST', body),
  status: (id: number, status: ScheduleStatus, changeReason: string) => write<Schedule>(`/schedules/${id}/status`, 'PATCH', { status, changeReason }),
  histories: (id: number, page: number) => catalogApi<Audit[]>(`/schedules/${id}/histories${query({ page, size: PAGE_SIZE })}`),
  register: (id: number, note: string) => write<Participant>(`/schedules/${id}/register`, 'POST', { note }),
  roster: (id: number, page: number) => catalogApi<Participant[]>(`/schedules/${id}/participants${query({ page, size: PAGE_SIZE })}`),
};
export const participantApi = {
  mine: (userId: number, page: number) => catalogApi<Participant[]>(`/participants/by-user/${userId}${query({ page, size: PAGE_SIZE })}`),
  get: (id: number) => catalogApi<Participant>(`/participants/${id}`),
  cancel: (id: number, reason: string) => write<Participant>(`/participants/${id}/cancel`, 'POST', { reason }),
  confirm: (id: number, registrationReference: string, paymentReference: string) => write<Participant>(`/participants/${id}/confirm-payment`, 'PATCH', { registrationReference, paymentReference }),
  checkIn: (id: number) => write<Participant>(`/participants/${id}/check-in`, 'PATCH'),
  noShow: (id: number) => write<Participant>(`/participants/${id}/no-show`, 'PATCH'),
  histories: (id: number, page: number) => catalogApi<Audit[]>(`/participants/${id}/histories${query({ page, size: PAGE_SIZE })}`),
  reviews: (branchId: number | undefined, page: number) => catalogApi<PaymentReview[]>(`/participants/payment-reviews${query({ branchId, page, size: PAGE_SIZE })}`),
};
