import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Compass,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  RotateCcw,
  Truck,
  UserRound,
} from "lucide-react";
import { catalogApi, type Product } from "../equipment/catalogApi";
import { getScheduleOrders, operateOrder, type Order, type OrderStatus } from "./orderApi";

type Props = {
  scheduleId: number;
  isManager?: boolean;
};

type PackingEntry = {
  productId: number;
  productName: string;
  itemType: "SALE" | "RENTAL";
  pendingQty: number;
  atStoreQty: number;
  withGuideQty: number;
  deliveredQty: number;
  totalQty: number;
};

const STATUS_META: Record<OrderStatus, { label: string; badgeClass: string }> = {
  PENDING: {
    label: "Pending Approval",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  CONFIRMED: {
    label: "Approved (At Store)",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
  },
  WITH_GUIDE: {
    label: "With Tour Guide",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200",
  },
  IN_PROGRESS: {
    label: "Delivered to Customer",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-stone-100 text-stone-600 border-stone-200",
  },
};

const PAYMENT_LABELS: Record<Order["paymentStatus"], string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

const formatCurrency = (amount: number) =>
  `${new Intl.NumberFormat("en-US").format(amount)} VND`;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ScheduleOrdersPanel({ scheduleId, isManager = false }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getScheduleOrders(scheduleId);
      setOrders(list);

      const productIds = Array.from(
        new Set(list.flatMap((order) => order.items.map((item) => item.productId))),
      );

      if (productIds.length > 0) {
        const results = await Promise.allSettled(
          productIds.map((id) => catalogApi<Product>(`/products/${id}`)),
        );
        const map: Record<number, Product> = {};
        for (const result of results) {
          if (result.status === "fulfilled" && result.value) {
            map[result.value.id] = result.value;
          }
        }
        setProducts(map);
      } else {
        setProducts({});
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load tour delivery orders.",
      );
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const packingChecklist = useMemo<PackingEntry[]>(() => {
    const grouped = new Map<string, PackingEntry>();

    for (const order of orders) {
      if (order.status === "CANCELLED") continue;

      for (const item of order.items) {
        const key = `${item.productId}:${item.itemType}`;
        const existing = grouped.get(key) ?? {
          productId: item.productId,
          productName:
            products[item.productId]?.name || `Equipment #${item.productId}`,
          itemType: item.itemType,
          pendingQty: 0,
          atStoreQty: 0,
          withGuideQty: 0,
          deliveredQty: 0,
          totalQty: 0,
        };

        if (order.status === "PENDING") existing.pendingQty += item.quantity;
        else if (order.status === "CONFIRMED") existing.atStoreQty += item.quantity;
        else if (order.status === "WITH_GUIDE") existing.withGuideQty += item.quantity;
        else existing.deliveredQty += item.quantity;

        existing.totalQty += item.quantity;
        grouped.set(key, existing);
      }
    }

    return Array.from(grouped.values()).sort(
      (a, b) =>
        b.withGuideQty - a.withGuideQty ||
        b.atStoreQty - a.atStoreQty ||
        b.totalQty - a.totalQty ||
        a.productName.localeCompare(b.productName),
    );
  }, [orders, products]);

  const counts = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "PENDING").length,
      atStore: orders.filter((o) => o.status === "CONFIRMED").length,
      withGuide: orders.filter((o) => o.status === "WITH_GUIDE").length,
      delivered: orders.filter((o) => o.status === "IN_PROGRESS").length,
      completed: orders.filter((o) => o.status === "COMPLETED").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const handleAction = async (
    orderId: number,
    action: "confirm" | "guide-pickup" | "hand-over" | "return",
  ) => {
    setBusyOrderId(orderId);
    setError("");
    setNotice("");
    try {
      await operateOrder(orderId, action);
      const actionLabel =
        action === "confirm"
          ? "approved"
          : action === "guide-pickup"
            ? "dispatched to the tour guide"
            : action === "hand-over"
              ? "handed over to the customer"
              : "marked as returned";
      setNotice(`Order #${orderId} has been ${actionLabel}.`);
      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to update Order #${orderId}.`,
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
        Loading tour delivery orders and packing checklist...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-5">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-stone-900">
            <Compass size={18} className="text-emerald-700" />
            Tour Equipment & Delivery Orders
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            {isManager
              ? "Approve tour delivery orders, dispatch equipment to the assigned guide, and track customer handover and returns."
              : "Track equipment assigned to this tour, deliver items in your custody to customers on the tour, and record rental returns."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-amber-800">
            Pending Approval
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-900">
            {counts.pending}
          </div>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-sky-800">
            Ready at Store
          </div>
          <div className="mt-1 text-2xl font-bold text-sky-900">
            {counts.atStore}
          </div>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-violet-800">
            With Tour Guide
          </div>
          <div className="mt-1 text-2xl font-bold text-violet-900">
            {counts.withGuide}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-indigo-800">
            Delivered to Customer
          </div>
          <div className="mt-1 text-2xl font-bold text-indigo-900">
            {counts.delivered}
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Package size={16} className="text-emerald-700" />
              Packing Checklist (Equipment to Bring)
            </h4>
            <p className="text-xs text-stone-500">
              Aggregated item quantities across active orders for this departure (excluding cancelled orders).
            </p>
          </div>
        </div>

        {packingChecklist.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">
            No equipment needs to be brought for this tour yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <th className="py-2 pr-4">Equipment Item</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4 text-right">At Store</th>
                  <th className="py-2 pr-4 text-right">With Guide</th>
                  <th className="py-2 pr-4 text-right">Delivered</th>
                  <th className="py-2 pr-4 text-right">Pending Approval</th>
                  <th className="py-2 text-right">Total to Bring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {packingChecklist.map((entry) => (
                  <tr key={`${entry.productId}-${entry.itemType}`}>
                    <td className="py-2.5 pr-4 font-medium text-stone-900">
                      {entry.productName}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                        {entry.itemType === "RENTAL" ? "Rental" : "Purchase"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-sky-700">
                      {entry.atStoreQty}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-violet-700">
                      {entry.withGuideQty}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-emerald-700">
                      {entry.deliveredQty}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-amber-700">
                      {entry.pendingQty}
                    </td>
                    <td className="py-2.5 text-right font-bold text-stone-900">
                      {entry.totalQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-stone-900">
            Tour Delivery Orders ({filteredOrders.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["ALL", "All"],
                ["PENDING", "Pending"],
                ["CONFIRMED", "At Store"],
                ["WITH_GUIDE", "With Guide"],
                ["IN_PROGRESS", "Delivered"],
                ["COMPLETED", "Completed"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === value
                    ? "bg-stone-900 text-white"
                    : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
            No tour delivery orders match the selected status filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusMeta = STATUS_META[order.status];
              const isBusy = busyOrderId === order.id;
              const hasRentalItems = order.items.some(
                (item) => item.itemType === "RENTAL",
              );

              return (
                <article
                  key={order.id}
                  className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-stone-900">
                          Order #{order.id}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                          {PAYMENT_LABELS[order.paymentStatus]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        Placed on {formatDateTime(order.orderDate)} · Total{" "}
                        <span className="font-semibold text-stone-800">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isManager && order.status === "PENDING" && order.canApprove && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleAction(order.id, "confirm")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          Approve Order
                        </button>
                      )}

                      {isManager && order.status === "CONFIRMED" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleAction(order.id, "guide-pickup")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
                        >
                          <Truck size={14} />
                          Dispatch to Guide
                        </button>
                      )}

                      {order.status === "WITH_GUIDE" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleAction(order.id, "hand-over")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
                        >
                          <PackageCheck size={14} />
                          Hand Over to Customer
                        </button>
                      )}

                      {order.status === "IN_PROGRESS" && order.canReturn && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleAction(order.id, "return")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                        >
                          <RotateCcw size={14} />
                          Receive Return
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 rounded-lg bg-stone-50 p-3 text-xs text-stone-700 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-stone-900">
                        <UserRound size={13} className="text-stone-500" />
                        {order.customerName || `Customer #${order.userId}`}
                      </div>
                      {order.customerPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} className="text-stone-500" />
                          {order.customerPhone}
                        </div>
                      )}
                      {order.customerEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} className="text-stone-500" />
                          {order.customerEmail}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {order.deliveryLocation && (
                        <div className="flex items-start gap-1.5">
                          <MapPin size={13} className="mt-0.5 shrink-0 text-emerald-700" />
                          <span>{order.deliveryLocation}</span>
                        </div>
                      )}
                      {order.deliveryNotes && (
                        <div className="text-stone-600">
                          <span className="font-medium text-stone-800">Notes:</span>{" "}
                          {order.deliveryNotes}
                        </div>
                      )}
                      {order.status === "PENDING" && !isManager && (
                        <div className="text-amber-800">
                          Awaiting store admin or staff approval.
                        </div>
                      )}
                      {order.status === "PENDING" && isManager && !order.canApprove && (
                        <div className="text-amber-800">
                          {order.refundPending
                            ? "Refund request is pending; cannot approve."
                            : "Awaiting full payment before order approval."}
                        </div>
                      )}
                      {order.status === "CONFIRMED" && !isManager && (
                        <div className="text-sky-800">
                          Approved — collect this equipment from branch staff before departure.
                        </div>
                      )}
                      {order.status === "IN_PROGRESS" &&
                        !order.canReturn &&
                        hasRentalItems && (
                          <div className="text-indigo-800">
                            Awaiting customer receipt confirmation before rental return can be recorded.
                          </div>
                        )}
                    </div>
                  </div>

                  <ul className="mt-3 divide-y divide-stone-100 text-sm">
                    {order.items.map((item) => {
                      const productName =
                        products[item.productId]?.name ||
                        `Equipment #${item.productId}`;
                      return (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2"
                        >
                          <div>
                            <span className="font-medium text-stone-900">
                              {productName}
                            </span>{" "}
                            <span className="text-xs text-stone-500">
                              × {item.quantity} (
                              {item.itemType === "RENTAL" ? "Rental" : "Purchase"})
                            </span>
                            {item.itemType === "RENTAL" &&
                              item.rentalStartDate &&
                              item.rentalEndDate && (
                                <div className="text-xs text-stone-500">
                                  Rental dates: {item.rentalStartDate} to{" "}
                                  {item.rentalEndDate}
                                </div>
                              )}
                          </div>
                          <div className="text-right text-xs font-medium text-stone-700">
                            {formatCurrency(item.unitPrice)} / unit
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
