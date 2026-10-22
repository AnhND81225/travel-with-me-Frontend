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
      setError(getErrorMessage(err, 'Không thể tải danh sách đơn hàng từ máy chủ'));
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
      confirm: 'Xác nhận đơn hàng',
      'hand-over': 'Bàn giao thiết bị xuất kho',
      return: 'Nghiệm thu & nhận trả thiết bị',
      cancel: 'Hủy đơn hàng',
    };

    try {
      const updated = await catalogApi<Order>(`/orders/${id}/${action}`, { method: 'POST' });
      setOrders((prev) => prev.map((row) => (row.id === id ? updated : row)));

      if (selectedOrder?.id === id) {
        setSelectedOrder(updated);
      }

      showToast(`Đã thực hiện: ${actionLabels[action]} #${id} thành công!`, 'success');
      setOrderToCancel(null);
    } catch (err) {
      const msg = getErrorMessage(err, `Thao tác ${actionLabels[action]} thất bại`);
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
          const matchUser = String(order.userId).includes(q) || `khách #${order.userId}`.includes(q);
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
            <span>Chờ duyệt xuất</span>
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="neutral" className="flex items-center gap-1.5 py-1 px-2.5 font-bold border-[#3B82F6] text-[#1E40AF] bg-[#EFF6FF]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Đã xác nhận · Chờ giao</span>
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="success" className="flex items-center gap-1.5 py-1 px-2.5 font-bold bg-[#ECFDF5] border-[#10B981] text-[#065F46]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Đang sử dụng · Hiện trường</span>
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="primary" className="flex items-center gap-1.5 py-1 px-2.5 font-bold bg-[#152A20] text-[#F3EFE6]">
            <Check className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Đã hoàn tất / Thu hồi</span>
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" className="flex items-center gap-1.5 py-1 px-2.5 font-bold">
            <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Đã hủy</span>
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
            Quản Lý Vận Hành Đơn Hàng & Ký Gửi
          </h1>
          <p className="text-xs text-[#5C665F] font-body mt-1">
            Điều phối duyệt xuất thiết bị, theo dõi luân chuyển hiện trường và thu hồi ký quỹ toàn hệ thống trạm.
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
            {refreshing ? 'Đang đồng bộ...' : 'Đồng bộ'}
          </Button>

          <div className="border-l border-[#D8D2C5] h-6 mx-1"></div>

          <div className="bg-[#EBE6DC] border border-[#D8D2C5] p-0.5 rounded-xs flex items-center">
            <button
              onClick={() => setViewMode('cards')}
              title="Chế độ Thẻ chi tiết"
              className={`p-1.5 rounded-xs transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-[#152A20] text-white shadow-xs' : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Chế độ Bảng danh sách"
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
        <Card padding="sm" className="space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#152A20]">
          <span className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider block">TỔNG ĐƠN HÀNG</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">{stats.total}</div>
          <span className="text-[10px] text-[#5C665F]">Giao dịch ghi nhận</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#FDF8F3] border-l-4 border-l-[#D97845] transition cursor-pointer hover:border-[#D97845] ${
            statusFilter === 'PENDING' ? 'ring-2 ring-[#D97845]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">CHỜ DUYỆT</span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#D97845] animate-ping"></span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#D97845] font-headline">{stats.pending}</div>
          <span className="text-[10px] text-[#737C75]">Cần duyệt xuất kho</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F0F7FF] border-l-4 border-l-[#2563EB] transition cursor-pointer hover:border-[#2563EB] ${
            statusFilter === 'CONFIRMED' ? 'ring-2 ring-[#2563EB]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
        >
          <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">ĐÃ XÁC NHẬN</span>
          <div className="text-xl sm:text-2xl font-bold text-[#1E40AF] font-headline">{stats.confirmed}</div>
          <span className="text-[10px] text-[#737C75]">Chờ khách nhận đồ</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F0FDF4] border-l-4 border-l-[#10B981] transition cursor-pointer hover:border-[#10B981] ${
            statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-[#10B981]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
        >
          <span className="text-[10px] text-[#059669] font-bold uppercase tracking-wider block">ĐANG SỬ DỤNG</span>
          <div className="text-xl sm:text-2xl font-bold text-[#065F46] font-headline">{stats.inProgress}</div>
          <span className="text-[10px] text-[#737C75]">Trên tuyến dã ngoại</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#4B5563] transition cursor-pointer hover:border-[#4B5563] ${
            statusFilter === 'COMPLETED' ? 'ring-2 ring-[#4B5563]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
        >
          <span className="text-[10px] text-[#4B5563] font-bold uppercase tracking-wider block">HOÀN TẤT</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">{stats.completed}</div>
          <span className="text-[10px] text-[#737C75]">Đã thu hồi & nghiệm thu</span>
        </Card>

        <Card padding="sm" className="space-y-1 bg-[#152A20] text-white border-l-4 border-l-[#D97845]">
          <span className="text-[10px] text-[#ADCBBB] font-bold uppercase tracking-wider block">TỔNG DOANH SỐ</span>
          <div className="text-lg sm:text-xl font-bold text-[#F3EFE6] font-headline truncate" title={vnd(stats.totalRevenue)}>
            {vnd(stats.totalRevenue)}
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Đơn hợp lệ
          </span>
        </Card>
      </div>

      {/* Main Filter & Search Control Panel */}
      <Card padding="md" className="space-y-4">
        {/* Status Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#D8D2C5]/60">
          {[
            { key: 'ALL', label: 'TẤT CẢ ĐƠN', count: stats.total },
            { key: 'PENDING', label: 'CHỜ DUYỆT', count: stats.pending, alert: stats.pending > 0 },
            { key: 'CONFIRMED', label: 'ĐÃ DUYỆT', count: stats.confirmed },
            { key: 'IN_PROGRESS', label: 'ĐANG THUÊ', count: stats.inProgress },
            { key: 'COMPLETED', label: 'HOÀN THÀNH', count: stats.completed },
            { key: 'CANCELLED', label: 'ĐÃ HỦY', count: stats.cancelled },
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
              placeholder="Tìm theo Mã đơn (#12), Mã khách, Chi nhánh hoặc Tên thiết bị..."
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
              <option value="ALL">Tất cả chi nhánh / Trạm Outpost</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  Trạm #{b.id} — {b.name}
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
              <option value="ALL">Tất cả hình thức</option>
              <option value="RENTAL">Đơn Thuê thiết bị</option>
              <option value="SALE">Đơn Mua thiết bị</option>
            </select>
          </div>

          {/* Sort order */}
          <div className="lg:col-span-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="highest">Giá trị cao nhất</option>
              <option value="lowest">Giá trị thấp nhất</option>
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
            Thử lại
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
            Không tìm thấy đơn hàng nào
          </h3>
          <p className="text-xs text-[#5C665F] max-w-md mx-auto font-body">
            {searchQuery || statusFilter !== 'ALL' || branchFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Thử điều chỉnh lại bộ lọc trạng thái, từ khóa tìm kiếm hoặc chọn tất cả chi nhánh để xem danh sách.'
              : 'Hiện tại chưa có đơn mua hoặc thuê thiết bị nào được ghi nhận trên hệ thống.'}
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
              Xóa bộ lọc
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
                      ĐƠN HÀNG #{order.id}
                    </span>

                    {renderStatusBadge(order.status)}

                    <span className="text-xs text-[#5C665F] font-mono-spec flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#737C75]" />
                      {new Date(order.orderDate).toLocaleString('vi-VN', {
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
                      {branch ? branch.name : `Trạm Outpost #${order.branchId}`}
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
                                {product?.name || `Thiết bị mã #${item.productId}`}
                              </span>
                              <Badge
                                variant={isRental ? 'warning' : 'neutral'}
                                size="sm"
                                className="text-[9px]"
                              >
                                {isRental ? 'THUÊ DÃ NGOẠI' : 'MUA SẮM'}
                              </Badge>
                            </div>

                            <div className="text-[11px] text-[#5C665F] mt-0.5 flex flex-wrap items-center gap-2">
                              <span>Mã SKU: #{item.productId}</span>
                              {product?.category && (
                                <>
                                  <span>•</span>
                                  <span>Phân loại: {product.category}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>Đơn giá: {vnd(item.unitPrice)}</span>
                            </div>

                            {/* Rental Period Badge if applicable */}
                            {isRental && item.rentalStartDate && item.rentalEndDate && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-[10px] text-[#D97845] font-bold">
                                <Calendar className="w-3 h-3" />
                                <span>Thời gian thuê: {item.rentalStartDate} → {item.rentalEndDate}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Line item subtotal */}
                        <div className="text-right sm:text-right shrink-0">
                          <div className="text-xs text-[#737C75]">Thành tiền</div>
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
                    <span className="text-xs text-[#737C75] uppercase font-bold">Tổng thanh toán:</span>
                    <span className="text-lg sm:text-xl font-bold text-[#152A20] font-headline text-[#D97845]">
                      {vnd(order.totalAmount)}
                    </span>
                    <span className="text-[10px] text-[#5C665F]">({order.items.length} hạng mục trang bị)</span>
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
                      Chi tiết
                    </Button>

                    {/* Pending Actions */}
                    {order.status === 'PENDING' && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => setOrderToCancel(order)}
                          icon={<X className="w-3.5 h-3.5" />}
                        >
                          Hủy đơn
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => void handleAction(order.id, 'confirm')}
                          icon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
                        >
                          {isBusy ? 'Đang duyệt...' : 'Phê duyệt đơn'}
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
                        {isBusy ? 'Đang giao...' : 'Bàn giao thiết bị'}
                      </Button>
                    )}

                    {/* In Progress Actions -> Return & Inspect */}
                    {order.status === 'IN_PROGRESS' && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => void handleAction(order.id, 'return')}
                        icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-400" />}
                      >
                        {isBusy ? 'Đang thu hồi...' : 'Nghiệm thu & Nhận trả'}
                      </Button>
                    )}

                    {/* Completed State */}
                    {order.status === 'COMPLETED' && (
                      <span className="text-xs text-[#152A20] font-bold flex items-center gap-1 px-2.5 py-1 bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Đã quyết toán kho
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
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4">Trạm xuất phát</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Hạng mục thiết bị</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
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
                        {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                        <div className="text-[10px] text-[#A39B8D]">
                          {new Date(order.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#111D16]">
                          {branch ? branch.name : `Trạm #${order.branchId}`}
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
                          {order.items.some(i => i.itemType === 'RENTAL') ? 'Có đồ thuê' : 'Đơn mua thẳng'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#152A20] font-headline whitespace-nowrap">
                        {vnd(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {order.status === 'PENDING' && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => void handleAction(order.id, 'confirm')}
                              title="Duyệt đơn"
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
                              title="Bàn giao"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {order.status === 'IN_PROGRESS' && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => void handleAction(order.id, 'return')}
                              title="Nhận trả"
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
          title={`BIÊN BẢN ĐIỀU PHỐI & MANIFEST #${selectedOrder.id}`}
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
                    HỒ SƠ ĐƠN HÀNG #{selectedOrder.id}
                  </h3>
                </div>
                <div>{renderStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Trạm phụ trách</span>
                  <span className="font-bold text-white">
                    {branchMap.get(selectedOrder.branchId)?.name || `Trạm #${selectedOrder.branchId}`}
                  </span>
                </div>
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Khách hàng</span>
                  <span className="font-bold text-white">Climber #{selectedOrder.userId}</span>
                </div>
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Thời gian lập</span>
                  <span className="font-mono-spec text-white">
                    {new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-[#ADCBBB] block text-[10px] uppercase">Tổng giá trị</span>
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
                Danh mục thiết bị ký gửi & bàn giao
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
                            {product?.name || `Thiết bị #${item.productId}`}
                          </span>
                          <Badge variant={isRental ? 'warning' : 'neutral'} size="sm">
                            {isRental ? 'THUÊ DÃ NGOẠI' : 'MUA'}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-[#5C665F] mt-0.5">
                          Số lượng: {item.quantity} × {vnd(item.unitPrice)}
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
                Quy trình Nghiệm thu An toàn & Bàn giao Trạm
              </h5>
              <ul className="text-[11px] text-[#5C665F] space-y-1 list-disc pl-4 font-body">
                <li>Kiểm tra số sê-ri / tem niêm phong và độ mỏi kết cấu trước khi xuất trạm.</li>
                <li>Đảm bảo người thuê đã đồng ý với Điều khoản Ký quỹ và Biên bản miễn trừ trách nhiệm.</li>
                <li>Khi nhận trả: Khử trùng buồng tia cực tím UV và kiểm tra phụ kiện hao mòn trước khi hoàn tất.</li>
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
                In Phiếu Xuất Trạm (Print)
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
                  Đóng
                </Button>

                {selectedOrder.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busyOrderId === selectedOrder.id}
                    onClick={() => void handleAction(selectedOrder.id, 'confirm')}
                    icon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Xác nhận xuất kho
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
                    Bàn giao khách
                  </Button>
                )}

                {selectedOrder.status === 'IN_PROGRESS' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busyOrderId === selectedOrder.id}
                    onClick={() => void handleAction(selectedOrder.id, 'return')}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Nghiệm thu hoàn tất
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
          title={`HỦY ĐƠN HÀNG #${orderToCancel.id}`}
          maxWidth="sm"
        >
          <div className="space-y-4 font-label text-xs">
            <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xs text-[#B91C1C] flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bạn có chắc chắn muốn hủy đơn hàng này?</p>
                <p className="text-[11px] mt-0.5 font-body">
                  Thao tác này sẽ chuyển đơn sang trạng thái CANCELLED và giải phóng lượng tồn kho đã đặt trước.
                </p>
              </div>
            </div>

            <div className="border border-[#D8D2C5] p-3 rounded-xs bg-[#F8F6F1]">
              <div className="flex justify-between">
                <span className="text-[#737C75]">Mã đơn:</span>
                <span className="font-bold">#{orderToCancel.id}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[#737C75]">Tổng tiền:</span>
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
                Giữ lại
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => void handleAction(orderToCancel.id, 'cancel')}
                disabled={busyOrderId === orderToCancel.id}
              >
                {busyOrderId === orderToCancel.id ? 'Đang hủy...' : 'Xác nhận hủy'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
