export type ReportTab = 'overview' | 'products' | 'tours';
export type Filters = { from: string; to: string; period: 'DAY' | 'MONTH'; branchId: string; sector: string; paymentMethod: string; productId: string; tourId: string; scheduleId: string };
export type Money = { receivedAmount: number; refundedAmount: number; netAmount: number };
export type Point = Money & { date: string };
export type Breakdown = Money & { id: number; name: string; paymentCount: number; refundCount: number };
export type Overview = { totals: Money & { paymentCount: number; refundCount: number }; pendingRefundAmount: number; pendingRefundCount: number; undatedSucceededCount: number; undatedReceivedAmount: number; undatedRefundedAmount: number; series: Point[]; branches: Breakdown[]; sectors: Breakdown[] };
export type ProductRow = { productId: number; productName: string; saleQuantity: number; rentalQuantity: number; rentalDays: number; paidOrderCount: number; saleValue: number; rentalValue: number; totalValue: number };
export type ProductPoint = Pick<ProductRow, 'productId' | 'productName' | 'saleValue' | 'rentalValue' | 'totalValue'> & { date: string };
export type ProductsReport = { metric: string; timeBasis: string; products: ProductRow[]; series: ProductPoint[] };
export type TourRow = Money & { tourId: number; tourName: string; paidTicketCount: number };
export type TourPoint = TourRow & { date: string };
export type TourSchedule = TourRow & { scheduleId: number; startDatetime: string; branchId: number; branchName: string };
export type ToursReport = { tours: TourRow[]; series: TourPoint[]; schedules: TourSchedule[] };
export type TransactionRow = { transactionId: number; orderId: number | null; participantId: number | null; branchId: number; branchName: string; tourName: string | null; transactionType: string; paymentMethod: string; amount: number; createdAt: string; succeededAt: string };
export type TransactionPage = { content: TransactionRow[]; page: number; size: number; totalElements: number; totalPages: number };

export function reportQuery(filters: Filters, tab: ReportTab) {
  const params = new URLSearchParams({ from: filters.from, to: filters.to, period: filters.period });
  if (filters.branchId) params.set('branchId', filters.branchId);
  if (tab === 'products') { if (filters.productId) params.set('productId', filters.productId); }
  else {
    if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
    if (tab === 'overview' && filters.sector) params.set('sector', filters.sector);
    if (tab === 'tours') {
      params.set('sector', 'TOUR');
      if (filters.tourId) params.set('tourId', filters.tourId);
      if (filters.scheduleId) params.set('scheduleId', filters.scheduleId);
    }
  }
  return params;
}
export function validateFilters(f: Filters) {
  if (!f.from || !f.to) return 'Vui lòng chọn từ ngày và đến ngày.';
  const days = (Date.parse(f.to) - Date.parse(f.from)) / 86400000;
  if (!Number.isFinite(days) || days < 0 || days > 365) return 'Khoảng ngày phải hợp lệ và không quá 366 ngày.';
  for (const key of ['branchId', 'productId', 'tourId', 'scheduleId'] as const) {
    if (f[key] && (!/^\d+$/.test(f[key]) || !Number.isSafeInteger(Number(f[key])) || Number(f[key]) <= 0)) return 'ID bộ lọc phải là số nguyên dương.';
  }
  return '';
}
async function response(path: string, signal?: AbortSignal) {
  const token = sessionStorage.getItem('treektour.catalog.token');
  if (!token) throw new Error('Vui lòng đăng nhập tài khoản ADMIN để xem báo cáo.');
  const result = await fetch('/api/reports/revenue' + path, { headers: { Authorization: `Bearer ${token}` }, signal, redirect: 'error' });
  if (!result.ok) {
    const body = await result.json().catch(() => null);
    throw new Error(result.status === 401 || result.status === 403 ? 'Phiên đăng nhập không hợp lệ hoặc bạn không có quyền ADMIN.' : body?.message || `Không tải được báo cáo (${result.status}).`);
  }
  return result;
}
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const result = await response(path, signal);
  const envelope = await result.json();
  if (envelope.data == null) throw new Error('Backend không trả dữ liệu báo cáo.');
  return envelope.data;
}
export const reportApi = {
  overview: (f: Filters, signal?: AbortSignal) => get<Overview>('?' + reportQuery(f, 'overview'), signal),
  products: (f: Filters, signal?: AbortSignal) => get<ProductsReport>('/products?' + reportQuery(f, 'products'), signal),
  tours: (f: Filters, signal?: AbortSignal) => get<ToursReport>('/tours?' + reportQuery(f, 'tours'), signal),
  transactions: (f: Filters, tab: ReportTab, page: number, signal?: AbortSignal) => get<TransactionPage>('/transactions?' + reportQuery(f, tab) + `&page=${page}&size=20`, signal),
  export: async (f: Filters, tab: ReportTab) => {
    const result = await response('/export?' + reportQuery(f, tab));
    const url = URL.createObjectURL(await result.blob());
    const link = document.createElement('a'); link.href = url; link.download = `transactions-${f.from}-${f.to}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export function reportDates(f: Pick<Filters, 'from' | 'to' | 'period'>) {
  const dates: string[] = [];
  let day = new Date(f.from + 'T00:00:00Z');
  const end = new Date(f.to + 'T00:00:00Z');
  if (f.period === 'MONTH') day.setUTCDate(1);
  while (day <= end && dates.length < 367) {
    dates.push(day.toISOString().slice(0, 10));
    if (f.period === 'MONTH') day.setUTCMonth(day.getUTCMonth() + 1);
    else day.setUTCDate(day.getUTCDate() + 1);
  }
  return dates;
}
