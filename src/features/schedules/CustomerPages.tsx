import React, { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Mountain,
  Compass,
  Calendar,
  CalendarDays,
  Clock,
  Clock3,
  MapPin,
  Ticket,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Sparkles,
  Copy,
  Check,
  Printer,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  History,
  TrendingUp,
  X,
  Footprints,
  Building,
  User
} from 'lucide-react';
import { eventGuideApi, type EventResponse, type PublicGuide } from '../../services/eventGuideApi';
import { participantApi, scheduleApi } from './api';
import { errorMessage, useClock, usePages, useResource, useScheduleAccount } from './hooks';
import { bookable, cancellable, dateTime, money, validId, auditLabels, labels } from './rules';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { storefrontAssets as images } from '../../data/storefront';
import type { Participant, Schedule, Audit, ParticipantStatus } from './types';

// Fallback cover images
const fallbackImages = [images.tanang, images.camp, images.forest, images.hike];

const vnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

const formatVnDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return dateTime(dateStr);
  }
};

// ==========================================
// STATUS BADGE RENDERERS
// ==========================================
const renderParticipantStatusBadge = (status: ParticipantStatus) => {
  switch (status) {
    case 'CONFIRMED':
      return (
        <Badge variant="success" className="bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] flex items-center gap-1 font-bold py-1 px-2">
          <CheckCircle2 className="w-3 h-3 text-[#059669]" />
          <span>ĐÃ XÁC NHẬN</span>
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="warning" className="bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74] flex items-center gap-1 font-bold py-1 px-2">
          <Clock className="w-3 h-3 text-[#EA580C]" />
          <span>CHỜ THANH TOÁN</span>
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="neutral" className="bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] flex items-center gap-1 font-bold py-1 px-2">
          <Check className="w-3 h-3 text-[#4B5563]" />
          <span>HOÀN THÀNH</span>
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="danger" className="bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] flex items-center gap-1 font-bold py-1 px-2">
          <XCircle className="w-3 h-3 text-[#DC2626]" />
          <span>ĐÃ HỦY VÉ</span>
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge variant="neutral" className="bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7] flex items-center gap-1 font-bold py-1 px-2">
          <AlertCircle className="w-3 h-3 text-[#A1A1AA]" />
          <span>HẾT HẠN GIỮ CHỖ</span>
        </Badge>
      );
    case 'NO_SHOW':
      return (
        <Badge variant="danger" className="bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] flex items-center gap-1 font-bold py-1 px-2">
          <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
          <span>VẮNG MẶT (NO-SHOW)</span>
        </Badge>
      );
    default:
      return <Badge variant="neutral">{labels[status] || status}</Badge>;
  }
};

const renderCheckInBadge = (checkInStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN') => {
  if (checkInStatus === 'CHECKED_IN') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
        <Check className="w-2.5 h-2.5" /> ĐÃ CHECK-IN TẠI TRẠM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#F8F6F1] text-[#737C75] border border-[#D8D2C5]">
      <Clock className="w-2.5 h-2.5" /> CHƯA CHECK-IN
    </span>
  );
};

// ==========================================
// MY TOURS PAGE (MAIN COMPONENT)
// ==========================================
export function MyToursPage() {
  const auth = useScheduleAccount();

  if (auth.loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-label">
        <div className="flex flex-col items-center justify-center space-y-4 py-20">
          <RefreshCw className="w-8 h-8 text-[#D97845] animate-spin" />
          <p className="text-sm font-bold text-[#5C665F]">Đang tải hồ sơ vé tour dã ngoại...</p>
        </div>
      </main>
    );
  }

  if (!auth.data) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-label">
        <Card padding="lg" className="text-center space-y-4 bg-[#F8F6F1]">
          <Compass className="w-12 h-12 text-[#D97845] mx-auto" />
          <h1 className="text-2xl font-bold font-headline text-[#152A20]">Vui lòng đăng nhập</h1>
          <p className="text-sm text-[#5C665F]">
            {auth.error || 'Bạn cần đăng nhập tài khoản khách hàng để xem lịch trình các chuyến đi và vé tour đã đặt.'}
          </p>
          <div className="pt-2">
            <Link to="/login?returnTo=/my-tours">
              <Button variant="accent">Đăng nhập ngay</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return <MyTickets key={auth.data.id} />;
}

