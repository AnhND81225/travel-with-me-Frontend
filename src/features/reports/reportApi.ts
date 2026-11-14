export type ReportTab = "overview" | "products" | "tours";
export type Filters = {
  from: string;
  to: string;
  period: "DAY" | "MONTH" | "YEAR";
  branchId: string;
  sector: string;
  productId: string;
  tourId: string;
};
export type Money = {
  receivedAmount: number;
  refundedAmount: number;
  netAmount: number;
};
export type Point = Money & { date: string };
export type Breakdown = Money & {
  id: number;
  name: string;
  paymentCount: number;
  refundCount: number;
};
export type Overview = {
  totals: Money & { paymentCount: number; refundCount: number };
  pendingRefundAmount: number;
  pendingRefundCount: number;
  undatedSucceededCount: number;
  undatedReceivedAmount: number;
  undatedRefundedAmount: number;
  series: Point[];
  branches: Breakdown[];
  sectors: Breakdown[];
};
export type ProductRow = {
  productId: number;
  productName: string;
  saleQuantity: number;
  rentalQuantity: number;
  rentalDays: number;
  paidOrderCount: number;
  saleValue: number;
  rentalValue: number;
  totalValue: number;
};
export type ProductPoint = Pick<
  ProductRow,
  "productId" | "productName" | "saleValue" | "rentalValue" | "totalValue"
> & { date: string };
export type ProductsReport = {
  metric: string;
  timeBasis: string;
  products: ProductRow[];
  series: ProductPoint[];
};
export type TourRow = Money & {
  tourId: number;
  tourName: string;
  paidTicketCount: number;
};
export type TourPoint = TourRow & { date: string };
export type TourSchedule = TourRow & {
  scheduleId: number;
  startDatetime: string;
  branchId: number;
  branchName: string;
};
export type ToursReport = {
  tours: TourRow[];
  series: TourPoint[];
  schedules: TourSchedule[];
};
export type TransactionRow = {
  transactionId: number;
  orderId: number | null;
  participantId: number | null;
  branchId: number;
  branchName: string;
  tourName: string | null;
  transactionType: string;
  paymentMethod: string;
  amount: number;
  createdAt: string;
  succeededAt: string;
};
export type TransactionPage = {
  content: TransactionRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export function reportQuery(filters: Filters, tab: ReportTab) {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    period: filters.period,
  });
  if (filters.branchId) params.set("branchId", filters.branchId);
  if (tab === "products") {
    if (filters.productId) params.set("productId", filters.productId);
  } else {
    if (tab === "overview" && filters.sector)
      params.set("sector", filters.sector);
    if (tab === "tours") {
      params.set("sector", "TOUR");
      if (filters.tourId) params.set("tourId", filters.tourId);
    }
  }
  return params;
}
export function validateFilters(f: Filters) {
  if (!f.from || !f.to) return "Please select a start and end date.";
  const start = new Date(f.from + "T00:00:00Z"),
    end = new Date(f.to + "T00:00:00Z");
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end < start
  )
    return "Select a valid reporting range.";
  const lastDay = new Date(start);
  if (f.period === "DAY") lastDay.setUTCDate(lastDay.getUTCDate() + 365);
  else if (f.period === "MONTH") {
    lastDay.setUTCMonth(lastDay.getUTCMonth() + 60);
    lastDay.setUTCDate(lastDay.getUTCDate() - 1);
  } else {
    lastDay.setUTCFullYear(lastDay.getUTCFullYear() + 10);
    lastDay.setUTCDate(lastDay.getUTCDate() - 1);
  }
  if (end > lastDay)
    return f.period === "DAY"
      ? "Daily reports support up to 366 days."
      : f.period === "MONTH"
        ? "Monthly reports support up to 60 months."
        : "Yearly reports support up to 10 years.";
  for (const key of ["branchId", "productId", "tourId"] as const) {
    if (
      f[key] &&
      (!/^\d+$/.test(f[key]) ||
        !Number.isSafeInteger(Number(f[key])) ||
        Number(f[key]) <= 0)
    )
      return "Filter IDs must be positive integers.";
  }
  return "";
}
async function response(path: string, signal?: AbortSignal) {
  const token = sessionStorage.getItem("treektour.catalog.token");
  if (!token) throw new Error("Sign in with an ADMIN account to view reports.");
  const result = await fetch("/api/reports/revenue" + path, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
    redirect: "error",
  });
  if (!result.ok) {
    const body = await result.json().catch(() => null);
    throw new Error(
      result.status === 401 || result.status === 403
        ? "Your session is invalid or you do not have ADMIN access."
        : body?.message || `Unable to load report (${result.status}).`,
    );
  }
  return result;
}
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const result = await response(path, signal);
  const envelope = await result.json();
  if (envelope.data == null)
    throw new Error("The backend returned no report data.");
  return envelope.data;
}
export const reportApi = {
  overview: (f: Filters, signal?: AbortSignal) =>
    get<Overview>("?" + reportQuery(f, "overview"), signal),
  products: (f: Filters, signal?: AbortSignal) =>
    get<ProductsReport>("/products?" + reportQuery(f, "products"), signal),
  tours: (f: Filters, signal?: AbortSignal) =>
    get<ToursReport>("/tours?" + reportQuery(f, "tours"), signal),
  transactions: (
    f: Filters,
    tab: ReportTab,
    page: number,
    signal?: AbortSignal,
  ) =>
    get<TransactionPage>(
      "/transactions?" + reportQuery(f, tab) + `&page=${page}&size=20`,
      signal,
    ),
};

export function reportDates(f: Pick<Filters, "from" | "to" | "period">) {
  const dates: string[] = [];
  let day = new Date(f.from + "T00:00:00Z");
  const end = new Date(f.to + "T00:00:00Z");
  if (f.period === "MONTH") day.setUTCDate(1);
  if (f.period === "YEAR") {
    day.setUTCMonth(0, 1);
  }
  while (day <= end && dates.length < 367) {
    dates.push(day.toISOString().slice(0, 10));
    if (f.period === "YEAR") day.setUTCFullYear(day.getUTCFullYear() + 1);
    else if (f.period === "MONTH") day.setUTCMonth(day.getUTCMonth() + 1);
    else day.setUTCDate(day.getUTCDate() + 1);
  }
  return dates;
}

/** Convert month/year pickers to the existing inclusive API date boundaries. */
export function changeReportPeriod(
  f: Filters,
  period: Filters["period"],
): Filters {
  if (period === "DAY") return { ...f, period };
  const from =
    period === "MONTH"
      ? f.from.slice(0, 7) + "-01"
      : f.from.slice(0, 4) + "-01-01";
  const to =
    period === "MONTH"
      ? monthEnd(f.to.slice(0, 7))
      : f.to.slice(0, 4) + "-12-31";
  return { ...f, period, from, to };
}
export function monthEnd(month: string) {
  const [year, number] = month.split("-").map(Number);
  return (
    month +
    "-" +
    String(new Date(Date.UTC(year, number, 0)).getUTCDate()).padStart(2, "0")
  );
}
export function reportDateLabel(date: string, period: Filters["period"]) {
  return period === "YEAR"
    ? date.slice(0, 4)
    : period === "MONTH"
      ? date.slice(0, 7).split("-").reverse().join("/")
      : date.slice(5).split("-").reverse().join("/");
}
