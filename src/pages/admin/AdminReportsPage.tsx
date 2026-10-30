import { useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, ChevronLeft, ChevronRight, Download, Package, RefreshCw, Ticket, Wallet } from 'lucide-react';
import { catalogApi, type Branch, type Page, type Product } from '../../features/equipment/catalogApi';
import { eventGuideApi, type EventSummary } from '../../services/eventGuideApi';
import { reportApi, reportDates, validateFilters, type Filters, type Overview, type ProductsReport, type ToursReport, type ReportTab, type TransactionPage } from '../../features/reports/reportApi';
import { ReportChart, EntityTrend, BranchBars, SectorDonut, chartColors, money } from '../../features/reports/ReportCharts';
import '../../features/reports/reports.css';

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const initial: Filters = { from: today.slice(0, 7) + '-01', to: today, period: 'DAY', branchId: '', sector: '', paymentMethod: '', productId: '', tourId: '', scheduleId: '' };
const shortDate = (value: string, monthly = false) => monthly ? value.slice(0, 7).split('-').reverse().join('/') : value.slice(5).split('-').reverse().join('/');
const datetime = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="rp-panel"><div className="rp-panel-heading"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}</section>;
}
function Kpi({ title, value, detail, icon, tone = '' }: { title: string; value: number; detail?: string; icon: ReactNode; tone?: string }) {
  return <div className={`rp-kpi ${tone}`}><div><span>{title}</span>{icon}</div><strong>{money(value)}</strong><p>{detail}</p></div>;
}
function NoRows() { return <tr><td colSpan={10} className="rp-no-rows">Không có dữ liệu phù hợp với bộ lọc.</td></tr>; }
function Comparison({ rows, product = false }: { rows: { id: number; name: string; a: number; b: number; c: number }[]; product?: boolean }) {
  const [page, setPage] = useState(0);
  const safePage = Math.min(page, Math.max(0, Math.ceil(rows.length / 8) - 1));
  const slice = rows.slice(safePage * 8, safePage * 8 + 8);
  return <><ReportChart kind="bar" scaleValues={rows.flatMap(row => product ? [row.a, row.b] : [row.a, row.b, row.c])} labels={slice.map(row => row.name)} series={[
    { name: product ? 'Giá trị mua' : 'Tiền thu', color: chartColors[0], values: slice.map(row => row.a) },
    { name: product ? 'Giá trị thuê' : 'Tiền hoàn', color: chartColors[1], values: slice.map(row => row.b) },
    ...(!product ? [{ name: 'Thu ròng', color: chartColors[2], values: slice.map(row => row.c) }] : []),
  ]}/>{rows.length > 8 && <div className="rp-pagination"><span>Hiện {safePage * 8 + 1}–{Math.min(rows.length, safePage * 8 + 8)} / {rows.length}</span><div><button aria-label="Nhóm trước" disabled={!safePage} onClick={() => setPage(safePage - 1)}><ChevronLeft size={15}/></button><button aria-label="Nhóm sau" disabled={(safePage + 1) * 8 >= rows.length} onClick={() => setPage(safePage + 1)}><ChevronRight size={15}/></button></div></div>}</>;
}

