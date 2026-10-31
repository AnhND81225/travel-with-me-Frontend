import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { catalogApi, Branch, Product, vnd } from "../../features/equipment/catalogApi";
import { refunds } from "../../features/payment/paymentApi";
import { cancelUnpaidOrder } from "../../features/payment/cancelUnpaidOrder";
import type { Order, OrderStatus } from "../../features/orders/orderApi";
import { useAuth } from "../../hooks/useAuth";
import { AdminOrdersPage } from "../admin/AdminOrdersPage";
import { Card, Button, Badge, Modal } from "../../components/ui";
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
  LoaderCircle,
  Search,
  CreditCard,
  Eye,
  Printer,
  X,
  Check,
  MapPin,
  TrendingUp,
  SlidersHorizontal,
  Info,
  RotateCcw,
  User,
  Phone,
  Mail,
  Edit3,
} from "lucide-react";

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export function MyOrdersPage({ operations = false }: { operations?: boolean }) {
  // If operations mode was passed, render the dedicated HQ Admin Console
  if (operations) {
    return <AdminOrdersPage />;
  }

  const { account } = useAuth();
  const [customAddress, setCustomAddress] = useState<string>(() => {
    return localStorage.getItem("terrapeak_customer_address") || "72 Le Thanh Ton, Ben Nghe, District 1, Ho Chi Minh City";
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(customAddress);

  const getOrderCustomer = (order: Order) => {
    const o = order as any;
    const name = o.customerName || o.fullName || o.userName || account?.fullName || "Jamie Nguyen";
    const phone = o.customerPhone || o.phone || account?.phone || "+84 912 345 678";
    const email = o.customerEmail || o.email || account?.email || "customer@terrapeak.vn";
    const address = o.customerAddress || o.address || customAddress;
    return { name, phone, email, address };
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [refundOrderIds, setRefundOrderIds] = useState<Set<number>>(new Set());
  const [refundsByOrderId, setRefundsByOrderId] = useState<Map<number, any>>(new Map());
  const [refundsLoaded, setRefundsLoaded] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SALE" | "RENTAL">("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  // Modals & Details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  async function load(silent = false) {
    setError("");
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const orderData = await catalogApi<Order[]>("/orders/me");
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (e) {
      setError(getErrorMessage(e, "Unable to load your orders"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadRefundOrders() {
      setRefundsLoaded(false);
      try {
        const ids = new Set<number>();
        for (let page = 0; active; page++) {
          const rows = await refunds.mine(page);
          for (const row of rows) if (row.orderId !== null) ids.add(row.orderId);
          if (rows.length < 20) break;
        }
        if (active) { setRefundOrderIds(ids); setRefundsLoaded(true); }
      } catch {
        // Only show the link when the server confirms a request exists.
        if (active) setRefundOrderIds(new Set());
      }
    }
    void loadRefundOrders();
    const refreshRefunds = () => { if (document.visibilityState === 'visible') void loadRefundOrders(); };
    window.addEventListener('focus', refreshRefunds);
    return () => { active = false; window.removeEventListener('focus', refreshRefunds); };
  }, [orders]);

  useEffect(() => {
    let active = true;
    catalogApi<Branch[]>("/branches")
      .then((data) => {
        if (active && Array.isArray(data)) setBranches(data);
      })
      .catch(() => {});
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const ids = [...new Set(orders.flatMap((order) => order.items.map((item) => item.productId)))];
    if (ids.length > 0) {
      Promise.allSettled(ids.map((id) => catalogApi<Product>(`/products/${id}`))).then((results) => {
        if (active) {
          setProducts(
            results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
          );
        }
      });
    }
    return () => {
      active = false;
    };
  }, [orders]);

  async function handleCancelOrder(id: number) {
    setBusy(id);
    setError("");
    try {
      const updated = await cancelUnpaidOrder(id);
      setOrders((rows) => rows.map((row) => (row.id === id ? updated : row)));
      showToast(`Cancelled order #${id} successfully!`, "success");
      setOrderToCancel(null);
    } catch (e) {
      const msg = getErrorMessage(e, "Unable to cancel this order");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirmReceipt(id: number) {
    if (!window.confirm("Confirm that you have received all equipment in this order?")) return;
    setBusy(id);
    setError("");
    try {
      const updated = await catalogApi<Order>(`/orders/${id}/confirm-receipt`, { method: "POST" });
      setOrders(rows => rows.map(row => row.id === id ? updated : row));
      setSelectedOrder(current => current?.id === id ? updated : current);
      showToast("Receipt confirmed successfully.", "success");
    } catch (error) {
      const message = getErrorMessage(error, "Unable to confirm receipt.");
      setError(message);
      showToast(message, "error");
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

  // Statistics calculation for user
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const confirmed = orders.filter((o) => o.status === "CONFIRMED").length;
    const inProgress = orders.filter((o) => o.status === "IN_PROGRESS").length;
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    const unpaid = orders.filter((o) => o.status === "PENDING" && o.paymentStatus !== "PAID").length;
    const totalSpent = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + (o.paidAmount || (o.paymentStatus === "PAID" ? o.totalAmount : 0)), 0);

    return { total, pending, confirmed, inProgress, completed, unpaid, totalSpent };
  }, [orders]);

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (statusFilter === "UNPAID") {
          if (order.status !== "PENDING" || order.paymentStatus === "PAID") return false;
        } else if (statusFilter === "REFUNDED") {
          if (order.paymentStatus !== "REFUNDED" && !refundOrderIds.has(order.id)) return false;
        } else if (statusFilter !== "ALL" && order.status !== statusFilter) {
          return false;
        }

        // Type filter
        if (typeFilter !== "ALL") {
          const hasType = order.items.some((i) => i.itemType === typeFilter);
          if (!hasType) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = String(order.id).includes(q) || `ord-${order.id}`.includes(q);
          const branchName = branchMap.get(order.branchId)?.name?.toLowerCase() || "";
          const matchBranch = branchName.includes(q);
          const matchItem = order.items.some((item) => {
            const pName = productMap.get(item.productId)?.name?.toLowerCase() || "";
            return pName.includes(q) || String(item.productId).includes(q);
          });

          if (!matchId && !matchBranch && !matchItem) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "newest") return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        if (sortOrder === "oldest") return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        if (sortOrder === "highest") return (b.totalAmount || 0) - (a.totalAmount || 0);
        if (sortOrder === "lowest") return (a.totalAmount || 0) - (b.totalAmount || 0);
        return 0;
      });
  }, [orders, statusFilter, typeFilter, searchQuery, sortOrder, branchMap, productMap]);

  // Status renderer badge
  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="warning" className="flex items-center gap-1.5 py-1 px-2.5 font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#D97845] animate-pulse" />
            <span>Awaiting dispatch</span>
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge variant="neutral" className="flex items-center gap-1.5 py-1 px-2.5 font-bold border-[#3B82F6] text-[#1E40AF] bg-[#EFF6FF] shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Approved · Ready for pickup</span>
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="success" className="flex items-center gap-1.5 py-1 px-2.5 font-bold bg-[#ECFDF5] border-[#10B981] text-[#065F46] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>In use · In the field</span>
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="primary" className="flex items-center gap-1.5 py-1 px-2.5 font-bold bg-[#152A20] text-[#F3EFE6] shadow-2xs">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed</span>
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="danger" className="flex items-center gap-1.5 py-1 px-2.5 font-bold shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Cancelled</span>
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const renderPaymentBadge = (status: Order["paymentStatus"]) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="success" className="flex items-center gap-1 py-1 px-2 font-bold bg-[#E0EFE6] text-[#065F46] border border-[#ADCBBB]">
            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
            <span>Paid</span>
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge variant="neutral" className="flex items-center gap-1 py-1 px-2 font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#93C5FD]">
            <span>Deposit paid</span>
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="neutral" className="flex items-center gap-1 py-1 px-2 font-bold bg-[#F3E8FF] text-[#6B21A8] border border-[#D8B4FE]">
            <span>Refunded</span>
          </Badge>
        );
      case "UNPAID":
      default:
        return (
          <Badge variant="warning" className="flex items-center gap-1 py-1 px-2 font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74]">
            <Clock className="w-3 h-3 text-[#EA580C]" />
            <span>Unpaid</span>
          </Badge>
        );
    }
  };

  // Visual Stepper for the expedition lifecycle
  const renderExpeditionStepper = (order: Order) => {
    const status = order.status;
    if (status === "CANCELLED") {
      return (
        <div className="py-2 px-3 bg-[#FEE2E2]/60 border border-[#FCA5A5] rounded-xs text-[11px] text-[#B91C1C] flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>The order has been cancelled and reserved stock has been released.</span>
        </div>
      );
    }

    const steps = [
      { key: "ORDERED", label: "Order placed", done: true },
      { key: "CONFIRMED", label: "Admin approval", done: status === "CONFIRMED" || status === "IN_PROGRESS" || status === "COMPLETED" },
      { key: "HANDED_OVER", label: "Equipment handed over", done: status === "IN_PROGRESS" || status === "COMPLETED" },
      { key: "CUSTOMER_RECEIVED", label: "Customer receipt", done: !!order.customerReceivedAt },
      { key: "COMPLETED", label: order.items.some(item => item.itemType === "RENTAL") ? "Return & inspection" : "Completed", done: status === "COMPLETED" },
    ];

    return (
      <div className="pt-2 pb-1">
        <div className="flex items-center justify-between text-[11px] font-bold">
          {steps.map((st, idx) => (
            <React.Fragment key={st.key}>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                    st.done
                      ? "bg-[#152A20] text-emerald-400 font-bold"
                      : "bg-[#EBE6DC] text-[#737C75] border border-[#D8D2C5]"
                  }`}
                >
                  {st.done ? <Check className="w-3 h-3" /> : idx + 1}
                </span>
                <span className={`hidden sm:inline ${st.done ? "text-[#152A20]" : "text-[#737C75]"}`}>
                  {st.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 mx-2 h-0.5 rounded-full transition-colors ${
                    steps[idx + 1].done ? "bg-[#152A20]" : "bg-[#D8D2C5]"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 p-4 rounded-xs shadow-xl flex items-center gap-3 text-xs font-bold transition-all animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === "success"
              ? "bg-[#152A20] text-[#F3EFE6] border border-[#2B4E3C]"
              : "bg-[#991B1B] text-white border border-[#B91C1C]"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-80 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D2C5] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="primary" className="bg-[#152A20] text-emerald-400">
              CLIMBER PASSPORT // GEAR LOG
            </Badge>
            <span className="text-xs text-[#5C665F] font-mono-spec">
              SYS-VERIFIED // EXPEDITION_ORDERS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline tracking-tight">
            My Equipment Orders & Rentals
          </h1>
          <p className="text-xs text-[#5C665F] font-body mt-1">
            Manage your equipment orders, follow approvals and track your rentals.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/shop">
            <Button variant="secondary" size="sm" icon={<ShoppingBag className="w-3.5 h-3.5" />}>
              Shop equipment
            </Button>
          </Link>
          <Link to="/rent">
            <Button variant="accent" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Rent equipment
            </Button>
          </Link>
          <Link to="/refunds">
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5 text-[#D97845]" />}
            >
              <span>Refund Center</span>
              {refundOrderIds.size > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-xs bg-[#D97845] text-white text-[10px] font-mono-spec">
                  {refundOrderIds.size}
                </span>
              )}
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load(true)}
            disabled={loading || refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#D97845]" : ""}`} />}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* KPI & Metrics Bar for Customer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card padding="sm" className="space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#152A20] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <span className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider block">TOTAL ORDERS</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">{stats.total}</div>
          <span className="text-[10px] text-[#5C665F]">Order history</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#FDF8F3] border-l-4 border-l-[#D97845] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === "PENDING" ? "ring-2 ring-[#D97845]" : ""
          }`}
          onClick={() => setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING")}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">AWAITING APPROVAL / PAYMENT</span>
            {stats.pending > 0 && <span className="w-2 h-2 rounded-full bg-[#D97845] animate-ping" />}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#D97845] font-headline">{stats.pending}</div>
          <span className="text-[10px] text-[#737C75]">
            {stats.unpaid > 0 ? `${stats.unpaid} unpaid orders` : "Awaiting branch approval"}
          </span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F0FDF4] border-l-4 border-l-[#10B981] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === "IN_PROGRESS" ? "ring-2 ring-[#10B981]" : ""
          }`}
          onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
        >
          <span className="text-[10px] text-[#059669] font-bold uppercase tracking-wider block">IN USE</span>
          <div className="text-xl sm:text-2xl font-bold text-[#065F46] font-headline">{stats.inProgress}</div>
          <span className="text-[10px] text-[#737C75]">In the field</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#4B5563] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === "COMPLETED" ? "ring-2 ring-[#4B5563]" : ""
          }`}
          onClick={() => setStatusFilter(statusFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
        >
          <span className="text-[10px] text-[#4B5563] font-bold uppercase tracking-wider block">COMPLETED</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">{stats.completed}</div>
          <span className="text-[10px] text-[#737C75]">Equipment returned</span>
        </Card>

        <Card
          padding="sm"
          className="space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#047857] hover:-translate-y-1 hover:shadow-md transition-all duration-200"
        >
          <span className="text-[10px] text-[#047857] font-bold uppercase tracking-wider block">TOTAL SPENDING</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline truncate" title={vnd(stats.totalSpent)}>
            {vnd(stats.totalSpent)}
          </div>
          <span className="text-[10px] text-[#059669] flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3 text-[#059669]" /> Your outdoor purchases
          </span>
        </Card>
      </div>

      {/* Main Filter & Search Control Panel */}
      <Card padding="md" className="space-y-4">
        {/* Status Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#D8D2C5]/60">
          {[
            { key: "ALL", label: "ALL", count: stats.total },
            { key: "PENDING", label: "AWAITING APPROVAL", count: stats.pending, alert: stats.pending > 0 },
            { key: "CONFIRMED", label: "APPROVED", count: stats.confirmed },
            { key: "IN_PROGRESS", label: "RENTED", count: stats.inProgress },
            { key: "COMPLETED", label: "COMPLETED", count: stats.completed },
            { key: "REFUNDED", label: "REFUNDED", count: orders.filter((o) => o.paymentStatus === "REFUNDED" || refundOrderIds.has(o.id)).length },
            { key: "CANCELLED", label: "CANCELLED", count: orders.filter((o) => o.status === "CANCELLED").length },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xs text-xs font-bold tracking-wide transition uppercase cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#152A20] text-[#F3EFE6] shadow-xs"
                    : "bg-[#EBE6DC] text-[#5C665F] hover:text-[#111D16] hover:bg-[#DDD7CB]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-xs font-mono-spec ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.alert
                      ? "bg-[#D97845] text-white"
                      : "bg-[#D8D2C5] text-[#111D16]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sub-filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search bar */}
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-[#737C75] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number (#12), equipment name or outpost..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] placeholder-[#A39B8D] focus:outline-none focus:border-[#152A20]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737C75] hover:text-[#111D16]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="lg:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            >
              <option value="ALL">All order types</option>
              <option value="RENTAL">Rentals only</option>
              <option value="SALE">Purchases only</option>
            </select>
          </div>

          {/* Sort order */}
          <div className="lg:col-span-3">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest value</option>
              <option value="lowest">Lowest value</option>
            </select>
          </div>
        </div>
      </Card>

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
            Try again
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} padding="lg" className="animate-pulse space-y-4 bg-[#F8F6F1]">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-[#EBE6DC] w-48 rounded-xs" />
                <div className="h-5 bg-[#EBE6DC] w-24 rounded-xs" />
              </div>
              <div className="h-16 bg-[#EBE6DC] w-full rounded-xs" />
              <div className="flex justify-between items-center">
                <div className="h-4 bg-[#EBE6DC] w-32 rounded-xs" />
                <div className="h-8 bg-[#EBE6DC] w-28 rounded-xs" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <Card padding="lg" className="text-center py-16 space-y-3 bg-[#F8F6F1] border border-[#D8D2C5]">
          <Package className="w-12 h-12 text-[#A39B8D] mx-auto stroke-1" />
          <h3 className="text-base font-bold text-[#111D16] font-headline uppercase">
            {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "No matching orders found"
              : "You have no purchases or rentals yet"}
          </h3>
          <p className="text-xs text-[#5C665F] max-w-md mx-auto font-body">
            {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "Try changing the status filter or search terms to find your orders."
              : "Explore TerraPeak equipment and get ready for your next adventure."}
          </p>
          <div className="flex justify-center flex-wrap gap-3 pt-2">
            {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <>
                <Link to="/shop">
                  <Button variant="primary" size="sm">Shop equipment</Button>
                </Link>
                <Link to="/rent">
                  <Button variant="accent" size="sm">Rent equipment</Button>
                </Link>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Orders List */}
      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const branch = branchMap.get(order.branchId);
            const isBusy = busy === order.id;
            const needsPayment = order.status === "PENDING" && !order.refundPending && order.paymentStatus !== "PAID";

            return (
              <Card
                key={order.id}
                padding="md"
                className="hover:border-[#152A20] hover:shadow-sm transition-all duration-200 bg-[#F8F6F1] space-y-4 border border-[#D8D2C5]"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#D8D2C5] pb-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-headline font-bold text-base text-[#111D16] flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#D97845]" />
                      ORDER #{order.id}
                    </span>
                    {renderStatusBadge(order.status)}
                    {renderPaymentBadge(order.paymentStatus)}
                    <span className="text-xs text-[#5C665F] font-mono-spec flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#737C75]" />
                      {new Date(order.orderDate).toLocaleString("en-GB", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#152A20] font-bold">
                    <Building className="w-3.5 h-3.5 text-[#152A20]" />
                    <span>{branch ? branch.name : `Outpost #${order.branchId}`}</span>
                  </div>
                </div>

                {/* Customer Information Strip */}
                {(() => {
                  const cust = getOrderCustomer(order);
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#F3EFE6] px-3.5 py-2.5 rounded-xs border border-[#E5E0D5]">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#152A20]">
                          <User className="w-3.5 h-3.5 text-[#D97845]" />
                          <span>{cust.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#5C665F] font-mono-spec">
                          <Phone className="w-3.5 h-3.5 text-[#737C75]" />
                          <span>{cust.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#5C665F]">
                          <MapPin className="w-3.5 h-3.5 text-[#737C75]" />
                          <span className="truncate max-w-xs">{cust.address}</span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[#737C75] tracking-wider">
                        Recipient Info
                      </span>
                    </div>
                  );
                })()}

                {/* Expedition Lifecycle Stepper */}
                {renderExpeditionStepper(order)}

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
                              <Link
                                to={`/gear/${item.productId}`}
                                className="font-bold text-sm text-[#111D16] font-headline hover:text-[#D97845] transition"
                              >
                                {product?.name || `Equipment #${item.productId}`}
                              </Link>
                              <Badge variant={isRental ? "warning" : "neutral"} size="sm" className="text-[9px]">
                                {isRental ? "RENTAL" : "PURCHASE"}
                              </Badge>
                            </div>

                            <div className="text-[11px] text-[#5C665F] mt-0.5 flex flex-wrap items-center gap-2">
                              <span>SKU: #{item.productId}</span>
                              {product?.category && (
                                <>
                                  <span>•</span>
                                  <span>Category: {product.category}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>Unit price: {vnd(item.unitPrice)}{isRental && " / day"}</span>
                            </div>

                            {/* Rental Period Badge */}
                            {isRental && item.rentalStartDate && item.rentalEndDate && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-[10px] text-[#D97845] font-bold">
                                <Calendar className="w-3 h-3" />
                                <span>Rental period: {item.rentalStartDate} → {item.rentalEndDate}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-[#737C75] uppercase">Subtotal</div>
                          <div className="font-bold text-sm text-[#152A20] font-headline">
                            {vnd(item.quantity * item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer and Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-[#737C75] uppercase font-bold">Total payment:</span>
                      <span className="text-lg sm:text-xl font-bold text-[#D97845] font-headline">
                        {vnd(order.totalAmount)}
                      </span>
                    </div>
                    {order.paidAmount > 0 && order.paidAmount < order.totalAmount && (
                      <span className="text-[11px] text-emerald-700 font-bold">
                        (Paid: {vnd(order.paidAmount)})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Direct Refund Action Button / Shortcut */}
                    {order.refundPending ? (
                      <Link
                        to={`/refunds?orderId=${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#FFF7ED] border border-[#FDBA74] text-[#C2410C] hover:bg-[#FFEDD5] text-xs font-bold transition shadow-2xs"
                        title="Refund is currently under review"
                      >
                        <Clock className="w-3.5 h-3.5 animate-pulse text-[#EA580C]" />
                        <span>Refund Pending</span>
                        <ArrowRight className="w-3 h-3 text-[#EA580C]" />
                      </Link>
                    ) : (order.paymentStatus === 'REFUNDED' || refundOrderIds.has(order.id)) ? (
                      <Link
                        to={`/refunds?orderId=${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs bg-[#F3E8FF] border border-[#D8B4FE] text-[#6B21A8] hover:bg-[#E9D5FF] text-xs font-bold transition shadow-2xs cursor-pointer"
                        title="View refund details and resolution record"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#7E22CE]" />
                        <span>View Refund</span>
                        <ArrowRight className="w-3 h-3 text-[#7E22CE]" />
                      </Link>
                    ) : (refundsLoaded && order.paidAmount > 0 && ['PENDING', 'CANCELLED'].includes(order.status)) ? (
                      <Link
                        to={`/refunds?orderId=${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs bg-[#FFF8F3] border border-[#D97845] text-[#D97845] hover:bg-[#D97845] hover:text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                        title="Request refund for this order"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Refund</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : null}
                    {/* View Details Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Order details
                    </Button>

                    {/* Pay Now Button */}
                    {needsPayment && (
                      <Link to={`/payment/pending?orderId=${order.id}`}>
                        <Button
                          variant="accent"
                          size="sm"
                          icon={<CreditCard className="w-3.5 h-3.5" />}
                          className="bg-[#D97845] hover:bg-[#C66735]"
                        >
                          Pay now
                        </Button>
                      </Link>
                    )}

                    {/* Cancel Order Button */}
                    {order.canConfirmReceipt && (
                      <Button variant="primary" size="sm" disabled={isBusy}
                        onClick={() => void handleConfirmReceipt(order.id)}>
                        {isBusy ? "Confirming…" : "Confirm receipt"}
                      </Button>
                    )}
                    {order.customerReceivedAt && <span className="text-xs text-[#152A20]">Receipt confirmed</span>}
                    {order.status === "PENDING" && (
                      <Button
                        variant="outlined"
                        size="sm"
                        disabled={isBusy || !order.canCancel}
                        onClick={() => setOrderToCancel(order)}
                        icon={<X className="w-3.5 h-3.5" />}
                      >
                        {isBusy ? "Processing..." : "Cancel order"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL / ORDER RECEIPT VOUCHER */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`ORDER DETAILS #${selectedOrder.id}`}
          maxWidth="lg"
        >
          <div className="space-y-6 font-label text-xs">
            {/* Header Manifest Information */}
            <div className="bg-[#152A20] text-[#F3EFE6] p-4 rounded-xs space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#2B4E3C] pb-3">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    TERRAPEAK EXPEDITION MANIFEST
                  </span>
                  <h3 className="text-lg font-bold font-headline mt-0.5">
                    EQUIPMENT HANDOVER RECEIPT #{selectedOrder.id}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusBadge(selectedOrder.status)}
                  {renderPaymentBadge(selectedOrder.paymentStatus)}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Pickup outpost</span>
                  <span className="font-bold text-white">
                    {branchMap.get(selectedOrder.branchId)?.name || `Outpost #${selectedOrder.branchId}`}
                  </span>
                  {branchMap.get(selectedOrder.branchId)?.address && (
                    <span className="text-[10px] text-[#ADCBBB] block mt-0.5">
                      {branchMap.get(selectedOrder.branchId)?.address}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Order date</span>
                  <span className="font-mono-spec text-white">
                    {new Date(selectedOrder.orderDate).toLocaleString("en-GB")}
                  </span>
                </div>
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Order total</span>
                  <span className="font-bold text-[#D97845] font-headline text-sm">
                    {vnd(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Customer Manifest Summary in Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] border-t border-[#2B4E3C] pt-2.5 mt-2.5">
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Customer Name</span>
                  <span className="font-bold text-white truncate block">
                    {getOrderCustomer(selectedOrder).name}
                  </span>
                </div>
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Contact Phone</span>
                  <span className="font-mono-spec text-white truncate block">
                    {getOrderCustomer(selectedOrder).phone}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Customer Address</span>
                  <span className="text-[#F3EFE6] text-[11px] truncate block" title={getOrderCustomer(selectedOrder).address}>
                    {getOrderCustomer(selectedOrder).address}
                  </span>
                </div>
              </div>
            </div>

            {/* Dedicated Customer & Recipient Information Card */}
            {(() => {
              const cust = getOrderCustomer(selectedOrder);
              return (
                <div className="bg-white border border-[#D8D2C5] rounded-xs p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-xs bg-[#F3EFE6] border border-[#D8D2C5] flex items-center justify-center text-[#D97845]">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs uppercase text-[#152A20] tracking-wider">
                        Customer & Recipient Details
                      </span>
                    </div>
                    <span className="text-[10px] text-[#737C75] font-mono-spec">
                      Climber #{selectedOrder.userId || account?.id || '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Customer Name */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#737C75] flex items-center gap-1">
                        <User className="w-3 h-3 text-[#5C665F]" />
                        Customer Name
                      </span>
                      <p className="font-bold text-[#111D16] text-sm font-headline">
                        {cust.name}
                      </p>
                      {cust.email && (
                        <p className="text-[11px] text-[#737C75] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#A0A8A2]" />
                          {cust.email}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#737C75] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#5C665F]" />
                        Contact Phone
                      </span>
                      <p className="font-mono-spec font-bold text-[#152A20] text-sm">
                        {cust.phone}
                      </p>
                      <span className="inline-block px-1.5 py-0.5 rounded-2xs bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                        Verified Contact
                      </span>
                    </div>

                    {/* Customer Address */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[#737C75] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#5C665F]" />
                          Customer Address
                        </span>
                        {!isEditingAddress ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTempAddress(cust.address);
                              setIsEditingAddress(true);
                            }}
                            className="text-[10px] text-[#D97845] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            Edit
                          </button>
                        ) : null}
                      </div>

                      {isEditingAddress ? (
                        <div className="space-y-1.5 pt-1">
                          <input
                            type="text"
                            value={tempAddress}
                            onChange={(e) => setTempAddress(e.target.value)}
                            className="w-full text-xs p-1.5 bg-[#F8F6F1] border border-[#152A20] rounded-xs text-[#111D16] focus:outline-none"
                            placeholder="Enter delivery or residential address..."
                            autoFocus
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (tempAddress.trim()) {
                                  localStorage.setItem("terrapeak_customer_address", tempAddress.trim());
                                  setCustomAddress(tempAddress.trim());
                                }
                                setIsEditingAddress(false);
                              }}
                              className="px-2 py-0.5 bg-[#152A20] text-white rounded-2xs text-[10px] font-bold hover:bg-[#1E3A2D] cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress(false)}
                              className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-2xs text-[10px] font-bold hover:bg-gray-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#152A20] font-medium leading-relaxed">
                          {cust.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Items Breakdown */}
            <div>
              <h4 className="font-bold text-sm text-[#111D16] uppercase mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#D97845]" />
                Equipment & handover details
              </h4>
              <div className="border border-[#D8D2C5] rounded-xs divide-y divide-[#EBE6DC] overflow-hidden bg-white">
                {selectedOrder.items.map((item) => {
                  const product = productMap.get(item.productId);
                  const isRental = item.itemType === "RENTAL";

                  return (
                    <div key={item.id} className="p-3 flex justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#111D16]">
                            {product?.name || `Equipment #${item.productId}`}
                          </span>
                          <Badge variant={isRental ? "warning" : "neutral"} size="sm">
                            {isRental ? "RENTAL" : "PURCHASE"}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-[#5C665F] mt-0.5">
                          Quantity: {item.quantity} × {vnd(item.unitPrice)}
                          {isRental && item.rentalStartDate && (
                            <span className="ml-2 font-mono-spec text-[#D97845]">
                              ({item.rentalStartDate} → {item.rentalEndDate})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-sm font-headline text-[#152A20]">
                        {vnd(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Refund & Escrow Resolution Status */}
            <div className="p-3.5 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111D16] uppercase text-[11px] flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#D97845]" />
                  Refund & Escrow Settlement
                </span>
                {renderPaymentBadge(selectedOrder.paymentStatus)}
              </div>
              <div className="text-[11px] text-[#5C665F] font-body flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#EBE6DC]">
                <span>
                  {selectedOrder.paymentStatus === 'REFUNDED'
                    ? "Payment for this order has been refunded via electronic bank transfer."
                    : selectedOrder.refundPending
                    ? "Refund request is currently pending administrative review."
                    : selectedOrder.paidAmount > 0
                    ? "Paid amount is protected under TerraPeak customer escrow guarantee."
                    : "No refund requested for this order."}
                </span>
                <Link
                  to={`/refunds?orderId=${selectedOrder.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#152A20] text-white rounded-xs text-xs font-bold hover:bg-[#1E3A2D] transition shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>Go to Refund Page</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Pickup & Return Checklist */}
            <div className="p-3.5 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs space-y-2">
              <h5 className="font-bold text-[#111D16] uppercase text-[11px] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#152A20]" />
                Before picking up equipment
              </h5>
              <ul className="text-[11px] text-[#5C665F] space-y-1 list-disc pl-4 font-body">
                <li>Please bring your ID card or passport when collecting equipment.</li>
                <li>Our staff will inspect safety fittings and wear with you and explain how to use the equipment.</li>
                <li>Return rentals on time for inspection, UV sanitization and deposit settlement.</li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[#D8D2C5] pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                Print pickup receipt
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>

                {selectedOrder.canConfirmReceipt && (
                  <Button variant="primary" size="sm" disabled={busy === selectedOrder.id}
                    onClick={() => void handleConfirmReceipt(selectedOrder.id)}>
                    {busy === selectedOrder.id ? "Confirming…" : "Confirm receipt"}
                  </Button>
                )}
                {selectedOrder.status === "PENDING" && !selectedOrder.refundPending && selectedOrder.paymentStatus !== "PAID" && (
                  <Link to={`/payment/pending?orderId=${selectedOrder.id}`}>
                    <Button
                      variant="accent"
                      size="sm"
                      icon={<CreditCard className="w-3.5 h-3.5" />}
                      className="bg-[#D97845] hover:bg-[#C66735]"
                    >
                      Pay for this order
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM CANCELLATION MODAL */}
      {orderToCancel && (
        <Modal
          isOpen={Boolean(orderToCancel)}
          onClose={() => setOrderToCancel(null)}
          title={`CANCEL ORDER #${orderToCancel.id}`}
          maxWidth="sm"
        >
          <div className="space-y-4 font-label text-xs">
            <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xs text-[#B91C1C] flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Are you sure you want to cancel this order?</p>
                <p className="text-[11px] mt-0.5 font-body">
                  This will cancel your equipment order and release your reserved stock.
                </p>
              </div>
            </div>

            <div className="border border-[#D8D2C5] p-3 rounded-xs bg-[#F8F6F1]">
              <div className="flex justify-between">
                <span className="text-[#737C75]">Order number:</span>
                <span className="font-bold">#{orderToCancel.id}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[#737C75]">Total:</span>
                <span className="font-bold text-[#D97845]">{vnd(orderToCancel.totalAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOrderToCancel(null)}
                disabled={busy === orderToCancel.id}
              >
                Keep order
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => void handleCancelOrder(orderToCancel.id)}
                disabled={busy === orderToCancel.id}
              >
                {busy === orderToCancel.id ? "Cancelling..." : "Confirm cancellation"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
