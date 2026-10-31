import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Filter,
  ArrowRight,
  Eye,
  Calendar,
  MapPin,
  User,
  Check,
  X,
  Printer,
  ShieldCheck,
  Tag,
  LayoutGrid,
  List,
  RotateCcw,
  Sparkles,
  TrendingUp,
  CreditCard,
  ChevronRight,
  Building,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { catalogApi, Branch, Product, vnd } from '../../features/equipment/catalogApi';
import type { Order, OrderStatus } from '../../features/orders/orderApi';

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SALE' | 'RENTAL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals & Details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load branches, products and orders
  const loadInitialData = async () => {
    try {
      const [branchesRes, productsRes] = await Promise.allSettled([
        catalogApi<Branch[]>('/branches'),
        catalogApi<{ content: Product[] }>('/admin/products?page=0&size=200'),
      ]);

      if (branchesRes.status === 'fulfilled') {
        setBranches(branchesRes.value || []);
      }
      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value?.content || []);
      }
    } catch {
      // Non-fatal if auxiliary lists fail
    }
  };

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const data = await catalogApi<Order[]>('/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load orders from the server'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
    void fetchOrders();
  }, []);

  // Quick action on order (confirm, hand-over, return, cancel)
  const handleAction = async (id: number, action: 'confirm' | 'hand-over' | 'return' | 'cancel') => {
    setBusyOrderId(id);
    setError('');

    const actionLabels: Record<string, string> = {
      confirm: 'Approve order',
      'hand-over': 'Hand over equipment',
      return: 'Inspect and receive returned equipment',
      cancel: 'Cancel order',
    };

    try {
      const updated = await catalogApi<Order>(`/orders/${id}/${action}`, { method: 'POST' });
      setOrders((prev) => prev.map((row) => (row.id === id ? updated : row)));

      if (selectedOrder?.id === id) {
        setSelectedOrder(updated);
      }

      showToast(`Completed: ${actionLabels[action]} #${id} successfully!`, 'success');
      setOrderToCancel(null);
    } catch (err) {
      const msg = getErrorMessage(err, `Action ${actionLabels[action]} failed`);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setBusyOrderId(null);
    }
  };

  // Lookup helpers
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

  // Statistics calculation
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const confirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
    const inProgress = orders.filter((o) => o.status === 'IN_PROGRESS').length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { total, pending, confirmed, inProgress, completed, cancelled, totalRevenue };
  }, [orders]);

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;

        // Branch filter
        if (branchFilter !== 'ALL' && String(order.branchId) !== branchFilter) return false;

        // Order item type filter (SALE vs RENTAL)
        if (typeFilter !== 'ALL') {
          const hasType = order.items.some((i) => i.itemType === typeFilter);
          if (!hasType) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = String(order.id).includes(q) || `ord-${order.id}`.toLowerCase().includes(q);
          const matchUser = String(order.userId).includes(q) || `customer #${order.userId}`.includes(q);
          const branchName = branchMap.get(order.branchId)?.name?.toLowerCase() || '';
          const matchBranch = branchName.includes(q) || String(order.branchId).includes(q);
          const matchItem = order.items.some((item) => {
            const pName = productMap.get(item.productId)?.name?.toLowerCase() || '';
            return pName.includes(q) || String(item.productId).includes(q);
          });

          if (!matchId && !matchUser && !matchBranch && !matchItem) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        if (sortOrder === 'oldest') return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        if (sortOrder === 'highest') return (b.totalAmount || 0) - (a.totalAmount || 0);
        if (sortOrder === 'lowest') return (a.totalAmount || 0) - (b.totalAmount || 0);
        return 0;
      });
  }, [orders, statusFilter, branchFilter, typeFilter, searchQuery, sortOrder, branchMap, productMap]);

  // Status renderer badge
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
            <span>Approved · Awaiting handover</span>
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="success" className="flex items-center gap-1.5 py-1 px-2.5 font-bold bg-[#ECFDF5] border-[#10B981] text-[#065F46]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>In use · In the field</span>
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="primary" className="flex items-center gap-1.5 py-1 px-2.5 font-bold bg-[#152A20] text-[#F3EFE6]">
            <Check className="w-3.5 h-3.5 text-[#10B981]" />
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
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

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8D2C5] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" className="bg-[#152A20] text-emerald-400">
              RANGER QUARTERMASTER // DISPATCH
            </Badge>
            <span className="text-xs text-[#5C665F] font-mono-spec">
              SYS-VERIFIED // DISPATCH_OPS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline tracking-tight">
            Equipment Order Operations
          </h1>
          <p className="text-xs text-[#5C665F] font-body mt-1">
            Approve paid orders, manage equipment handovers and receive rental returns across branches.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void fetchOrders(true)}
            disabled={loading || refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#D97845]' : ''}`} />}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <div className="border-l border-[#D8D2C5] h-6 mx-1"></div>

          <div className="bg-[#EBE6DC] border border-[#D8D2C5] p-0.5 rounded-xs flex items-center">
            <button
              onClick={() => setViewMode('cards')}
              title="Card view"
              className={`p-1.5 rounded-xs transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-[#152A20] text-white shadow-xs' : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table view"
              className={`p-1.5 rounded-xs transition cursor-pointer ${
                viewMode === 'table' ? 'bg-[#152A20] text-white shadow-xs' : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI & Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card padding="sm" className="space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#152A20] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <span className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider block">TOTAL ORDERS</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">{stats.total}</div>
          <span className="text-[10px] text-[#5C665F]">Recorded orders</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#FDF8F3] border-l-4 border-l-[#D97845] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'PENDING' ? 'ring-2 ring-[#D97845]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">AWAITING APPROVAL</span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#D97845] animate-ping"></span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#D97845] font-headline">{stats.pending}</div>
          <span className="text-[10px] text-[#737C75]">Awaiting order approval</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F0F7FF] border-l-4 border-l-[#2563EB] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'CONFIRMED' ? 'ring-2 ring-[#2563EB]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
        >
          <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">APPROVED</span>
          <div className="text-xl sm:text-2xl font-bold text-[#1E40AF] font-headline">{stats.confirmed}</div>
          <span className="text-[10px] text-[#737C75]">Awaiting pickup</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F0FDF4] border-l-4 border-l-[#10B981] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-[#10B981]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
        >
          <span className="text-[10px] text-[#059669] font-bold uppercase tracking-wider block">IN USE</span>
          <div className="text-xl sm:text-2xl font-bold text-[#065F46] font-headline">{stats.inProgress}</div>
          <span className="text-[10px] text-[#737C75]">Equipment in the field</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#4B5563] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'COMPLETED' ? 'ring-2 ring-[#4B5563]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
        >
          <span className="text-[10px] text-[#4B5563] font-bold uppercase tracking-wider block">COMPLETED</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">{stats.completed}</div>
          <span className="text-[10px] text-[#737C75]">Returned and inspected</span>
        </Card>

        <Card padding="sm" className="space-y-1 bg-[#152A20] text-white border-l-4 border-l-[#D97845] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <span className="text-[10px] text-[#ADCBBB] font-bold uppercase tracking-wider block">TOTAL ORDER VALUE</span>
          <div className="text-lg sm:text-xl font-bold text-[#F3EFE6] font-headline truncate" title={vnd(stats.totalRevenue)}>
            {vnd(stats.totalRevenue)}
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Active orders
          </span>
        </Card>
      </div>

      {/* Main Filter & Search Control Panel */}
      <Card padding="md" className="space-y-4">
        {/* Status Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#D8D2C5]/60">
          {[
            { key: 'ALL', label: 'ALL ORDERS', count: stats.total },
            { key: 'PENDING', label: 'AWAITING APPROVAL', count: stats.pending, alert: stats.pending > 0 },
            { key: 'CONFIRMED', label: 'APPROVED', count: stats.confirmed },
            { key: 'IN_PROGRESS', label: 'RENTED', count: stats.inProgress },
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
                  className={`text-[10px] px-1.5 py-0.2 rounded-xs font-mono-spec ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.alert
                      ? 'bg-[#D97845] text-white'
                      : 'bg-[#D8D2C5] text-[#111D16]'
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
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-[#737C75] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID (#12), customer ID, branch or product..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] placeholder-[#A39B8D] focus:outline-none focus:border-[#152A20]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737C75] hover:text-[#111D16]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Branch filter */}
          <div className="lg:col-span-3">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            >
              <option value="ALL">All branches / outposts</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  Branch #{b.id} — {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Order type filter */}
          <div className="lg:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'SALE' | 'RENTAL')}
              className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            >
              <option value="ALL">All order types</option>
              <option value="RENTAL">Equipment rental</option>
              <option value="SALE">Equipment purchase</option>
            </select>
          </div>

          {/* Sort order */}
          <div className="lg:col-span-2">
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

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xs text-xs text-[#B91C1C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => void fetchOrders()}
            className="underline font-bold hover:text-black ml-4 shrink-0 cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} padding="lg" className="animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-[#EBE6DC] w-48 rounded-xs"></div>
                <div className="h-5 bg-[#EBE6DC] w-24 rounded-xs"></div>
              </div>
              <div className="h-16 bg-[#EBE6DC] rounded-xs w-full"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-[#EBE6DC] w-32 rounded-xs"></div>
                <div className="h-8 bg-[#EBE6DC] w-28 rounded-xs"></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <Card padding="lg" className="text-center py-16 space-y-3 bg-[#F8F6F1]">
          <Package className="w-12 h-12 text-[#A39B8D] mx-auto stroke-1" />
          <h3 className="text-base font-bold text-[#111D16] font-headline uppercase">
            No orders found
          </h3>
          <p className="text-xs text-[#5C665F] max-w-md mx-auto font-body">
            {searchQuery || statusFilter !== 'ALL' || branchFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Adjust the status, search or branch filters to find orders.'
              : 'No equipment orders have been recorded yet.'}
          </p>
          {(searchQuery || statusFilter !== 'ALL' || branchFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setBranchFilter('ALL');
                setTypeFilter('ALL');
              }}
            >
              Clear filters
            </Button>
          )}
        </Card>
      )}

      {/* Orders List — CARD GRID VIEW */}
      {!loading && viewMode === 'cards' && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const branch = branchMap.get(order.branchId);
            const isBusy = busyOrderId === order.id;

            return (
              <Card
                key={order.id}
                padding="md"
                className="hover:border-[#152A20] transition bg-[#F8F6F1] space-y-4 border border-[#D8D2C5]"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8D2C5] pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-headline font-bold text-base text-[#111D16] flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#D97845]" />
                      ORDER #{order.id}
                    </span>

                    {renderStatusBadge(order.status)}

                    <span className="text-xs text-[#5C665F] font-mono-spec flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#737C75]" />
                      {new Date(order.orderDate).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Branch and Customer Tag */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs text-[#111D16] font-bold flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-[#152A20]" />
                      {branch ? branch.name : `Outpost #${order.branchId}`}
                    </span>
                    <span className="px-2 py-1 bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs text-[#5C665F] font-mono-spec flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#737C75]" />
                      Climber #{order.userId}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-white border border-[#D8D2C5] rounded-xs divide-y divide-[#EBE6DC] overflow-hidden">
                  {order.items.map((item) => {
                    const product = productMap.get(item.productId);
                    const isRental = item.itemType === 'RENTAL';

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
                                {product?.name || `Product #${item.productId}`}
                              </span>
                              <Badge
                                variant={isRental ? 'warning' : 'neutral'}
                                size="sm"
                                className="text-[9px]"
                              >
                                {isRental ? 'RENTAL' : 'PURCHASE'}
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
                              <span>Unit price: {vnd(item.unitPrice)}</span>
                            </div>

                            {/* Rental Period Badge if applicable */}
                            {isRental && item.rentalStartDate && item.rentalEndDate && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-[10px] text-[#D97845] font-bold">
                                <Calendar className="w-3 h-3" />
                                <span>Rental dates: {item.rentalStartDate} → {item.rentalEndDate}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Line item subtotal */}
                        <div className="text-right sm:text-right shrink-0">
                          <div className="text-xs text-[#737C75]">Subtotal</div>
                          <div className="font-bold text-sm text-[#152A20] font-headline">
                            {vnd(item.quantity * item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Footer & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-[#737C75] uppercase font-bold">Order total:</span>
                    <span className="text-lg sm:text-xl font-bold text-[#152A20] font-headline text-[#D97845]">
                      {vnd(order.totalAmount)}
                    </span>
                      <span className="text-[10px] text-[#5C665F]">({order.items.length} equipment items)</span>
                      <span className="text-xs font-bold">{order.refundPending ? 'Refund pending — approval blocked' : order.paymentStatus === 'PAID' ? 'Paid' : order.paymentStatus === 'PARTIALLY_PAID' ? 'Partially paid' : order.paymentStatus === 'REFUNDED' ? 'Refunded' : 'Unpaid'} · Amount due: {vnd(order.remainingAmount ?? order.totalAmount)}</span>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Details Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Details
                    </Button>

                    {/* Pending Actions */}
                    {order.status === 'PENDING' && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                            disabled={isBusy || !order.canCancel}
                          onClick={() => setOrderToCancel(order)}
                          icon={<X className="w-3.5 h-3.5" />}
                        >
                          Cancel order
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                            disabled={isBusy || !order.canApprove}
                          onClick={() => void handleAction(order.id, 'confirm')}
                          icon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
                        >
                          {isBusy ? 'Approving...' : 'Approve order'}
                        </Button>
                      </>
                    )}

                    {/* Confirmed Actions -> Hand over */}
                    {order.status === 'CONFIRMED' && (
                      <Button
                        variant="accent"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => void handleAction(order.id, 'hand-over')}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {isBusy ? 'Handing over...' : 'Hand over equipment'}
                      </Button>
                    )}

                    {/* In Progress Actions -> Return & Inspect */}
                    {order.status === 'IN_PROGRESS' && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isBusy || !order.canReturn}
                        onClick={() => void handleAction(order.id, 'return')}
                        icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-400" />}
                      >
                        {isBusy ? 'Receiving return...' : !order.customerReceivedAt ? 'Awaiting customer receipt' : 'Return & inspection'}
                      </Button>
                    )}

                    {/* Completed State */}
                    {order.status === 'COMPLETED' && (
                      <span className="text-xs text-[#152A20] font-bold flex items-center gap-1 px-2.5 py-1 bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Fulfillment complete
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Orders List — TABLE VIEW */}
      {!loading && viewMode === 'table' && filteredOrders.length > 0 && (
        <Card padding="none" className="overflow-hidden border border-[#D8D2C5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#152A20] text-[#F3EFE6] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Pickup branch</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Equipment items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC]">
                {filteredOrders.map((order) => {
                  const branch = branchMap.get(order.branchId);
                  const isBusy = busyOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-[#F8F6F1] transition">
                      <td className="py-3.5 px-4 font-bold text-sm text-[#111D16] font-headline">
                        #{order.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono-spec text-[#5C665F]">
                        {new Date(order.orderDate).toLocaleDateString('en-GB')}
                        <div className="text-[10px] text-[#A39B8D]">
                          {new Date(order.orderDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#111D16]">
                          {branch ? branch.name : `Branch #${order.branchId}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono-spec text-[#5C665F]">
                        Climber #{order.userId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="max-w-xs truncate" title={order.items.map(i => `${i.quantity}x ${productMap.get(i.productId)?.name || `#${i.productId}`}`).join(', ')}>
                          {order.items.map((i, idx) => (
                            <span key={i.id}>
                              {idx > 0 && ', '}
                              <strong>{i.quantity}×</strong> {productMap.get(i.productId)?.name || `#${i.productId}`}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-[#D97845] font-bold">
                          {order.items.some(i => i.itemType === 'RENTAL') ? 'Includes rentals' : 'Purchase order'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#152A20] font-headline whitespace-nowrap">
                        {vnd(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderStatusBadge(order.status)}
                          <span className="block mt-1 text-xs">{order.paymentStatus === 'PAID' ? 'Paid' : 'Not fully paid'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
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
                              title="Approve order"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {order.status === 'CONFIRMED' && (
                            <Button
                              variant="accent"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => void handleAction(order.id, 'hand-over')}
                              title="Hand over"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {order.status === 'IN_PROGRESS' && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isBusy || !order.canReturn}
                              onClick={() => void handleAction(order.id, 'return')}
                              title={order.canReturn ? "Return & inspection" : "Awaiting customer receipt"}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
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
      )}

      {/* DETAIL MODAL / EXPEDITION MANIFEST INSPECTION */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`ORDER MANIFEST #${selectedOrder.id}`}
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
                    ORDER RECORD #{selectedOrder.id}
                  </h3>
                </div>
                <div>{renderStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Branch</span>
                  <span className="font-bold text-white">
                    {branchMap.get(selectedOrder.branchId)?.name || `Branch #${selectedOrder.branchId}`}
                  </span>
                </div>
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Customer</span>
                  <span className="font-bold text-white">Climber #{selectedOrder.userId}</span>
                </div>
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Created at</span>
                  <span className="font-mono-spec text-white">
                    {new Date(selectedOrder.orderDate).toLocaleString('en-GB')}
                  </span>
                </div>
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Order value</span>
                  <span className="font-bold text-[#D97845] font-headline text-sm">
                    {vnd(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Gear Items Breakdown */}
            <div>
              <h4 className="font-bold text-sm text-[#111D16] uppercase mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#D97845]" />
                Equipment handover list
              </h4>
              <div className="border border-[#D8D2C5] rounded-xs divide-y divide-[#EBE6DC] overflow-hidden bg-white">
                {selectedOrder.items.map((item) => {
                  const product = productMap.get(item.productId);
                  const isRental = item.itemType === 'RENTAL';

                  return (
                    <div key={item.id} className="p-3 flex justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#111D16]">
                            {product?.name || `Product #${item.productId}`}
                          </span>
                          <Badge variant={isRental ? 'warning' : 'neutral'} size="sm">
                            {isRental ? 'RENTAL' : 'PURCHASE'}
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

            {/* Verification Checklist */}
            <div className="p-3.5 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs space-y-2">
              <h5 className="font-bold text-[#111D16] uppercase text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#152A20]" />
                Safety Inspection & Handover Checklist
              </h5>
              <ul className="text-[11px] text-[#5C665F] space-y-1 list-disc pl-4 font-body">
                <li>Check serial numbers, seals and structural wear before handover.</li>
                <li>Ensure the renter has accepted the deposit terms and liability waiver.</li>
                <li>On return, sanitize equipment and check accessories for wear before completing the order.</li>
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
                Print handover record
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>

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
                    onClick={() => void handleAction(selectedOrder.id, 'hand-over')}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Hand over to customer
                  </Button>
                )}

                {selectedOrder.status === 'IN_PROGRESS' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busyOrderId === selectedOrder.id || !selectedOrder.canReturn}
                    onClick={() => void handleAction(selectedOrder.id, 'return')}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    {selectedOrder.customerReceivedAt ? 'Complete return inspection' : 'Awaiting customer receipt'}
                  </Button>
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
                  This will cancel the order and release its rental reservation.
                </p>
              </div>
            </div>

            <div className="border border-[#D8D2C5] p-3 rounded-xs bg-[#F8F6F1]">
              <div className="flex justify-between">
                <span className="text-[#737C75]">Order ID:</span>
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
                disabled={busyOrderId === orderToCancel.id}
              >
                Keep order
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => void handleAction(orderToCancel.id, 'cancel')}
                  disabled={busyOrderId === orderToCancel.id || !orderToCancel.canCancel}
              >
                {busyOrderId === orderToCancel.id ? 'Cancelling...' : 'Confirm cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