export const AdminReportsPage = () => {
  const [tab, setTab] = useState<ReportTab>('overview');
  const [draft, setDraft] = useState<Filters>(initial), [filters, setFilters] = useState<Filters>(initial);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [products, setProducts] = useState<ProductsReport | null>(null);
  const [tours, setTours] = useState<ToursReport | null>(null);
  const [transactions, setTransactions] = useState<TransactionPage | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]), [catalog, setCatalog] = useState<Product[]>([]), [events, setEvents] = useState<EventSummary[]>([]);
  const [optionsError, setOptionsError] = useState('');
  const [page, setPage] = useState(0), [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true), [tableLoading, setTableLoading] = useState(false), [exporting, setExporting] = useState(false);
  const [error, setError] = useState(''), [tableError, setTableError] = useState(''), [actionError, setActionError] = useState('');
  useEffect(() => {
    let active = true;
    async function loadOptions() {
      const results = await Promise.allSettled([
        catalogApi<Branch[]>('/branches'),
        (async () => { const items: Product[] = []; for (let p = 0; ; p++) { const data = await catalogApi<Page<Product>>(`/admin/products?page=${p}&size=100`); items.push(...data.content); if (p + 1 >= data.totalPages) return items; } })(),
        (async () => { const items: EventSummary[] = []; for (let p = 0; ; p++) { const data = await eventGuideApi.listAdminEvents({ page: p, size: 100 }); items.push(...data.items); if (p + 1 >= data.totalPages) return items; } })(),
      ]);
      if (!active) return;
      if (results[0].status === 'fulfilled') setBranches(results[0].value);
      if (results[1].status === 'fulfilled') setCatalog(results[1].value);
      if (results[2].status === 'fulfilled') setEvents(results[2].value);
      if (results.some(result => result.status === 'rejected')) setOptionsError('Một số danh sách bộ lọc chưa tải được. Báo cáo vẫn có thể tải theo khoảng ngày.');
    }
    void loadOptions(); return () => { active = false; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setOverview(null); setProducts(null); setTours(null);
    const load = async () => {
      if (tab === 'overview') { const data = await reportApi.overview(filters, controller.signal); if (!controller.signal.aborted) setOverview(data); }
      if (tab === 'products') { const data = await reportApi.products(filters, controller.signal); if (!controller.signal.aborted) setProducts(data); }
      if (tab === 'tours') { const data = await reportApi.tours(filters, controller.signal); if (!controller.signal.aborted) setTours(data); }
    };
    void load().catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được báo cáo.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, tab, revision]);
  useEffect(() => {
    if (tab === 'products') { setTransactions(null); return; }
    const controller = new AbortController(); setTableLoading(true); setTableError(''); setTransactions(null);
    reportApi.transactions(filters, tab, page, controller.signal).then(data => { if (!controller.signal.aborted) setTransactions(data); })
      .catch(e => { if (!controller.signal.aborted) setTableError(e instanceof Error ? e.message : 'Không tải được giao dịch.'); })
      .finally(() => { if (!controller.signal.aborted) setTableLoading(false); });
    return () => controller.abort();
  }, [filters, tab, page, revision]);
  const change = (key: keyof Filters, value: string) => setDraft(old => ({ ...old, [key]: value, ...(key === 'tourId' ? { scheduleId: '' } : {}) }));
  const switchTab = (next: ReportTab) => { setTab(next); setPage(0); setActionError(''); setError(''); };
  async function exportCsv() { setExporting(true); setActionError(''); try { await reportApi.export(filters, tab); } catch (e) { setActionError(e instanceof Error ? e.message : 'Không xuất được CSV.'); } finally { setExporting(false); } }
  const monthly = filters.period === 'MONTH';
  const dates = reportDates(filters);
  const timeline = tours ? dates.map(date => ({ date, receivedAmount: tours.series.filter(row => row.date === date).reduce((sum, row) => sum + row.receivedAmount, 0), refundedAmount: tours.series.filter(row => row.date === date).reduce((sum, row) => sum + row.refundedAmount, 0), netAmount: tours.series.filter(row => row.date === date).reduce((sum, row) => sum + row.netAmount, 0) })) : overview?.series || [];
  const productTimeline = products ? dates.map(date => ({ date, sale: products.series.filter(row => row.date === date).reduce((sum, row) => sum + row.saleValue, 0), rental: products.series.filter(row => row.date === date).reduce((sum, row) => sum + row.rentalValue, 0) })) : [];
  const tourTotals = tours?.tours.reduce((sum, row) => ({ receivedAmount: sum.receivedAmount + row.receivedAmount, refundedAmount: sum.refundedAmount + row.refundedAmount, netAmount: sum.netAmount + row.netAmount }), { receivedAmount: 0, refundedAmount: 0, netAmount: 0 });

  return <main className="revenue-page">
    <header className="rp-heading"><div><span className="rp-eyebrow">BUSINESS INTELLIGENCE</span><h1>Báo cáo thu & hoàn tiền</h1><p>Theo dõi dòng tiền thiết bị và chuyến đi từ các giao dịch đã xác minh.</p></div><button className="rp-button" disabled={exporting || loading || !!error || tab === 'products'} onClick={() => void exportCsv()} title={tab === 'products' ? 'CSV xuất giao dịch tiền thu/hoàn ở tab Tổng quan hoặc Tour' : 'Xuất giao dịch theo bộ lọc đã áp dụng'}><Download size={16}/>{exporting ? 'Đang xuất…' : 'Xuất giao dịch CSV'}</button></header>
    <div className="rp-tabs" role="group" aria-label="Loại báo cáo">{([{ id: 'overview', text: 'Tổng quan', icon: <BarChart3 size={16}/> }, { id: 'products', text: 'Sản phẩm', icon: <Package size={16}/> }, { id: 'tours', text: 'Tour & khởi hành', icon: <Ticket size={16}/> }] as const).map(item => <button key={item.id} aria-pressed={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => switchTab(item.id)}>{item.icon}{item.text}</button>)}</div>
    <form className="rp-filters" onSubmit={e => { e.preventDefault(); const message = validateFilters(draft); if (message) { setActionError(message); return; } setActionError(''); setPage(0); setFilters({ ...draft }); }}>
      <label>Từ ngày<input type="date" required value={draft.from} max={draft.to} onChange={e => change('from', e.target.value)}/></label><label>Đến ngày<input type="date" required value={draft.to} min={draft.from} onChange={e => change('to', e.target.value)}/></label>
      <label>Chi nhánh<select value={draft.branchId} onChange={e => change('branchId', e.target.value)}><option value="">Tất cả chi nhánh</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
      <label>Nhóm thời gian<select value={draft.period} onChange={e => change('period', e.target.value)}><option value="DAY">Theo ngày</option><option value="MONTH">Theo tháng</option></select></label>
      {tab === 'overview' && <label>Nguồn thu<select value={draft.sector} onChange={e => change('sector', e.target.value)}><option value="">Thiết bị & Tour</option><option value="EQUIPMENT">Thiết bị</option><option value="TOUR">Tour</option></select></label>}
      {tab !== 'products' && <label>Phương thức<select value={draft.paymentMethod} onChange={e => change('paymentMethod', e.target.value)}><option value="">Tất cả</option><option value="ZALOPAY">ZaloPay</option><option value="MANUAL">Thủ công</option></select></label>}
      {tab === 'products' && <label>Sản phẩm<select value={draft.productId} onChange={e => change('productId', e.target.value)}><option value="">Tất cả sản phẩm</option>{catalog.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>}
      {tab === 'tours' && <><label>Chuyến đi<select value={draft.tourId} onChange={e => change('tourId', e.target.value)}><option value="">Tất cả tour</option>{events.map(event => <option key={event.eventId} value={event.eventId}>{event.eventName}</option>)}</select></label><label>Mã lịch khởi hành<input type="number" min="1" step="1" placeholder="Tất cả lịch" value={draft.scheduleId} onChange={e => change('scheduleId', e.target.value)}/></label></>}
      <button className="rp-button" type="submit"><CalendarDays size={15}/>Áp dụng</button><button className="rp-icon-button" type="button" aria-label="Tải lại báo cáo" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw size={17} className={loading ? 'rp-spin' : ''}/></button>
    </form>
    <div className="rp-period-note">Kỳ đang xem: <strong>{filters.from} → {filters.to}</strong><span>Giờ Việt Nam (UTC+7) · {monthly ? 'Theo tháng' : 'Theo ngày'}</span></div>
    {optionsError && <p className="rp-hint">{optionsError}</p>}{actionError && <div className="rp-error" role="alert"><AlertCircle size={18}/>{actionError}</div>}
    {error ? <div className="rp-error" role="alert"><AlertCircle size={18}/><span>{error}</span><button onClick={() => setRevision(value => value + 1)}>Thử lại</button></div> : loading ? <div className="rp-loading" role="status"><RefreshCw className="rp-spin"/>Đang tổng hợp báo cáo…</div> : <>
      {overview && <><div className="rp-kpis"><Kpi title="Tổng tiền thu" value={overview.totals.receivedAmount} detail={`${overview.totals.paymentCount} giao dịch thu thành công`} icon={<ArrowDownLeft size={18}/>}/><Kpi title="Tiền đã hoàn" value={overview.totals.refundedAmount} detail={`${overview.totals.refundCount} giao dịch hoàn thành công`} icon={<ArrowUpRight size={18}/>} tone="orange"/><Kpi title="Thu ròng trong kỳ" value={overview.totals.netAmount} detail="Tiền thu trừ tiền đã hoàn" icon={<Wallet size={18}/>} tone="green"/><Kpi title="Đang chờ hoàn" value={overview.pendingRefundAmount} detail={`${overview.pendingRefundCount} yêu cầu hiện tại · không giới hạn kỳ`} icon={<RefreshCw size={18}/>}/></div>
        {overview.undatedSucceededCount > 0 && <div className="rp-warning"><AlertCircle size={18}/><span>{overview.undatedSucceededCount} giao dịch cũ chưa có thời điểm thành công chưa được tính vào kỳ: thu {money(overview.undatedReceivedAmount)}, hoàn {money(overview.undatedRefundedAmount)}.</span></div>}
      </>}
      {tourTotals && <div className="rp-kpis three"><Kpi title="Tiền thu vé tour" value={tourTotals.receivedAmount} detail="PAYMENT đã thành công trong kỳ" icon={<Ticket size={18}/>}/><Kpi title="Tiền hoàn vé tour" value={tourTotals.refundedAmount} detail="REFUND đã thành công trong kỳ" icon={<ArrowUpRight size={18}/>} tone="orange"/><Kpi title="Thu ròng vé tour" value={tourTotals.netAmount} detail="Có thể âm nếu hoàn tiền của kỳ trước" icon={<Wallet size={18}/>} tone="green"/></div>}
      {products && <><div className="rp-warning"><Package size={18}/><span>Giá trị sản phẩm trong đơn đã thanh toán đủ, trước hoàn tiền. Số liệu dùng giá chốt và ngày thuê; không phải thu ròng theo từng sản phẩm.</span></div><div className="rp-kpis three"><Kpi title="Giá trị mua" value={products.products.reduce((sum, row) => sum + row.saleValue, 0)} detail="Sản phẩm bán trong đơn đủ tiền" icon={<Package size={18}/>}/><Kpi title="Giá trị thuê" value={products.products.reduce((sum, row) => sum + row.rentalValue, 0)} detail="Bao gồm số lượng × số ngày thuê" icon={<CalendarDays size={18}/>} tone="orange"/><Kpi title="Tổng giá trị sản phẩm" value={products.products.reduce((sum, row) => sum + row.totalValue, 0)} detail="Không phân bổ khoản hoàn của đơn vào item" icon={<Wallet size={18}/>} tone="green"/></div></>}
      <Panel title={tab === 'products' ? 'Giá trị mua & thuê theo thời gian' : 'Tiền thu, tiền hoàn & thu ròng'} subtitle={tab === 'products' ? 'Ghi nhận tại thời điểm đơn lần đầu được thanh toán đủ.' : 'Ghi nhận theo thời điểm backend xác minh thành công. Hoàn tiền tính vào kỳ hoàn.'}>
        <ReportChart labels={(products ? productTimeline : timeline).map(row => shortDate(row.date, monthly))} series={products ? [{ name: 'Giá trị mua', color: chartColors[0], values: productTimeline.map(row => row.sale) }, { name: 'Giá trị thuê', color: chartColors[1], values: productTimeline.map(row => row.rental) }] : [{ name: 'Tiền thu', color: chartColors[0], values: timeline.map(row => row.receivedAmount) }, { name: 'Tiền hoàn', color: chartColors[1], values: timeline.map(row => row.refundedAmount) }, { name: 'Thu ròng', color: chartColors[2], values: timeline.map(row => row.netAmount) }]}/>
      </Panel>
      {overview && <div className="rp-two-columns"><Panel title="Thu ròng theo chi nhánh"><BranchBars rows={overview.branches}/></Panel><Panel title="Tỷ trọng tiền thu" subtitle="Tỷ trọng tính trên tiền thu thành công, trước hoàn."><SectorDonut rows={overview.sectors}/></Panel></div>}
      {products && <><Panel title="Biến động theo từng sản phẩm" subtitle="So sánh tổng giá trị mua/thuê của các sản phẩm trong kỳ."><EntityTrend key={JSON.stringify(filters)} dates={dates} entities={products.products.map(row => ({ id: row.productId, name: row.productName }))} points={products.series.map(row => ({ date: row.date, id: row.productId, value: row.totalValue }))} label="Giá trị trong đơn đã thanh toán, trước hoàn tiền"/></Panel><Panel title="So sánh sản phẩm" subtitle="Giá trị mua và thuê theo từng sản phẩm; xem các nhóm để không bỏ sót sản phẩm."><Comparison key={JSON.stringify(filters)} product rows={products.products.map(row => ({ id: row.productId, name: row.productName, a: row.saleValue, b: row.rentalValue, c: row.totalValue }))}/></Panel><Panel title="Chi tiết sản phẩm"><div className="rp-table-scroll"><table><thead><tr><th>Sản phẩm</th><th>SL bán</th><th>SL thuê</th><th>Số lượng × ngày thuê</th><th>Đơn đủ tiền</th><th>Giá trị mua</th><th>Giá trị thuê</th><th>Tổng giá trị</th></tr></thead><tbody>{products.products.length ? products.products.map(row => <tr key={row.productId}><td><strong>{row.productName}</strong><small>#{row.productId}</small></td><td>{row.saleQuantity}</td><td>{row.rentalQuantity}</td><td>{row.rentalDays}</td><td>{row.paidOrderCount}</td><td>{money(row.saleValue)}</td><td>{money(row.rentalValue)}</td><td>{money(row.totalValue)}</td></tr>) : <NoRows/>}</tbody></table></div></Panel></>}
      {tours && <><Panel title="Biến động theo từng tour" subtitle="So sánh thu ròng các tour trong kỳ; các khoản hoàn có thể làm số liệu âm."><EntityTrend key={JSON.stringify(filters)} dates={dates} entities={tours.tours.map(row => ({ id: row.tourId, name: row.tourName }))} points={tours.series.map(row => ({ date: row.date, id: row.tourId, value: row.netAmount }))} label="Thu ròng = tiền thu − tiền hoàn"/></Panel><Panel title="So sánh từng tour"><Comparison key={JSON.stringify(filters)} rows={tours.tours.map(row => ({ id: row.tourId, name: row.tourName, a: row.receivedAmount, b: row.refundedAmount, c: row.netAmount }))}/></Panel><Panel title="Theo từng lịch khởi hành"><div className="rp-table-scroll"><table><thead><tr><th>Tour / lịch</th><th>Khởi hành</th><th>Chi nhánh</th><th>Vé đã thu trong kỳ</th><th>Thu</th><th>Hoàn</th><th>Ròng</th></tr></thead><tbody>{tours.schedules.length ? tours.schedules.map(row => <tr key={row.scheduleId}><td><strong>{row.tourName}</strong><small>Lịch #{row.scheduleId}</small></td><td>{datetime(row.startDatetime)}</td><td>{row.branchName}</td><td>{row.paidTicketCount}</td><td>{money(row.receivedAmount)}</td><td>{money(row.refundedAmount)}</td><td className={row.netAmount < 0 ? 'rp-negative' : ''}>{money(row.netAmount)}</td></tr>) : <NoRows/>}</tbody></table></div></Panel></>}
    </>}
    {tab !== 'products' && <Panel title="Giao dịch thành công" subtitle="Các khoản thu/hoàn đã được xác minh trong kỳ đang chọn.">{tableError ? <div className="rp-error" role="alert">{tableError}</div> : tableLoading ? <div className="rp-loading" role="status">Đang tải giao dịch…</div> : transactions && <><div className="rp-table-scroll"><table><thead><tr><th>Giao dịch</th><th>Đơn / Vé</th><th>Chi nhánh</th><th>Loại</th><th>Phương thức</th><th>Số tiền</th><th>Thành công lúc</th></tr></thead><tbody>{transactions.content.length ? transactions.content.map(row => <tr key={row.transactionId}><td>#{row.transactionId}</td><td>{row.orderId ? `Đơn #${row.orderId}` : `Vé #${row.participantId}`}<small>{row.tourName}</small></td><td>{row.branchName}</td><td><span className={`rp-type ${row.transactionType === 'REFUND' ? 'refund' : ''}`}>{row.transactionType === 'REFUND' ? 'Hoàn tiền' : 'Thu tiền'}</span></td><td>{row.paymentMethod === 'MANUAL' ? 'Thủ công' : row.paymentMethod}</td><td>{money(row.amount)}</td><td>{datetime(row.succeededAt)}</td></tr>) : <NoRows/>}</tbody></table></div>{transactions.totalPages > 1 && <div className="rp-pagination"><span>{transactions.totalElements} giao dịch · Trang {page + 1}/{transactions.totalPages}</span><div><button disabled={page === 0} onClick={() => setPage(value => value - 1)}><ChevronLeft size={15}/>Trước</button><button disabled={page + 1 >= transactions.totalPages} onClick={() => setPage(value => value + 1)}>Sau<ChevronRight size={15}/></button></div></div>}</> }</Panel>}
    <p className="rp-footer-note">Nguồn: giao dịch đã xác minh trong hệ thống · Đơn vị VND · Báo cáo tiền thu/hoàn, không phải lợi nhuận.</p>
  </main>;
};
