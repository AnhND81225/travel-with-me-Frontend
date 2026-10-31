import type { Order } from '../orders/orderApi';
import { paymentApi, payments } from './paymentApi';

/** Cancels an unpaid attempt first; Order remains the final authority for cancelling the order. */
export async function cancelUnpaidOrder(orderId: number): Promise<Order> {
  let order = await paymentApi<Order>(`/orders/${orderId}`);
  if (order.status !== 'PENDING') throw new Error('Only orders awaiting approval can be cancelled.');
  if (!order.canCancel) {
    if (order.paymentStatus !== 'UNPAID' || order.paidAmount !== 0)
      throw new Error('This order has received payment. Contact support about a refund before cancelling.');
    const payment = await payments.forOrder(orderId);
    if (payment?.status === 'SUCCEEDED')
      throw new Error('Payment has just succeeded. This order cannot be cancelled as an unpaid order.');
    if (payment?.status === 'PENDING') {
      const result = await payments.cancel(payment.transaction_id);
      if (result.status !== 'FAILED' && result.status !== 'CANCELLED')
        throw new Error('Payment succeeded or cancellation is not confirmed. The order is unchanged.');
    }
    order = await paymentApi<Order>(`/orders/${orderId}`);
    if (!order.canCancel)
      throw new Error('This order cannot be cancelled yet. Check its payment status.');
  }
  return paymentApi<Order>(`/orders/${orderId}/cancel`, { method: 'POST' });
}
