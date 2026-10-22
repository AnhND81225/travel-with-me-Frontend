import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { catalogApi, Branch, Product, vnd } from "../../features/equipment/catalogApi";
import { cancelUnpaidOrder } from "../../features/payment/cancelUnpaidOrder";
import type { Order, OrderStatus } from "../../features/orders/orderApi";
import { AdminOrdersPage } from "../admin/AdminOrdersPage";

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;
import { Card, Button, Badge } from "../../components/ui";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  Building,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export function MyOrdersPage({ operations = false }: { operations?: boolean }) {
  // If operations mode was passed, render the dedicated HQ Admin Console
  if (operations) {
    return <AdminOrdersPage />;
  }

  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  async function load(silent = false) {
    setError("");
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [orderData, branchList, productList] = await Promise.allSettled([
        catalogApi<Order[]>("/orders/me"),
        catalogApi<Branch[]>("/branches"),
        catalogApi<{ content: Product[] }>("/products?page=0&size=200"),
      ]);

      if (orderData.status === "fulfilled" && Array.isArray(orderData.value)) {
        setOrders(orderData.value);
      }
      if (branchList.status === "fulfilled") {
        setBranches(branchList.value || []);
      }
      if (productList.status === "fulfilled") {
        setProducts(productList.value?.content || []);
      }
    } catch (e) {
      setError(getErrorMessage(e, "Không thể tải danh sách đơn hàng của bạn"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: number, action: string) {
    setBusy(id);
    setError("");
    try {
      const updated = action === "cancel"
        ? await cancelUnpaidOrder(id)
        : await catalogApi<Order>(`/orders/${id}/${action}`, { method: "POST" });
      setOrders((rows) => rows.map((row) => (row.id === id ? updated : row)));
    } catch (e) {
      setError(getErrorMessage(e, "Thao tác hủy đơn không thành công"));
    } finally {
      setBusy(null);
    }
  }

  const branchMap = useMemo(() => {
    const map = new Map<number, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  const productMap = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="warning" className="flex items-center gap-1 font-bold">
            <Clock className="w-3.5 h-3.5 text-[#D97845] animate-pulse" />
            <span>Chờ xác nhận</span>
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge variant="neutral" className="flex items-center gap-1 font-bold border-[#3B82F6] text-[#1E40AF] bg-[#EFF6FF]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Đã xác nhận · Sẵn sàng</span>
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="success" className="flex items-center gap-1 font-bold bg-[#ECFDF5] border-[#10B981] text-[#065F46]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Đang sử dụng</span>
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="primary" className="flex items-center gap-1 font-bold bg-[#152A20] text-[#F3EFE6]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đã hoàn tất</span>
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="danger" className="flex items-center gap-1 font-bold">
            <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Đã hủy</span>
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D2C5] pb-4">
        <div>
          <Badge variant="primary" className="mb-1.5">CLIMBER PASSPORT // GEAR LOG</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline">
            Đơn Mua & Thuê Thiết Bị Của Tôi
          </h1>
          <p className="text-xs text-[#5C665F] font-body mt-1">
            Theo dõi nhật ký đặt cọc, thời hạn thuê trang bị leo núi và lịch sử giao dịch dã ngoại.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/shop">
            <Button variant="secondary" size="sm" icon={<ShoppingBag className="w-3.5 h-3.5" />}>
              Mua thiết bị
            </Button>
          </Link>
          <Link to="/rent">
            <Button variant="accent" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Thuê thiết bị
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load(true)}
            disabled={loading || refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#D97845]" : ""}`} />}
          >
            Tải lại
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xs text-xs text-[#B91C1C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => void load()}
            className="underline font-bold hover:text-black ml-4 shrink-0 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <Card key={n} padding="lg" className="animate-pulse space-y-3">
              <div className="h-5 bg-[#EBE6DC] w-48 rounded-xs"></div>
              <div className="h-16 bg-[#EBE6DC] w-full rounded-xs"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <Card padding="lg" className="text-center py-16 space-y-3 bg-[#F8F6F1]">
          <Package className="w-12 h-12 text-[#A39B8D] mx-auto stroke-1" />
          <h3 className="text-base font-bold text-[#111D16] font-headline uppercase">
            Bạn chưa có đơn mua hoặc thuê thiết bị nào
          </h3>
          <p className="text-xs text-[#5C665F] max-w-md mx-auto font-body">
            Khám phá kho thiết bị leo núi cao cấp của TerraPeak và chuẩn bị hành trang cho chuyến chinh phục tiếp theo.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/shop">
              <Button variant="primary" size="sm">Xem Cửa Hàng Bán</Button>
            </Link>
            <Link to="/rent">
              <Button variant="accent" size="sm">Xem Dịch Vụ Cho Thuê</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Orders List */}
      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const branch = branchMap.get(order.branchId);
            const isBusy = busy === order.id;

            return (
              <Card
                key={order.id}
                padding="md"
                className="hover:border-[#152A20] transition bg-[#F8F6F1] space-y-4 border border-[#D8D2C5]"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8D2C5] pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-headline font-bold text-base text-[#111D16] flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#D97845]" />
                      ĐƠN HÀNG #{order.id}
                    </span>
                    {renderStatusBadge(order.status)}
                    <Badge variant={order.paymentStatus === "PAID" ? "success" : "warning"}>
                      {order.paymentStatus === "PAID" ? "Đã thanh toán" : order.paymentStatus === "PARTIALLY_PAID" ? "Thanh toán chưa đủ" : order.paymentStatus === "REFUNDED" ? "Đã hoàn tiền" : "Chưa thanh toán"}
                    </Badge>
                    <span className="text-xs text-[#5C665F] font-mono-spec flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#737C75]" />
                      {new Date(order.orderDate).toLocaleString("vi-VN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#152A20] font-bold">
                    <Building className="w-3.5 h-3.5" />
                    <span>{branch ? branch.name : `Trạm Outpost #${order.branchId}`}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-white border border-[#D8D2C5] rounded-xs divide-y divide-[#EBE6DC] overflow-hidden">
                  {order.items.map((item) => {
                    const product = productMap.get(item.productId);
                    const isRental = item.itemType === "RENTAL";

                    return (
                      <div
                        key={item.id}
                        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xs bg-[#F3EFE6] border border-[#D8D2C5] flex items-center justify-center font-bold text-[#152A20] shrink-0 font-mono-spec">
                            {item.quantity}×
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#111D16] font-headline">
                                {product?.name || `Thiết bị mã #${item.productId}`}
                              </span>
                              <Badge variant={isRental ? "warning" : "neutral"} size="sm">
                                {isRental ? "THUÊ DÃ NGOẠI" : "MUA SẮM"}
                              </Badge>
                            </div>

                            <div className="text-[11px] text-[#5C665F] mt-0.5">
                              Đơn giá: {vnd(item.unitPrice)}
                              {isRental && item.rentalStartDate && (
                                <span className="ml-2 font-mono-spec text-[#D97845] font-bold">
                                  ({item.rentalStartDate} → {item.rentalEndDate})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs text-[#737C75]">Thành tiền</div>
                          <div className="font-bold text-sm text-[#152A20] font-headline">
                            {vnd(item.quantity * item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-[#737C75] uppercase font-bold">Tổng thanh toán:</span>
                    <span className="text-lg sm:text-xl font-bold text-[#D97845] font-headline">
                      {vnd(order.totalAmount)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.status === "PENDING" && order.paymentStatus !== "PAID" && (
                      <Link to={`/payment/pending?orderId=${order.id}`} className="inline-flex items-center gap-2 rounded px-4 py-2 bg-[#994717] text-white text-xs font-bold hover:bg-[#793816]">
                        Thanh toán <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    {order.status === "PENDING" && (
                      <Button
                        variant="outlined"
                        size="sm"
                        disabled={isBusy || !(order.canCancel || (order.paymentStatus === "UNPAID" && order.paidAmount === 0))}
                        onClick={() => void act(order.id, "cancel")}
                      >
                        {isBusy ? "Đang hủy..." : (order.canCancel || (order.paymentStatus === "UNPAID" && order.paidAmount === 0)) ? "Hủy đơn hàng" : "Liên hệ hỗ trợ hủy / hoàn tiền"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
