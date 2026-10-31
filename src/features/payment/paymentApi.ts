import { ApiError } from '../equipment/catalogApi';

/** Payment returns must retain FE authentication; Swagger's bearer token is separate. */
export async function paymentApi<T>(path: string, init: RequestInit = {}, allowEmpty = false): Promise<T> {
  const token = sessionStorage.getItem('treektour.catalog.token');
  if (!token) throw new ApiError('Sign in with the account that made the payment to verify the transaction.', 401);
  let response: Response;
  try {
    response = await fetch('/api' + path, {
      ...init,
      // API authentication must return an error, not silently navigate fetch to Google login.
      redirect: 'error',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch {
    throw new Error('Unable to connect to the payment API. Check the backend connection or sign in again if your session has expired.');
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status === 401 || response.status === 403
      ? 'Your session is invalid or this transaction belongs to another account. Sign in with the account that made the payment.'
      : payload?.message || `Unable to verify transaction (${response.status}).`, response.status);
  }
  if (!payload?.data && !allowEmpty) throw new Error('The API returned no payment data. Check the backend connection.');
  return payload.data as T;
}

/** Contracts shared with the backend Payment controllers. Send exactly one target. */
export type CreatePaymentRequest = (
  | { orderId: number; participantId?: never }
  | { participantId: number; orderId?: never }
) & { description?: string };

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
export type Payment = {
  transaction_id: number;
  app_trans_id: string;
  status: PaymentStatus;
  orderId: number | null;
  participantId: number | null;
  participantConfirmation: 'CONFIRMED' | 'REVIEW_REQUIRED' | null;
  redirectUrl: string;
  zalopay_response: { order_url?: string; return_message?: string } | null;
};

export type TransactionHistory = {
  transactionId: number;
  orderId: number | null;
  participantId: number | null;
  transactionType: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  createdAt: string;
  refundReason: string | null;
  succeededAt: string | null;
  refundConfirmedBy: number | null;
  refundTransferReference: string | null;
  refundConfirmationNote: string | null;
};

export const payments = {
  create: (body: CreatePaymentRequest) => paymentApi<Payment>('/payments/zalopay', {
    method: 'POST', body: JSON.stringify(body),
  }),
  retry: (body: CreatePaymentRequest) => paymentApi<Payment>('/payments/zalopay/retry', {
    method: 'POST', body: JSON.stringify(body),
  }),
  forOrder: (id: number) => paymentApi<Payment | null>(`/payments/zalopay/orders/${id}`, {}, true),
  forParticipant: (id: number) => paymentApi<Payment | null>(`/payments/zalopay/participants/${id}`, {}, true),
  query: (id: number) => paymentApi<Payment>(`/payments/zalopay/query/${id}`),
  cancel: (id: number) => paymentApi<Payment>(`/payments/zalopay/${id}/cancel`, { method: 'POST' }),
  history: (page = 0, size = 20) => paymentApi<{
    content: TransactionHistory[]; page: number; size: number; totalElements: number; totalPages: number;
  }>(`/payments/transactions/history?page=${page}&size=${size}`),
};

export type RefundTarget = { orderId: number; participantId?: never } | { participantId: number; orderId?: never };
export const refunds = {
  preview: (target: RefundTarget) => paymentApi<RefundPreview>(`/payments/refunds/preview?${new URLSearchParams(Object.entries(target).map(([key, value]) => [key, String(value)]))}`),
  request: (body: RefundTarget & { reason: string }) => paymentApi<TransactionHistory>('/payments/refunds', {
    method: 'POST', body: JSON.stringify(body),
  }),
  mine: (page = 0) => paymentApi<TransactionHistory[]>(`/payments/refunds/me?page=${page}&size=20`),
  list: (page = 0, status: 'PENDING' | 'SUCCEEDED' = 'PENDING') => paymentApi<TransactionHistory[]>(`/payments/refunds?page=${page}&size=20&status=${status}`),
  confirm: (id: number, body: { transferReference: string; note?: string }) => paymentApi<TransactionHistory>(`/payments/refunds/${id}/confirm`, { method: 'POST', body: JSON.stringify(body) }),
};

export type RefundPreview = { orderId: number | null; participantId: number | null; receivedAmount: number; refundedAmount: number; refundableAmount: number };
