import { catalogApi } from "../equipment/catalogApi";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type OrderItemType = "SALE" | "RENTAL";

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
  canCancel: boolean;
  customerReceivedAt: string | null;
  canConfirmReceipt: boolean;
  canReturn: boolean;
  orderDate: string;
  items: OrderItem[];
};

export const getMyOrders = () => catalogApi<Order[]>("/orders/me");
