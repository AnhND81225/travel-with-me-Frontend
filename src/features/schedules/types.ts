export type ScheduleStatus = 'OPEN' | 'FULL' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ParticipantStatus = 'PENDING' | 'EXPIRED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export interface Schedule {
  id: number; eventId: number; branchId: number; guideId: number | null;
  startDatetime: string; endDatetime: string; registrationClosesAt: string;
  maxParticipants: number; currentParticipants: number; status: ScheduleStatus; createdAt: string;
}
export interface GuideAssignment extends Schedule { eventName: string; branchName: string }
export interface Participant {
  id: number; scheduleId: number; userId: number; registrationDate: string;
  participantStatus: ParticipantStatus; checkInStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN';
  registeredPrice: number; note: string | null; registrationReference: string; expiresAt: string | null;
}
export interface ScheduleInput {
  eventId: number; branchId: number; guideId: number | null; startDatetime: string;
  endDatetime: string; registrationClosesAt?: string; maxParticipants: number;
}
export interface Audit {
  id: number; oldStatus: string | null; newStatus: string; changedAt: string; changedBy: number | null;
  changeReason?: string; reason?: string; action?: string; registrationReference?: string;
  registeredPrice?: number; oldStartDatetime?: string; newStartDatetime?: string;
  oldEndDatetime?: string; newEndDatetime?: string;
}
export interface PaymentReview {
  id: number; participantId: number; registrationReference: string; transactionId: number | null;
  kind: string; amount: number; reason: string; createdAt: string;
}
export interface StaffAssignment { userId: number; branchId: number; status: string }
