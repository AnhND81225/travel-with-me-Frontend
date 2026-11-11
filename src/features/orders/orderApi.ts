import { catalogApi } from "../equipment/catalogApi";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "WITH_GUIDE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type OrderItemType = "SALE" | "RENTAL";

export type DeliveryType = "STORE_PICKUP" | "TOUR_DELIVERY";

export type OrderItem = {
  id: number;
  productId: number;
  itemType: OrderItemType;
  quantity: number;
  unitPrice: number;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  status: string;
};

export type Order = {
  id: number;
  userId: number;
  branchId: number;
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";
  paidAmount: number;
  remainingAmount: number;
  canApprove: boolean;
  refundPending: boolean;
  canCancel: boolean;
  customerReceivedAt: string | null;
  canConfirmReceipt: boolean;
  canReturn: boolean;
  orderDate: string;
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  address?: string;
  phone?: string;
  deliveryType?: DeliveryType;
  scheduleId?: number | null;
  deliveryLocation?: string | null;
  deliveryNotes?: string | null;
};

export const getMyOrders = () => catalogApi<Order[]>("/orders/me");

export const getScheduleOrders = (scheduleId: number) =>
  catalogApi<Order[]>(`/orders/schedule/${scheduleId}`);

export const operateOrder = (
  orderId: number,
  action: "confirm" | "guide-pickup" | "hand-over" | "return",
) => catalogApi<Order>(`/orders/${orderId}/${action}`, { method: "POST" });