// ==========================================
// MY TICKETS LIST
// ==========================================
function MyTickets() {
  const loader = useCallback((page: number) => participantApi.mine(page), []);
  const list = usePages(loader);
  const now = useClock(1000);
  const navigate = useNavigate();

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'departure' | 'highest' | 'lowest'>('newest');

  // Resource Caches
  const scheduleCache = useRef(new Map<number, ReturnType<typeof scheduleApi.get>>());
  const eventCache = useRef(new Map<number, ReturnType<typeof eventGuideApi.getEvent>>());

  const summaries = useResource(
    useCallback(async () => {
      const schedules = await Promise.allSettled(
        [...new Set(list.items.map((p) => p.scheduleId))].map((id) => {
          if (!scheduleCache.current.has(id)) {
            scheduleCache.current.set(
              id,
              scheduleApi.get(id).catch((e) => {
                scheduleCache.current.delete(id);
                throw e;
              })
            );
          }
          return scheduleCache.current.get(id)!;
        })
      );
      const foundSchedules = schedules.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));

      const events = await Promise.allSettled(
        [...new Set(foundSchedules.map((s) => s.eventId))].map((id) => {
          if (!eventCache.current.has(id)) {
            eventCache.current.set(
              id,
              eventGuideApi.getEvent(id).catch((e) => {
                eventCache.current.delete(id);
                throw e;
              })
            );
          }
          return eventCache.current.get(id)!;
        })
      );
      const foundEvents = events.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));

      const branches = await scheduleApi.branches().catch(() => []);

      return {
        schedules: foundSchedules,
        events: foundEvents,
        branches,
      };
    }, [list.items])
  );

  const branchesMap = useMemo(() => {
    const map = new Map<number, string>();
    summaries.data?.branches?.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [summaries.data?.branches]);

  const schedulesMap = useMemo(() => {
    const map = new Map<number, Schedule>();
    summaries.data?.schedules?.forEach((s) => map.set(s.id, s));
    return map;
  }, [summaries.data?.schedules]);

  const eventsMap = useMemo(() => {
    const map = new Map<number, EventResponse>();
    summaries.data?.events?.forEach((e) => map.set(e.eventId, e));
    return map;
  }, [summaries.data?.events]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = list.items.length;
    const pending = list.items.filter((p) => p.participantStatus === 'PENDING').length;
    const confirmed = list.items.filter((p) => p.participantStatus === 'CONFIRMED').length;
    const completed = list.items.filter((p) => p.participantStatus === 'COMPLETED').length;
    const cancelled = list.items.filter(
      (p) => p.participantStatus === 'CANCELLED' || p.participantStatus === 'EXPIRED'
    ).length;
    const totalSpent = list.items
      .filter((p) => p.participantStatus === 'CONFIRMED' || p.participantStatus === 'COMPLETED')
      .reduce((sum, p) => sum + (p.registeredPrice || 0), 0);

    return { total, pending, confirmed, completed, cancelled, totalSpent };
  }, [list.items]);

  // Filtered & Sorted Tickets
  const filteredTickets = useMemo(() => {
    return list.items
      .filter((ticket) => {
        // Status filter
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'CANCELLED') {
            if (ticket.participantStatus !== 'CANCELLED' && ticket.participantStatus !== 'EXPIRED') {
              return false;
            }
          } else if (ticket.participantStatus !== statusFilter) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = String(ticket.id).includes(q) || `ticket-${ticket.id}`.includes(q);
          const matchRef = (ticket.registrationReference || '').toLowerCase().includes(q);
          const schedule = schedulesMap.get(ticket.scheduleId);
          const event = schedule ? eventsMap.get(schedule.eventId) : null;
          const matchEventName = event?.eventName?.toLowerCase().includes(q) || false;
          const matchBranch = schedule ? (branchesMap.get(schedule.branchId) || '').toLowerCase().includes(q) : false;

          if (!matchId && !matchRef && !matchEventName && !matchBranch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'departure') {
          const sA = schedulesMap.get(a.scheduleId);
          const sB = schedulesMap.get(b.scheduleId);
          const tA = sA ? Date.parse(sA.startDatetime) : 0;
          const tB = sB ? Date.parse(sB.startDatetime) : 0;
          return tA - tB;
        }
        if (sortBy === 'highest') {
          return (b.registeredPrice || 0) - (a.registeredPrice || 0);
        }
        if (sortBy === 'lowest') {
          return (a.registeredPrice || 0) - (b.registeredPrice || 0);
        }
        // newest
        return Date.parse(b.registrationDate) - Date.parse(a.registrationDate);
      });
  }, [list.items, statusFilter, searchQuery, sortBy, schedulesMap, eventsMap, branchesMap]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 p-4 rounded-xs shadow-xl flex items-center gap-3 text-xs font-bold transition-all animate-in slide-in-from-top-2 duration-200 ${
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#D8D2C5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#D97845] uppercase mb-1">
            <Compass className="w-4 h-4" />
            <span>CLIMBER PASSPORT // EXPEDITIONS & TOURS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline tracking-tight">
            Chuyến Đi Của Tôi
          </h1>
          <p className="text-xs sm:text-sm text-[#5C665F] mt-1 max-w-2xl">
            Theo dõi vé tour dã ngoại, lịch xuất phát thực địa, kiểm tra thông tin tập trung tại trạm Outpost và hoàn tất thanh toán giữ chỗ.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/tours">
            <Button variant="accent" size="sm" icon={<Compass className="w-3.5 h-3.5" />}>
              Khám phá Tours
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              list.refresh();
              summaries.refresh();
              showToast('Đang làm mới danh sách chuyến đi...');
            }}
            disabled={list.loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${list.loading ? 'animate-spin text-[#D97845]' : ''}`} />}
          >
            {list.loading ? 'Đang tải...' : 'Đồng bộ'}
          </Button>
        </div>
      </div>

      {/* Explorer KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card padding="sm" className="space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#152A20] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <span className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider block">TỔNG VÉ ĐÃ ĐẶT</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">{stats.total}</div>
          <span className="text-[10px] text-[#5C665F]">Lịch sử tour đăng ký</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#FDF8F3] border-l-4 border-l-[#D97845] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'PENDING' ? 'ring-2 ring-[#D97845]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">CHỜ THANH TOÁN</span>
            {stats.pending > 0 && <span className="w-2 h-2 rounded-full bg-[#D97845] animate-ping" />}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#D97845] font-headline">{stats.pending}</div>
          <span className="text-[10px] text-[#737C75]">
            {stats.pending > 0 ? `${stats.pending} vé cần thanh toán giữ chỗ` : 'Không có vé chờ'}
          </span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F0FDF4] border-l-4 border-l-[#10B981] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'CONFIRMED' ? 'ring-2 ring-[#10B981]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
        >
          <span className="text-[10px] text-[#059669] font-bold uppercase tracking-wider block">ĐÃ XÁC NHẬN</span>
          <div className="text-xl sm:text-2xl font-bold text-[#065F46] font-headline">{stats.confirmed}</div>
          <span className="text-[10px] text-[#737C75]">Sẵn sàng khởi hành</span>
        </Card>

        <Card
          padding="sm"
          className={`space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#4B5563] transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'COMPLETED' ? 'ring-2 ring-[#4B5563]' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
        >
          <span className="text-[10px] text-[#4B5563] font-bold uppercase tracking-wider block">HOÀN THÀNH</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">{stats.completed}</div>
          <span className="text-[10px] text-[#737C75]">Chuyến đi trọn vẹn</span>
        </Card>

        <Card
          padding="sm"
          className="space-y-1 bg-[#F8F6F1] border-l-4 border-l-[#047857] hover:-translate-y-1 hover:shadow-md transition-all duration-200"
        >
          <span className="text-[10px] text-[#047857] font-bold uppercase tracking-wider block">TỔNG CHI PHÍ TOURS</span>
          <div className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline truncate" title={vnd(stats.totalSpent)}>
            {vnd(stats.totalSpent)}
          </div>
          <span className="text-[10px] text-[#059669] flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3 text-[#059669]" /> Giá trị đã xác nhận
          </span>
        </Card>
      </div>

      {/* Main Filter & Search Control Panel */}
      <Card padding="md" className="space-y-4">
        {/* Status Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#D8D2C5]/60">
          {[
            { key: 'ALL', label: 'TẤT CẢ', count: stats.total },
            { key: 'PENDING', label: 'CHỜ THANH TOÁN', count: stats.pending, alert: stats.pending > 0 },
            { key: 'CONFIRMED', label: 'ĐÃ XÁC NHẬN', count: stats.confirmed },
            { key: 'COMPLETED', label: 'HOÀN THÀNH', count: stats.completed },
            { key: 'CANCELLED', label: 'ĐÃ HỦY / HẾT HẠN', count: stats.cancelled },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xs text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
                    : 'text-[#5C665F] hover:text-[#111D16] hover:bg-[#EBE6DC]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-[#D97845] text-white'
                      : tab.alert
                      ? 'bg-[#D97845]/20 text-[#D97845]'
                      : 'bg-[#D8D2C5]/60 text-[#5C665F]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#737C75] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã vé (#12), tên tour, mã tham chiếu TRK-..., trạm Outpost..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs text-xs font-label text-[#111D16] focus:outline-none focus:border-[#152A20]"
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

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#5C665F] shrink-0 font-bold">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#D97845]" />
              <span className="hidden sm:inline">Sắp xếp:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs text-xs font-bold text-[#111D16] focus:outline-none focus:border-[#152A20]"
            >
              <option value="newest">Mới đặt nhất</option>
              <option value="departure">Khởi hành gần nhất</option>
              <option value="highest">Giá cao nhất</option>
              <option value="lowest">Giá thấp nhất</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {list.loading && list.items.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="lg" className="animate-pulse space-y-4 bg-[#F8F6F1]">
                <div className="h-6 bg-[#EBE6DC] rounded-xs w-1/3" />
                <div className="h-20 bg-[#EBE6DC] rounded-xs w-full" />
                <div className="h-8 bg-[#EBE6DC] rounded-xs w-1/4" />
              </Card>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card padding="lg" className="text-center py-12 space-y-3 bg-[#F8F6F1]">
            <Compass className="w-12 h-12 text-[#D97845]/60 mx-auto" />
            <h3 className="text-base font-bold text-[#152A20] font-headline">Không tìm thấy chuyến đi nào</h3>
            <p className="text-xs text-[#5C665F] max-w-md mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Không có vé nào phù hợp với bộ lọc hiện tại. Thử xóa tìm kiếm hoặc chuyển sang tab khác.'
                : 'Bạn chưa đăng ký chuyến đi dã ngoại nào. Hãy khám phá ngay các cung đường leo núi & cắm trại kỳ thú!'}
            </p>
            <div className="pt-2">
              <Link to="/tours">
                <Button variant="accent" size="sm" icon={<Footprints className="w-3.5 h-3.5" />}>
                  Khám phá danh sách Tours
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          filteredTickets.map((ticket) => {
            const schedule = schedulesMap.get(ticket.scheduleId);
            const event = schedule ? eventsMap.get(schedule.eventId) : null;
            const branchName = schedule ? branchesMap.get(schedule.branchId) || `Trạm Outpost #${schedule.branchId}` : 'Trạm Outpost';
            const coverImg = event?.coverImageUrl || fallbackImages[ticket.id % fallbackImages.length];

            // Remaining seconds for PENDING tickets
            const remainingSec = ticket.expiresAt ? Math.max(0, Math.ceil((Date.parse(ticket.expiresAt) - now) / 1000)) : 0;
            const remainingMin = Math.floor(remainingSec / 60);
            const remainingSecRemainder = remainingSec % 60;
            const canPayNow = ticket.participantStatus === 'PENDING' && remainingSec >= 300;

            return (
              <Card
                key={ticket.id}
                padding="none"
                className="overflow-hidden hover:border-[#152A20] transition-all duration-200 hover:shadow-lg bg-[#F8F6F1]"
              >
                {/* Urgent Payment Banner for Pending Tickets */}
                {ticket.participantStatus === 'PENDING' && (
                  <div className="bg-[#FFF7ED] border-b border-[#FDBA74] px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[#C2410C] font-bold">
                      <Clock className="w-4 h-4 text-[#EA580C] shrink-0 animate-pulse" />
                      <span>
                        {remainingSec > 0
                          ? `Thời hạn giữ chỗ: Còn ${remainingMin} phút ${remainingSecRemainder} giây để thanh toán (Hạn chót: ${formatVnDateTime(
                              ticket.expiresAt
                            )})`
                          : 'Hạn giữ chỗ đã kết thúc. Đang chờ hệ thống cập nhật giải phóng vé.'}
                      </span>
                    </div>

                    {canPayNow && (
                      <Link to={`/payment/pending?participantId=${ticket.id}`}>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D97845] hover:bg-[#B85D2E] text-white font-bold text-xs rounded-xs shadow-xs transition cursor-pointer">
                          <CreditCard className="w-3.5 h-3.5" /> Thanh toán ngay
                        </span>
                      </Link>
                    )}
                  </div>
                )}

                <div className="p-4 sm:p-6 space-y-5">
                  {/* Top Bar: IDs, Status Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8D2C5]/70">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-[#152A20] font-headline">
                        VÉ TOUR #{ticket.id}
                      </span>
                      <span className="text-xs text-[#737C75]">·</span>
                      <span className="text-xs text-[#5C665F] font-bold">
                        Đợt khởi hành #{ticket.scheduleId}
                      </span>
                      {ticket.registrationReference && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ticket.registrationReference);
                            showToast(`Đã sao chép mã ${ticket.registrationReference}!`);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#EBE6DC] text-[#152A20] text-[11px] font-bold hover:bg-[#D8D2C5] transition cursor-pointer"
                          title="Bấm để sao chép mã tham chiếu"
                        >
                          <code>{ticket.registrationReference}</code>
                          <Copy className="w-3 h-3 text-[#737C75]" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {renderParticipantStatusBadge(ticket.participantStatus)}
                      {renderCheckInBadge(ticket.checkInStatus)}
                    </div>
                  </div>

                  {/* Tour Details: Image + Expedition Info */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Event Cover Image */}
                    <div className="md:col-span-4 relative rounded-xs overflow-hidden h-40 md:h-44 bg-[#EBE6DC] shadow-xs group">
                      <img
                        src={coverImg}
                        alt={event?.eventName || 'Tour dã ngoại'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Event Type & Difficulty Tags */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                        {event?.eventType && (
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#152A20]/90 text-white uppercase tracking-wider backdrop-blur-xs">
                            {event.eventType}
                          </span>
                        )}
                        {event?.difficultyLevel && (
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#D97845]/90 text-white uppercase tracking-wider backdrop-blur-xs">
                            {event.difficultyLevel}
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <span className="text-[10px] opacity-80 uppercase tracking-wider block">Trạm xuất phát:</span>
                        <span className="text-xs font-bold truncate block">{branchName}</span>
                      </div>
                    </div>

                    {/* Information Grid */}
                    <div className="md:col-span-8 space-y-3">
                      <div>
                        <Link
                          to={`/my-tours/${ticket.id}`}
                          className="text-lg sm:text-xl font-bold text-[#152A20] font-headline hover:text-[#D97845] transition-colors line-clamp-1"
                        >
                          {event?.eventName || `Chuyến đi dã ngoại #${ticket.scheduleId}`}
                        </Link>
                        {event?.location && (
                          <div className="flex items-center gap-1.5 text-xs text-[#5C665F] mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#D97845] shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Schedule details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                        <div className="p-2.5 rounded-xs bg-[#F3EFE6] border border-[#D8D2C5]/60 flex items-start gap-2">
                          <CalendarDays className="w-4 h-4 text-[#152A20] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-[#737C75] font-bold uppercase block">Lịch xuất phát:</span>
                            <span className="font-bold text-[#111D16]">
                              {schedule ? formatVnDateTime(schedule.startDatetime) : 'Đang cập nhật'}
                            </span>
                            {schedule && (
                              <span className="text-[10px] text-[#5C665F] block">
                                Đến: {formatVnDateTime(schedule.endDatetime)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xs bg-[#F3EFE6] border border-[#D8D2C5]/60 flex items-start gap-2">
                          <Building className="w-4 h-4 text-[#D97845] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-[#737C75] font-bold uppercase block">Điểm hẹn & Trạm Outpost:</span>
                            <span className="font-bold text-[#111D16] truncate block">{branchName}</span>
                            <span className="text-[10px] text-[#5C665F] block">
                              Ngày đăng ký: {formatVnDateTime(ticket.registrationDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price & Summary */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#D8D2C5]/50">
                        <div className="text-xs">
                          <span className="text-[10px] text-[#737C75] font-bold uppercase block">Giá vé tham gia:</span>
                          <span className="text-base sm:text-lg font-bold text-[#152A20] font-headline">
                            {vnd(ticket.registeredPrice)}
                          </span>
                        </div>

                        <div className="text-xs text-right">
                          <span className="text-[10px] text-[#737C75] font-bold uppercase block">Số khách:</span>
                          <span className="font-bold text-[#111D16]">1 Thành viên (Theo tài khoản)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Stepper */}
                  <div className="pt-2 pb-1 border-t border-[#D8D2C5]/60">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      {[
                        { key: 'REGISTERED', label: 'Đặt chỗ', done: true },
                        {
                          key: 'CONFIRMED',
                          label: 'Thanh toán',
                          done: ticket.participantStatus === 'CONFIRMED' || ticket.participantStatus === 'COMPLETED',
                        },
                        {
                          key: 'CHECKED_IN',
                          label: 'Check-in tại trạm',
                          done: ticket.checkInStatus === 'CHECKED_IN' || ticket.participantStatus === 'COMPLETED',
                        },
                        {
                          key: 'COMPLETED',
                          label: 'Hoàn thành',
                          done: ticket.participantStatus === 'COMPLETED',
                        },
                      ].map((st, idx, arr) => (
                        <React.Fragment key={st.key}>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                                st.done
                                  ? 'bg-[#152A20] text-emerald-400 font-bold'
                                  : 'bg-[#EBE6DC] text-[#737C75] border border-[#D8D2C5]'
                              }`}
                            >
                              {st.done ? <Check className="w-3 h-3" /> : idx + 1}
                            </span>
                            <span className={`hidden sm:inline ${st.done ? 'text-[#152A20]' : 'text-[#737C75]'}`}>
                              {st.label}
                            </span>
                          </div>
                          {idx < arr.length - 1 && (
                            <div
                              className={`flex-1 mx-2 h-0.5 rounded-full transition-colors ${
                                arr[idx + 1].done ? 'bg-[#152A20]' : 'bg-[#D8D2C5]'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D8D2C5]/60">
                    <div className="flex items-center gap-2">
                      <Link to={`/my-tours/${ticket.id}`}>
                        <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                          Chi tiết vé & Lịch trình
                        </Button>
                      </Link>

                      {schedule && (
                        <Link to={`/tours/${schedule.eventId}?schedule=${schedule.id}`}>
                          <Button variant="outlined" size="sm" icon={<ExternalLink className="w-3.5 h-3.5 text-[#5C665F]" />}>
                            Xem Tour
                          </Button>
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ticket.participantStatus === 'PENDING' && canPayNow && (
                        <Link to={`/payment/pending?participantId=${ticket.id}`}>
                          <Button variant="accent" size="sm" icon={<CreditCard className="w-3.5 h-3.5" />}>
                            Thanh toán ngay
                          </Button>
                        </Link>
                      )}

                      {ticket.participantStatus === 'PENDING' && !canPayNow && remainingSec > 0 && (
                        <span className="text-xs text-[#C2410C] font-bold px-2 py-1 bg-[#FFF7ED] rounded-xs border border-[#FDBA74]">
                          Cần ít nhất 5 phút để thanh toán
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination / Load More */}
      {list.more && !list.loading && (
        <div className="text-center pt-4">
          <Button
            variant="secondary"
            onClick={() => list.loadMore()}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Tải thêm vé tour
          </Button>
        </div>
      )}
    </main>
  );
}

// ==========================================
// TICKET DETAIL PAGE (INDIVIDUAL TICKET)
// ==========================================
export function TicketDetailPage() {
  const id = validId(useParams().participantId);

  if (!id) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 font-label text-center">
        <Card padding="lg" className="space-y-4 bg-[#F8F6F1]">
          <AlertCircle className="w-12 h-12 text-[#991B1B] mx-auto" />
          <h1 className="text-2xl font-bold font-headline text-[#152A20]">Mã vé không hợp lệ</h1>
          <p className="text-sm text-[#5C665F]">Không tìm thấy thông tin vé hoặc mã vé không đúng định dạng.</p>
          <Link to="/my-tours">
            <Button variant="secondary">Quay lại danh sách Tour</Button>
          </Link>
        </Card>
      </main>
    );
  }

  return <TicketDetail key={id} id={id} />;
}

function TicketDetail({ id }: { id: number }) {
  const resource = useResource(useCallback(() => participantApi.get(id), [id]));
  const ticket = resource.data;
  const now = useClock(1000);
  const refresh = resource.refresh;

  useEffect(() => {
    if (ticket?.participantStatus !== 'PENDING') return;
    const poll = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = window.setInterval(poll, 30000);
    window.addEventListener('focus', poll);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', poll);
    };
  }, [ticket?.participantStatus, refresh]);

  const expiredAttempt = useRef('');
  useEffect(() => {
    if (
      ticket?.participantStatus === 'PENDING' &&
      ticket.expiresAt &&
      now >= Date.parse(ticket.expiresAt) &&
      expiredAttempt.current !== ticket.registrationReference
    ) {
      expiredAttempt.current = ticket.registrationReference;
      refresh();
    }
  }, [ticket, now, refresh]);

  if (resource.loading && !ticket) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16 font-label">
        <div className="flex flex-col items-center justify-center space-y-3 py-20">
          <RefreshCw className="w-8 h-8 text-[#D97845] animate-spin" />
          <p className="text-sm font-bold text-[#5C665F]">Đang tải thông tin vé tour #{id}...</p>
        </div>
      </main>
    );
  }

  if (resource.error && !ticket) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 font-label text-center">
        <Card padding="lg" className="space-y-4 bg-[#F8F6F1]">
          <AlertCircle className="w-12 h-12 text-[#991B1B] mx-auto" />
          <h1 className="text-2xl font-bold font-headline text-[#152A20]">Không thể tải thông tin vé</h1>
          <p className="text-sm text-[#5C665F]">{resource.error}</p>
          <div className="flex justify-center gap-3">
            <Link to="/my-tours">
              <Button variant="secondary">← Danh sách Tour</Button>
            </Link>
            <Button variant="accent" onClick={refresh}>
              Thử lại
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label animate-fade-in">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D8D2C5]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#5C665F]">
          <Link to="/my-tours" className="hover:text-[#D97845] transition">
            Tour Của Tôi
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#111D16]">Vé Tour #{id}</span>
        </div>

        <Link to="/my-tours">
          <Button variant="outlined" size="sm" icon={<ArrowRight className="w-3.5 h-3.5 rotate-180" />}>
            Quay lại danh sách
          </Button>
        </Link>
      </div>

      {ticket && <TicketContent ticket={ticket} refresh={refresh} now={now} />}
    </main>
  );
}

function TicketContent({
  ticket: p,
  refresh,
  now,
}: {
  ticket: Participant;
  refresh: () => void;
  now: number;
}) {
  const schedule = useResource(useCallback(() => scheduleApi.get(p.scheduleId), [p]));
  const histories = usePages(
    useCallback((page: number) => participantApi.histories(p.id, page), [p.id, p.participantStatus, p.registrationReference])
  );
  const s = schedule.data;
  const event = useResource(useCallback(async () => (s ? eventGuideApi.getEvent(s.eventId) : null), [s?.eventId]));
  const branches = useResource(useCallback(() => scheduleApi.branches(), []));
  const guide = useResource(
    useCallback(async () => (s?.guideId ? eventGuideApi.getGuide(s.guideId) : null), [s?.guideId])
  );

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const navigate = useNavigate();

  // Toast
  const [toastText, setToastText] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => setToastText(null), 3000);
  };

  async function cancel(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await participantApi.cancel(p.id, reason);
      setCancelOpen(false);
      refresh();
      showToast('Đã hủy đăng ký vé tour thành công.');
    } catch (e) {
      setError(`${errorMessage(e)} Vui lòng kiểm tra lại trạng thái vé.`);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const remaining = Math.max(0, Math.ceil((Date.parse(p.expiresAt || '') - now) / 1000));
  const remainingMin = Math.floor(remaining / 60);
  const remainingSec = remaining % 60;
  const branchName = s ? branches.data?.find((b) => b.id === s.branchId)?.name || `Trạm Outpost #${s.branchId}` : 'Trạm Outpost';
  const branchAddress = s ? branches.data?.find((b) => b.id === s.branchId)?.address : '';
  const coverImg = event.data?.coverImageUrl || fallbackImages[p.id % fallbackImages.length];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastText && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xs shadow-xl bg-[#152A20] text-[#F3EFE6] border border-[#2B4E3C] flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Main Ticket Banner */}
      <Card padding="none" className="overflow-hidden bg-[#F8F6F1]">
        {/* Urgent Pending Banner */}
        {p.participantStatus === 'PENDING' && (
          <div className="p-4 bg-[#FFF7ED] border-b border-[#FDBA74] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#C2410C] font-bold">
              <Clock className="w-5 h-5 text-[#EA580C] shrink-0 animate-pulse" />
              <div>
                <span className="block">
                  {remaining > 0
                    ? `Thời hạn giữ chỗ: Còn ${remainingMin} phút ${remainingSec} giây để thanh toán vé tour`
                    : 'Đã hết thời gian giữ chỗ vé tour này.'}
                </span>
                <span className="text-[11px] font-normal text-[#9A3412]">
                  Hạn chót: {formatVnDateTime(p.expiresAt)} (Sau thời hạn này, vé sẽ bị hủy tự động để thành viên khác đăng ký)
                </span>
              </div>
            </div>

            {remaining >= 300 && (
              <Link to={`/payment/pending?participantId=${p.id}`}>
                <Button variant="accent" size="sm" icon={<CreditCard className="w-3.5 h-3.5" />}>
                  Thanh toán vé tour ngay
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Hero Section */}
        <div className="relative h-48 sm:h-64 overflow-hidden bg-[#152A20]">
          <img src={coverImg} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#152A20] via-black/40 to-transparent" />

          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#D97845] text-white uppercase tracking-wider">
                VÉ EXPEDITION
              </span>
              {event.data?.eventType && (
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  {event.data.eventType}
                </span>
              )}
              {event.data?.details?.difficultyLevel && (
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  ĐỘ KHÓ: {event.data.details.difficultyLevel}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-bold font-headline leading-tight text-[#F3EFE6]">
              {event.data?.eventName || `Chuyến đi dã ngoại #${p.scheduleId}`}
            </h1>

            {event.data?.location && (
              <div className="flex items-center gap-1.5 text-xs text-[#EBE6DC] opacity-90">
                <MapPin className="w-3.5 h-3.5 text-[#D97845]" />
                <span>{event.data.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Header Badges Bar */}
        <div className="p-4 sm:p-6 border-b border-[#D8D2C5] flex flex-wrap items-center justify-between gap-3 bg-[#F3EFE6]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#152A20]">Mã vé: #{p.id}</span>
            <span className="text-xs text-[#737C75]">·</span>
            <span className="text-xs text-[#5C665F]">
              Mã tham chiếu:{' '}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(p.registrationReference);
                  showToast(`Đã sao chép mã tham chiếu!`);
                }}
                className="font-bold underline hover:text-[#D97845] transition cursor-pointer"
              >
                <code>{p.registrationReference}</code>
              </button>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {renderParticipantStatusBadge(p.participantStatus)}
            {renderCheckInBadge(p.checkInStatus)}
          </div>
        </div>

        {/* Stepper */}
        <div className="p-4 sm:p-6 border-b border-[#D8D2C5]/70 bg-[#F8F6F1]">
          <div className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider mb-2">TIẾN TRÌNH THAM GIA HÀNH TRÌNH</div>
          <div className="flex items-center justify-between text-xs font-bold">
            {[
              { label: 'Đã đặt giữ chỗ', done: true },
              {
                label: 'Thanh toán xác nhận',
                done: p.participantStatus === 'CONFIRMED' || p.participantStatus === 'COMPLETED',
              },
              {
                label: 'Check-in tại trạm',
                done: p.checkInStatus === 'CHECKED_IN' || p.participantStatus === 'COMPLETED',
              },
              {
                label: 'Hoàn thành hành trình',
                done: p.participantStatus === 'COMPLETED',
              },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      step.done
                        ? 'bg-[#152A20] text-emerald-400 font-bold'
                        : 'bg-[#EBE6DC] text-[#737C75] border border-[#D8D2C5]'
                    }`}
                  >
                    {step.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </span>
                  <span className={`hidden sm:inline ${step.done ? 'text-[#152A20]' : 'text-[#737C75]'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={`flex-1 mx-2 h-0.5 rounded-full ${
                      arr[idx + 1].done ? 'bg-[#152A20]' : 'bg-[#D8D2C5]'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6">
          {/* Left Column: Logistics Manifest */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-[#152A20] font-headline uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D97845]" /> Thông tin xuất phát & Hành trình
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs space-y-1">
                  <span className="text-[10px] text-[#737C75] font-bold uppercase block">Lịch trình khởi hành:</span>
                  <div className="font-bold text-[#111D16] text-sm">
                    {s ? formatVnDateTime(s.startDatetime) : 'Đang cập nhật'}
                  </div>
                  {s && (
                    <div className="text-[#5C665F]">
                      Kết thúc: <span className="font-semibold text-[#111D16]">{formatVnDateTime(s.endDatetime)}</span>
                    </div>
                  )}
                  {s && (
                    <div className="text-[10px] text-[#737C75] pt-0.5">
                      Hạn chót mở đăng ký đợt: {formatVnDateTime(s.registrationClosesAt)}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs space-y-1">
                  <span className="text-[10px] text-[#737C75] font-bold uppercase block">Trạm Outpost tiếp nhận:</span>
                  <div className="font-bold text-[#111D16] text-sm flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-[#152A20]" />
                    <span>{branchName}</span>
                  </div>
                  {branchAddress && <div className="text-[#5C665F]">{branchAddress}</div>}
                  {event.data?.details?.meetingPoint && (
                    <div className="text-[#152A20] font-medium pt-1">
                      Điểm tập trung cụ thể:{' '}
                      <span className="font-bold">{event.data.details.meetingPoint}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs space-y-1">
                  <span className="text-[10px] text-[#737C75] font-bold uppercase block">Hướng dẫn viên dã ngoại:</span>
                  <div className="font-bold text-[#111D16] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#059669]" />
                    <span>{guide.data?.displayName || (s?.guideId ? `HDV #${s.guideId}` : 'Đang bố trí điều phối viên')}</span>
                  </div>
                  {guide.data?.specialization && (
                    <div className="text-[11px] text-[#5C665F]">
                      Chuyên môn: {guide.data.specialization} · Kinh nghiệm: {guide.data.experienceYears} năm
                    </div>
                  )}
                </div>

                {p.note && (
                  <div className="p-3 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs space-y-1">
                    <span className="text-[10px] text-[#737C75] font-bold uppercase block">Ghi chú từ khách hàng:</span>
                    <p className="text-xs text-[#111D16] italic font-body">{p.note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Safety & Guidelines Info */}
            <div className="p-3.5 bg-[#152A20]/5 border border-[#152A20]/20 rounded-xs space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#152A20]">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
                <span>Quy chuẩn an toàn dã ngoại TerraPeak</span>
              </div>
              <p className="text-[#5C665F] text-[11px] leading-relaxed">
                Quý khách vui lòng có mặt tại điểm hẹn ít nhất 15 phút trước giờ khởi hành để làm thủ tục điểm danh (Check-in) và nhận trang bị an toàn nếu có thuê tại trạm.
              </p>
            </div>
          </div>

          {/* Right Column: Pricing, Payment, & Cancellation Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs space-y-3.5">
              <h2 className="text-xs font-bold text-[#152A20] font-headline uppercase tracking-wider">
                Hóa đơn & Thanh toán
              </h2>

              <div className="space-y-2 text-xs border-b border-[#D8D2C5] pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#5C665F]">Mã đặt vé:</span>
                  <span className="font-bold text-[#111D16]">#{p.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C665F]">Thời gian đăng ký:</span>
                  <span className="font-bold text-[#111D16]">{formatVnDateTime(p.registrationDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C665F]">Số lượng khách:</span>
                  <span className="font-bold text-[#111D16]">01 Khách</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C665F]">Trạng thái thanh toán:</span>
                  <span className="font-bold">{renderParticipantStatusBadge(p.participantStatus)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold text-[#152A20] uppercase">TỔNG TIỀN VÉ</span>
                <span className="text-xl font-bold text-[#152A20] font-headline">{vnd(p.registeredPrice)}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {p.participantStatus === 'PENDING' && (
                  <div className="space-y-2">
                    {remaining >= 300 ? (
                      <Link to={`/payment/pending?participantId=${p.id}`} className="block">
                        <Button variant="accent" className="w-full" icon={<CreditCard className="w-4 h-4" />}>
                          Thanh toán trực tuyến ngay
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="accent" className="w-full" disabled>
                        {remaining <= 0 ? 'Đã hết hạn giữ chỗ' : 'Sắp hết hạn giữ chỗ'}
                      </Button>
                    )}

                    <Link to={`/payment/result?participantId=${p.id}`} className="block">
                      <Button variant="secondary" className="w-full" icon={<RefreshCw className="w-3.5 h-3.5" />}>
                        Kiểm tra kết quả thanh toán
                      </Button>
                    </Link>
                  </div>
                )}

                <Button
                  variant="outlined"
                  className="w-full text-xs"
                  onClick={() => window.print()}
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  In phiếu xác nhận / Lưu PDF
                </Button>

                {s && cancellable(p, s, now) && (
                  <Button
                    variant="danger"
                    className="w-full text-xs"
                    onClick={() => setCancelOpen(true)}
                    icon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Hủy đăng ký vé tour
                  </Button>
                )}

                {['CANCELLED', 'EXPIRED'].includes(p.participantStatus) && <div className="space-y-2"><Link to={`/refunds?participantId=${p.id}`} className="block"><Button variant="secondary" className="w-full">Yêu cầu hoàn tiền</Button></Link><Link to="/refunds" className="text-xs underline">Yêu cầu hoàn tiền của tôi</Link></div>}
                {['CANCELLED', 'EXPIRED'].includes(p.participantStatus) && s && bookable(s, now) && (
                  <Button
                    variant="accent"
                    className="w-full text-xs"
                    onClick={() => navigate(`/tours/${s.eventId}?schedule=${s.id}`)}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Đăng ký lại chuyến đi này
                  </Button>
                )}
              </div>
            </div>

            {/* Inactive Notice */}
            {['CANCELLED', 'EXPIRED'].includes(p.participantStatus) && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xs text-xs text-[#991B1B] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Vé này đã hủy hoặc hết hạn
                </div>
                <p className="text-[11px] leading-relaxed">
                  Chỗ ngồi đã được giải phóng. Nếu bạn đã chuyển khoản hoặc có thắc mắc về hoàn tiền, vui lòng liên hệ chi nhánh phụ trách.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Ticket History / Audit Log */}
      <Card padding="md" className="space-y-4 bg-[#F8F6F1]">
        <h2 className="text-sm font-bold text-[#152A20] font-headline uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4 text-[#D97845]" /> Nhật ký vé & Thay đổi trạng thái
        </h2>

        {histories.items.length === 0 ? (
          <p className="text-xs text-[#5C665F]">Chưa có lịch sử thay đổi trạng thái nào cho vé này.</p>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D8D2C5]">
            {histories.items.map((h) => (
              <div key={h.id} className="relative text-xs space-y-1">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#D97845] border-2 border-white" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#111D16]">
                    {(h.action && auditLabels[h.action]) || h.action || 'Cập nhật vé'}
                  </span>
                  <span className="text-[11px] text-[#737C75]">· {formatVnDateTime(h.changedAt)}</span>
                </div>

                {h.oldStatus && (
                  <div className="text-[11px] text-[#5C665F]">
                    Trạng thái: <code>{labels[h.oldStatus] || h.oldStatus}</code> →{' '}
                    <strong className="text-[#152A20]">{labels[h.newStatus] || h.newStatus}</strong>
                  </div>
                )}

                {(h.reason || h.changeReason) && (
                  <div className="text-[11px] text-[#111D16] italic bg-[#EBE6DC]/60 p-2 rounded-xs border border-[#D8D2C5]/50">
                    Lý do: {h.reason || h.changeReason}
                  </div>
                )}

                <div className="text-[10px] text-[#737C75]">
                  Thực hiện bởi: {h.changedBy ? `Tài khoản #${h.changedBy}` : 'Hệ thống tự động'}
                </div>
              </div>
            ))}
          </div>
        )}

        {histories.more && !histories.loading && (
          <Button variant="outlined" size="sm" onClick={() => histories.loadMore()} className="text-xs">
            Xem thêm lịch sử
          </Button>
        )}
      </Card>

      {/* Cancellation Confirmation Modal */}
      {cancelOpen && (
        <Modal
          isOpen={cancelOpen}
          onClose={() => !busy && setCancelOpen(false)}
          title="Xác nhận hủy đăng ký vé tour"
          maxWidth="md"
        >
          <form onSubmit={cancel} className="space-y-4 font-label">
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xs text-xs text-[#991B1B] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                Lưu ý quan trọng khi hủy vé:
              </div>
              <p className="text-[11px] leading-relaxed">
                Chỗ của bạn tại đợt khởi hành này sẽ được giải phóng ngay lập tức. Đối với vé đã xác nhận thanh toán, thủ tục đối soát và hoàn tiền sẽ tuân theo chính sách hoàn vé của trạm.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cancel-tour-reason" className="text-xs font-bold text-[#111D16] block">
                Lý do hủy vé (tùy chọn):
              </label>
              <textarea
                id="cancel-tour-reason"
                maxLength={2000}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Bận việc đột xuất, đổi lịch trình cá nhân..."
                className="w-full p-2.5 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xs text-xs text-[#DC2626]">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8D2C5]">
              <Button
                type="button"
                variant="outlined"
                disabled={busy}
                onClick={() => setCancelOpen(false)}
              >
                Đóng
              </Button>
              <Button
                type="submit"
                variant="accent"
                disabled={busy}
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white border-none"
              >
                {busy ? 'Đang xử lý hủy...' : 'Xác nhận hủy vé'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
