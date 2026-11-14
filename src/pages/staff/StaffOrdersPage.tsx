import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  ArrowRight,
  Eye,
  Calendar,
  MapPin,
  User,
  Check,
  X,
  ShieldCheck,
  RotateCcw,
  TrendingUp,
  CreditCard,
  Building,
  Phone,
  Mail,
  Compass,
  Truck,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { catalogApi, type Product, vnd } from '../../features/equipment/catalogApi';
import { operateOrder, type Order, type OrderStatus } from '../../features/orders/orderApi';

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const StaffOrdersPage: React.FC = () => {
  const { selectedStation } = useAppStore();
  const branchId = Number(selectedStation?.id);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SALE' | 'RENTAL'>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const url = !isNaN(branchId) && branchId > 0
        ? `/orders?branchId=${branchId}`
        : '/orders';
      const data = await catalogApi<Order[]>(url);
      const list = Array.isArray(data) ? data : [];
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
          if (result.status === 'fulfilled' && result.value) {
            map[result.value.id] = result.value;
          }
        }
        setProducts(map);
      } else {
        setProducts({});
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load branch orders from the server.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleAction = async (
    id: number,
    action: 'confirm' | 'guide-pickup' | 'hand-over' | 'return',
  ) => {
    setBusyOrderId(id);
    setError('');

    const actionLabels: Record<string, string> = {
      confirm: 'Approve order',
      'guide-pickup': 'Dispatch equipment to guide',
      'hand-over': 'Hand over equipment',
      return: 'Inspect and receive returned equipment',
    };

    try {
      const updated = await operateOrder(id, action);
      setOrders((prev) => prev.map((row) => (row.id === id ? updated : row)));
      if (selectedOrder?.id === id) {
        setSelectedOrder(updated);
      }
      showToast(`${actionLabels[action]} for Order #${id} completed successfully!`, 'success');
    } catch (err) {
      const msg = getErrorMessage(err, `Action failed for Order #${id}`);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setBusyOrderId(null);
    }
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const confirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
    const withGuide = orders.filter((o) => o.status === 'WITH_GUIDE').length;
    const inProgress = orders.filter((o) => o.status === 'IN_PROGRESS').length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { total, pending, confirmed, withGuide, inProgress, completed, cancelled, totalRevenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
        if (typeFilter !== 'ALL') {
          const hasType = order.items.some((i) => i.itemType === typeFilter);
          if (!hasType) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = String(order.id).includes(q) || `ord-${order.id}`.toLowerCase().includes(q);
          const matchUser =
            (order.customerName && order.customerName.toLowerCase().includes(q)) ||
            (order.customerPhone && order.customerPhone.toLowerCase().includes(q)) ||
            (order.customerEmail && order.customerEmail.toLowerCase().includes(q)) ||
            (order.customerAddress && order.customerAddress.toLowerCase().includes(q));
          const matchItem = order.items.some((item) => {
            const pName = products[item.productId]?.name?.toLowerCase() || '';
            return pName.includes(q) || String(item.productId).includes(q);
          });
          const matchDelivery =
            (order.deliveryLocation && order.deliveryLocation.toLowerCase().includes(q)) ||
            (order.deliveryNotes && order.deliveryNotes.toLowerCase().includes(q));

          if (!matchId && !matchUser && !matchItem && !matchDelivery) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders, statusFilter, typeFilter, searchQuery, products]);

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" className="flex items-center gap-1.5 py-1 px-2.5 font-bold">
            <Clock className="w-3.5 h-3.5 text-[#D97845] animate-pulse" />
            <span>Awaiting approval</span>
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="neutral" className="flex items-center gap-1.5 py-1 px-2.5 font-bold border-[#3B82F6] text-[#1E40AF] bg-[#EFF6FF]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Approved · Ready at store</span>
          </Badge>
        );
      case 'WITH_GUIDE':
        return (
          <Badge variant="neutral" className="flex items-center gap-1.5 py-1 px-2.5 font-bold border-[#7C3AED] text-[#5B21B6] bg-[#F5F3FF]">
            <Compass className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>With Tour Guide</span>
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="success" className="flex items-center gap-1.5 py-1 px-2.5 font-bold bg-[#ECFDF5] border-[#10B981] text-[#065F46]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Delivered · In the field</span>
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="primary" className="flex items-center gap-1.5 py-1 px-2.5 font-bold bg-[#152A20] text-[#F3EFE6]">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed / Returned</span>
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" className="flex items-center gap-1.5 py-1 px-2.5 font-bold">
            <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Cancelled</span>
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const renderPaymentBadge = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs"><Check className="w-3 h-3" /> Paid</span>;
      case 'PARTIALLY_PAID':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-xs"><Clock className="w-3 h-3" /> Partial</span>;
      case 'REFUNDED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-xs"><RotateCcw className="w-3 h-3" /> Refunded</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-xs"><Clock className="w-3 h-3" /> Unpaid</span>;
    }
  };

  const renderDeliveryBadge = (order: Order) => {
    if (order.deliveryType === 'TOUR_DELIVERY') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
          <Compass size={12} className="text-violet-600" />
          Tour Delivery {order.scheduleId ? `(Departure #${order.scheduleId})` : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-700">
        <Building size={12} className="text-stone-500" />
        Outpost Pickup
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 p-4 rounded-xs shadow-lg flex items-center gap-3 text-xs font-bold transition-all transform animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-[#152A20] text-[#F3EFE6] border border-[#2B4E3C]'
              : 'bg-[#991B1B] text-white border border-[#B91C1C]'
          }`}
        >
          {toastMessage.type === 'success' ? (
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

      {/* Header Banner */}
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">BRANCH DISPATCH DESK</Badge>
            <span className="text-xs font-bold text-[#5C665F]">
              STATION: {selectedStation?.name || `Branch #${branchId}`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Customer Orders & Fulfillment
          </h1>
          <p className="text-xs text-[#5C665F]">
            Approve customer orders, dispatch tour gear to guides, and hand over equipment for outpost pickups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void fetchOrders(true)}
            disabled={refreshing || loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <div className="flex items-center bg-[#EBE6DC] p-0.5 rounded-xs border border-[#D8D2C5]">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-xs text-xs transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-[#152A20] text-white shadow-xs' : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xs text-xs transition cursor-pointer ${
                viewMode === 'table' ? 'bg-[#152A20] text-white shadow-xs' : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* KPI & Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card padding="sm" className="space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#152A20]">
          <span className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider block">BRANCH ORDERS</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">{stats.total}</div>
          <span className="text-[10px] text-[#5C665F]">At this station</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#FDF8F3] border-l-4 border-l-[#D97845] cursor-pointer hover:-translate-y-0.5 transition ${
            statusFilter === 'PENDING' ? 'ring-2 ring-[#D97845]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">AWAITING APPROVAL</span>
            {stats.pending > 0 && <span className="w-2 h-2 rounded-full bg-[#D97845] animate-ping" />}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#D97845] font-headline">{stats.pending}</div>
          <span className="text-[10px] text-[#737C75]">Pending review</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F0F7FF] border-l-4 border-l-[#2563EB] cursor-pointer hover:-translate-y-0.5 transition ${
            statusFilter === 'CONFIRMED' ? 'ring-2 ring-[#2563EB]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
        >
          <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">READY AT STORE</span>
          <div className="text-xl sm:text-2xl font-bold text-[#1E40AF] font-headline">{stats.confirmed}</div>
          <span className="text-[10px] text-[#737C75]">To pack / hand over</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F5F3FF] border-l-4 border-l-[#7C3AED] cursor-pointer hover:-translate-y-0.5 transition ${
            statusFilter === 'WITH_GUIDE' ? 'ring-2 ring-[#7C3AED]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'WITH_GUIDE' ? 'ALL' : 'WITH_GUIDE')}
        >
          <span className="text-[10px] text-[#7C3AED] font-bold uppercase tracking-wider block">WITH GUIDE</span>
          <div className="text-xl sm:text-2xl font-bold text-[#5B21B6] font-headline">{stats.withGuide}</div>
          <span className="text-[10px] text-[#737C75]">Dispatched for tour</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F0FDF4] border-l-4 border-l-[#10B981] cursor-pointer hover:-translate-y-0.5 transition ${
            statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-[#10B981]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
        >
          <span className="text-[10px] text-[#059669] font-bold uppercase tracking-wider block">IN THE FIELD</span>
          <div className="text-xl sm:text-2xl font-bold text-[#065F46] font-headline">{stats.inProgress}</div>
          <span className="text-[10px] text-[#737C75]">Customer has gear</span>
        </Card>

        <Card padding="sm" className="space-y-1 bg-[#152A20] text-white border-l-4 border-l-[#D97845]">
          <span className="text-[10px] text-[#ADCBBB] font-bold uppercase tracking-wider block">TOTAL TARIFF</span>
          <div className="text-lg sm:text-xl font-bold text-[#F3EFE6] font-headline truncate" title={vnd(stats.totalRevenue)}>
            {vnd(stats.totalRevenue)}
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Station revenue
          </span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#D8D2C5]/60">
          {[
            { key: 'ALL', label: 'ALL ORDERS', count: stats.total },
            { key: 'PENDING', label: 'AWAITING APPROVAL', count: stats.pending, alert: stats.pending > 0 },
            { key: 'CONFIRMED', label: 'READY AT STORE', count: stats.confirmed },
            { key: 'WITH_GUIDE', label: 'WITH GUIDE', count: stats.withGuide },
            { key: 'IN_PROGRESS', label: 'IN USE', count: stats.inProgress },
            { key: 'COMPLETED', label: 'COMPLETED', count: stats.completed },
            { key: 'CANCELLED', label: 'CANCELLED', count: stats.cancelled },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xs text-xs font-bold tracking-wide transition uppercase cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
                    : 'bg-[#EBE6DC] text-[#5C665F] hover:text-[#111D16] hover:bg-[#DDD7CB]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.alert
                      ? 'bg-[#D97845] text-white'
                      : 'bg-[#D8D2C5] text-[#5C665F]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#737C75]">Type:</span>
            {(['ALL', 'RENTAL', 'SALE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-xs text-xs font-bold uppercase transition cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[#152A20] text-white'
                    : 'bg-[#EBE6DC] text-[#5C665F] hover:text-[#111D16]'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t === 'RENTAL' ? 'Rental Only' : 'Sale Only'}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-80 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, gear, note..."
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs pl-8 pr-3 py-1.5 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] font-body"
            />
            <Search className="w-3.5 h-3.5 text-[#7A857E] absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Orders Content */}
      {loading ? (
        <Card padding="lg" className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto text-[#152A20] animate-spin mb-3" />
          <p className="text-sm font-bold text-[#111D16]">Loading station orders...</p>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card padding="lg" className="text-center py-12 bg-white border border-[#D8D2C5]">
          <Package className="w-10 h-10 mx-auto text-[#737C75] mb-3 opacity-60" />
          <h3 className="text-base font-bold text-[#111D16]">No orders match your filter</h3>
          <p className="text-xs text-[#5C665F] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No orders found matching "${searchQuery}". Try adjusting your keywords.`
              : 'There are currently no orders for this station matching the selected status.'}
          </p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card padding="none" className="overflow-hidden border border-[#D8D2C5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-label">
              <thead className="bg-[#EBE6DC] text-[#7A857E] border-b border-[#D8D2C5] uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Order / Date</th>
                  <th className="p-3.5">Customer Contact</th>
                  <th className="p-3.5">Delivery Destination</th>
                  <th className="p-3.5">Equipment Summary</th>
                  <th className="p-3.5">Total & Payment</th>
                  <th className="p-3.5">Order Status</th>
                  <th className="p-3.5 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8D2C5]">
                {filteredOrders.map((order) => {
                  const isBusy = busyOrderId === order.id;
                  const customerName = order.customerName || `Customer #${order.userId}`;

                  return (
                    <tr key={order.id} className="hover:bg-[#EBE6DC]/30 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-[#111D16] font-mono-spec">
                          Order #{order.id}
                        </div>
                        <div className="text-[10px] text-[#7A857E]">
                          {formatDateTime(order.orderDate)}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-[#111D16]">{customerName}</div>
                        {order.customerPhone && (
                          <div className="text-[10px] text-[#5C665F] flex items-center gap-1">
                            <Phone size={10} /> {order.customerPhone}
                          </div>
                        )}
                        {order.customerEmail && (
                          <div className="text-[10px] text-[#7A857E] flex items-center gap-1">
                            <Mail size={10} /> {order.customerEmail}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 space-y-1">
                        <div>{renderDeliveryBadge(order)}</div>
                        {order.deliveryLocation && (
                          <div className="text-[10px] text-[#5C665F] flex items-center gap-1">
                            <MapPin size={10} className="shrink-0 text-emerald-700" />
                            <span className="truncate max-w-xs">{order.deliveryLocation}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((item) => {
                            const isRental = item.itemType === 'RENTAL';
                            const cutoff = order.returnCutoffTime || '18:00';
                            const deadline = item.rentalEndDate ? new Date(`${item.rentalEndDate}T${cutoff}:00`).getTime() : NaN;
                            const isOverdue = order.status === 'IN_PROGRESS' && isRental && !isNaN(deadline) && Date.now() > deadline;

                            return (
                              <div key={item.id} className="text-[11px] text-[#111D16]">
                                <div className="truncate">
                                  • {products[item.productId]?.name || `Gear #${item.productId}`} ×{item.quantity}{' '}
                                  <span className="text-[10px] text-[#7A857E]">({item.itemType})</span>
                                </div>
                                {isRental && item.rentalEndDate && (
                                  <div className="text-[10px] text-amber-800 flex items-center gap-1 font-mono-spec ml-2">
                                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Due: {cutoff}, {item.rentalEndDate}</span>
                                    {isOverdue && (
                                      <span className="px-1 py-0.2 bg-red-100 text-red-700 border border-red-300 rounded-xs text-[9px] font-bold uppercase animate-pulse">
                                        Overdue
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {order.items.length > 2 && (
                            <div className="text-[10px] text-stone-500 font-semibold">
                              +{order.items.length - 2} more items...
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-[#152A20] font-mono-spec">
                          {vnd(order.totalAmount)}
                        </div>
                        <div className="mt-0.5">{renderPaymentBadge(order.paymentStatus)}</div>
                      </td>

                      <td className="p-3.5">{renderStatusBadge(order.status)}</td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {order.status === 'PENDING' && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isBusy || !order.canApprove}
                              onClick={() => void handleAction(order.id, 'confirm')}
                              title={order.canApprove ? 'Approve order' : 'Awaiting payment'}
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            </Button>
                          )}

                          {order.status === 'CONFIRMED' && (
                            <Button
                              variant="accent"
                              size="sm"
                              disabled={isBusy}
                              onClick={() =>
                                void handleAction(
                                  order.id,
                                  order.deliveryType === 'TOUR_DELIVERY' ? 'guide-pickup' : 'hand-over',
                                )
                              }
                              title={
                                order.deliveryType === 'TOUR_DELIVERY'
                                  ? 'Dispatch equipment to guide'
                                  : 'Hand over equipment to customer'
                              }
                            >
                              {order.deliveryType === 'TOUR_DELIVERY' ? (
                                <Truck className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}

                          {order.status === 'WITH_GUIDE' && (
                            <Button
                              variant="accent"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => void handleAction(order.id, 'hand-over')}
                              title="Hand over to customer"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {order.status === 'IN_PROGRESS' && (
                            order.items.some((i) => i.itemType === 'RENTAL') ? (
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isBusy || !order.canReturn}
                                onClick={() => void handleAction(order.id, 'return')}
                                title={
                                  order.canReturn
                                    ? 'Receive returned equipment'
                                    : 'Awaiting customer receipt'
                                }
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                              </Button>
                            ) : (
                              <span className="text-[10px] text-stone-500 font-medium italic">
                                Awaiting receipt
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isBusy = busyOrderId === order.id;
            const customerName = order.customerName || `Customer #${order.userId}`;

            return (
              <Card key={order.id} padding="md" className="space-y-4 border border-[#D8D2C5] bg-white">
                <div className="flex items-start justify-between gap-2 border-b border-[#D8D2C5]/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#111D16]">Order #{order.id}</span>
                      {renderStatusBadge(order.status)}
                    </div>
                    <span className="text-[11px] text-[#7A857E] mt-0.5 block">
                      Placed on {formatDateTime(order.orderDate)}
                    </span>
                  </div>
                  <div>{renderPaymentBadge(order.paymentStatus)}</div>
                </div>

                <div className="space-y-1.5 text-xs text-[#5C665F] bg-[#F8F6F1] p-3 rounded-xs border border-[#D8D2C5]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111D16] flex items-center gap-1.5">
                      <User size={13} className="text-stone-500" /> {customerName}
                    </span>
                    {renderDeliveryBadge(order)}
                  </div>
                  {order.customerPhone && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone size={11} /> {order.customerPhone}
                    </div>
                  )}
                  {order.deliveryLocation && (
                    <div className="flex items-start gap-1.5 text-[11px] text-emerald-800">
                      <MapPin size={11} className="mt-0.5 shrink-0" />
                      <span>{order.deliveryLocation}</span>
                    </div>
                  )}
                  {order.deliveryNotes && (
                    <div className="text-[11px] text-stone-600">
                      <span className="font-semibold">Notes:</span> {order.deliveryNotes}
                    </div>
                  )}
                </div>

                <ul className="divide-y divide-[#D8D2C5]/50 text-xs">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-1.5 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[#111D16]">
                          {products[item.productId]?.name || `Gear #${item.productId}`}
                        </span>{' '}
                        <span className="text-[11px] text-[#7A857E]">
                          ×{item.quantity} ({item.itemType})
                        </span>
                      </div>
                      <span className="font-mono-spec font-bold text-[#152A20]">
                        {vnd(item.unitPrice * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-[#D8D2C5]/60 pt-3">
                  <div>
                    <span className="text-[10px] text-[#7A857E] uppercase block">TOTAL AMOUNT</span>
                    <span className="text-base font-bold text-[#152A20] font-mono-spec">
                      {vnd(order.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Details
                    </Button>

                    {order.status === 'PENDING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isBusy || !order.canApprove}
                        onClick={() => void handleAction(order.id, 'confirm')}
                        icon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
                      >
                        {isBusy ? 'Approving...' : 'Approve'}
                      </Button>
                    )}

                    {order.status === 'CONFIRMED' && (
                      <Button
                        variant="accent"
                        size="sm"
                        disabled={isBusy}
                        onClick={() =>
                          void handleAction(
                            order.id,
                            order.deliveryType === 'TOUR_DELIVERY' ? 'guide-pickup' : 'hand-over',
                          )
                        }
                        icon={
                          order.deliveryType === 'TOUR_DELIVERY' ? (
                            <Truck className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {isBusy
                          ? 'Updating...'
                          : order.deliveryType === 'TOUR_DELIVERY'
                          ? 'Dispatch to guide'
                          : 'Hand over'}
                      </Button>
                    )}

                    {order.status === 'WITH_GUIDE' && (
                      <Button
                        variant="accent"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => void handleAction(order.id, 'hand-over')}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {isBusy ? 'Handing over...' : 'Hand over'}
                      </Button>
                    )}

                    {order.status === 'IN_PROGRESS' && (
                      order.items.some((i) => i.itemType === 'RENTAL') ? (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isBusy || !order.canReturn}
                          onClick={() => void handleAction(order.id, 'return')}
                          icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-400" />}
                        >
                          {isBusy
                            ? 'Receiving...'
                            : order.canReturn
                            ? 'Receive return'
                            : 'Awaiting receipt'}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-stone-500 font-medium italic">
                          Awaiting customer receipt
                        </span>
                      )
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`BRANCH ORDER DETAILS #${selectedOrder.id}`}
        >
          <div className="space-y-5 text-xs font-label">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D2C5] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#111D16]">Order #{selectedOrder.id}</span>
                  {renderStatusBadge(selectedOrder.status)}
                </div>
                <div className="text-[11px] text-[#7A857E] mt-0.5">
                  Placed on {formatDateTime(selectedOrder.orderDate)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#7A857E] uppercase block">TOTAL AMOUNT</span>
                <span className="text-xl font-bold text-[#152A20] font-mono-spec">
                  {vnd(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F8F6F1] p-3 rounded-xs border border-[#D8D2C5]/60">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#737C75]">Customer Information</div>
                <div className="font-bold text-[#111D16]">
                  {selectedOrder.customerName || `Customer #${selectedOrder.userId}`}
                </div>
                {selectedOrder.customerPhone && (
                  <div className="text-[11px] text-[#5C665F]">Phone: {selectedOrder.customerPhone}</div>
                )}
                {selectedOrder.customerEmail && (
                  <div className="text-[11px] text-[#5C665F]">Email: {selectedOrder.customerEmail}</div>
                )}
                {selectedOrder.customerAddress && (
                  <div className="text-[11px] text-[#5C665F]">Address: {selectedOrder.customerAddress}</div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#737C75]">Fulfillment & Delivery</div>
                <div>{renderDeliveryBadge(selectedOrder)}</div>
                {selectedOrder.deliveryLocation && (
                  <div className="text-[11px] text-[#5C665F]">
                    <span className="font-semibold">Drop-off:</span> {selectedOrder.deliveryLocation}
                  </div>
                )}
                {selectedOrder.deliveryNotes && (
                  <div className="text-[11px] text-[#5C665F]">
                    <span className="font-semibold">Notes:</span> {selectedOrder.deliveryNotes}
                  </div>
                )}
                <div className="text-[11px] text-[#5C665F]">
                  <span className="font-semibold">Payment:</span> {renderPaymentBadge(selectedOrder.paymentStatus)}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase text-[#737C75] mb-2">Order Line Items</div>
              <div className="border border-[#D8D2C5] rounded-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EBE6DC] text-[#7A857E] uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8D2C5]/60">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5">
                          <div className="font-bold text-[#111D16]">
                            {products[item.productId]?.name || `Gear #${item.productId}`}
                          </div>
                          {item.itemType === 'RENTAL' && item.rentalStartDate && item.rentalEndDate && (
                            <div className="text-[10px] text-[#7A857E]">
                              {item.rentalStartDate} to {item.rentalEndDate}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5">
                          <Badge variant={item.itemType === 'RENTAL' ? 'warning' : 'primary'}>
                            {item.itemType}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-right font-bold text-[#111D16]">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono-spec">{vnd(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-mono-spec font-bold text-[#152A20]">
                          {vnd(item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Return Deadline Policy Notice */}
            {selectedOrder.items.some((i) => i.itemType === 'RENTAL') && (() => {
              const cutoff = selectedOrder.returnCutoffTime || '18:00';
              const rentalItem = selectedOrder.items.find((i) => i.itemType === 'RENTAL');
              const deadline = rentalItem?.rentalEndDate ? new Date(`${rentalItem.rentalEndDate}T${cutoff}:00`).getTime() : NaN;
              const isOverdue = selectedOrder.status === 'IN_PROGRESS' && !isNaN(deadline) && Date.now() > deadline;

              return (
                <div className="p-3 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-xs text-[#9A3412] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C2410C] shrink-0" />
                    <div>
                      <span className="font-bold">Daily Return Cut-off:</span> Before <strong>{cutoff}</strong> on {rentalItem?.rentalEndDate || 'scheduled return date'}
                      <span className="block text-[11px] text-[#7C2D12]">
                        Daily billing policy (partial-day rentals / 1 hour count as 1 full billing day).
                      </span>
                    </div>
                  </div>
                  {isOverdue && (
                    <Badge variant="danger" size="sm" className="font-bold uppercase animate-pulse shrink-0">
                      Overdue · Late return
                    </Badge>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-between border-t border-[#D8D2C5] pt-4">
              <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busyOrderId === selectedOrder.id || !selectedOrder.canApprove}
                    onClick={() => void handleAction(selectedOrder.id, 'confirm')}
                    icon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Approve order
                  </Button>
                )}

                {selectedOrder.status === 'CONFIRMED' && (
                  <Button
                    variant="accent"
                    size="sm"
                    disabled={busyOrderId === selectedOrder.id}
                    onClick={() =>
                      void handleAction(
                        selectedOrder.id,
                        selectedOrder.deliveryType === 'TOUR_DELIVERY' ? 'guide-pickup' : 'hand-over',
                      )
                    }
                    icon={
                      selectedOrder.deliveryType === 'TOUR_DELIVERY' ? (
                        <Truck className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {selectedOrder.deliveryType === 'TOUR_DELIVERY'
                      ? 'Dispatch to guide'
                      : 'Hand over to customer'}
                  </Button>
                )}

                {selectedOrder.status === 'WITH_GUIDE' && (
                  <Button
                    variant="accent"
                    size="sm"
                    disabled={busyOrderId === selectedOrder.id}
                    onClick={() => void handleAction(selectedOrder.id, 'hand-over')}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Hand over to customer
                  </Button>
                )}

                {selectedOrder.status === 'IN_PROGRESS' && (
                  selectedOrder.items.some((i) => i.itemType === 'RENTAL') ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busyOrderId === selectedOrder.id || !selectedOrder.canReturn}
                      onClick={() => void handleAction(selectedOrder.id, 'return')}
                      icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-400" />}
                    >
                      {selectedOrder.customerReceivedAt ? 'Complete return inspection' : 'Awaiting customer receipt'}
                    </Button>
                  ) : (
                    <span className="text-xs text-stone-500 font-medium italic">
                      Awaiting customer receipt confirmation
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
