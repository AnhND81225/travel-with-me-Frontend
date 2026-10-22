import type { Order } from '../orders/orderApi';
import { paymentApi } from './paymentApi';

type PaymentState = { transaction_id: number; status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' };

/** Cancels an unpaid attempt first; Order remains the final authority for cancelling the order. */
export async function cancelUnpaidOrder(orderId: number): Promise<Order> {
  let order = await paymentApi<Order>(`/orders/${orderId}`);
  if (order.status !== 'PENDING') throw new Error('Chỉ có thể hủy đơn đang chờ xác nhận.');
  if (!order.canCancel) {
    if (order.paymentStatus !== 'UNPAID' || order.paidAmount !== 0)
      throw new Error('Đơn đã thu tiền, cần liên hệ hỗ trợ hoàn tiền trước khi hủy.');
    const payment = await paymentApi<PaymentState | null>(`/payments/zalopay/orders/${orderId}/payment`, {}, true);
    if (payment?.status === 'SUCCEEDED')
      throw new Error('Đơn vừa thanh toán thành công, không thể hủy theo luồng chưa thanh toán.');
    if (payment?.status === 'PENDING') {
      const result = await paymentApi<PaymentState>(`/payments/zalopay/${payment.transaction_id}/cancel`, { method: 'POST' });
      if (result.status !== 'FAILED' && result.status !== 'CANCELLED')
        throw new Error('Giao dịch đã trả tiền hoặc chưa xác nhận hủy. Đơn hàng vẫn được giữ nguyên.');
    }
    order = await paymentApi<Order>(`/orders/${orderId}`);
    if (!order.canCancel)
      throw new Error('Đơn chưa đủ điều kiện hủy. Vui lòng kiểm tra lại trạng thái thanh toán.');
  }
  return paymentApi<Order>(`/orders/${orderId}/cancel`, { method: 'POST' });
}
