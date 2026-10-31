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
const datetime = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="rp-panel"><div className="rp-panel-heading"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}</section>;
}
function Kpi({ title, value, detail, icon, tone = '' }: { title: string; value: number; detail?: string; icon: ReactNode; tone?: string }) {
  return <div className={`rp-kpi ${tone}`}><div><span>{title}</span>{icon}</div><strong>{money(value)}</strong><p>{detail}</p></div>;
}
function NoRows() { return <tr><td colSpan={10} className="rp-no-rows">No data matches the selected filters.</td></tr>; }
function Comparison({ rows, product = false }: { rows: { id: number; name: string; a: number; b: number; c: number }[]; product?: boolean }) {
  const [page, setPage] = useState(0);
  const safePage = Math.min(page, Math.max(0, Math.ceil(rows.length / 8) - 1));
  const slice = rows.slice(safePage * 8, safePage * 8 + 8);
  return <><ReportChart kind="bar" scaleValues={rows.flatMap(row => product ? [row.a, row.b] : [row.a, row.b, row.c])} labels={slice.map(row => row.name)} series={[
    { name: product ? 'Sales value' : 'Payments received', color: chartColors[0], values: slice.map(row => row.a) },
    { name: product ? 'Rental value' : 'Refunds', color: chartColors[1], values: slice.map(row => row.b) },
    ...(!product ? [{ name: 'Net receipts', color: chartColors[2], values: slice.map(row => row.c) }] : []),
  ]}/>{rows.length > 8 && <div className="rp-pagination"><span>Showing {safePage * 8 + 1}–{Math.min(rows.length, safePage * 8 + 8)} / {rows.length}</span><div><button aria-label="Previous group" disabled={!safePage} onClick={() => setPage(safePage - 1)}><ChevronLeft size={15}/></button><button aria-label="Next group" disabled={(safePage + 1) * 8 >= rows.length} onClick={() => setPage(safePage + 1)}><ChevronRight size={15}/></button></div></div>}</>;
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
      if (results.some(result => result.status === 'rejected')) setOptionsError('Some filter options could not be loaded. You can still view reports by date range.');
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
    void load().catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load report.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, tab, revision]);
  useEffect(() => {
    if (tab === 'products') { setTransactions(null); return; }
    const controller = new AbortController(); setTableLoading(true); setTableError(''); setTransactions(null);
    reportApi.transactions(filters, tab, page, controller.signal).then(data => { if (!controller.signal.aborted) setTransactions(data); })
      .catch(e => { if (!controller.signal.aborted) setTableError(e instanceof Error ? e.message : 'Unable to load transactions.'); })
      .finally(() => { if (!controller.signal.aborted) setTableLoading(false); });
    return () => controller.abort();
  }, [filters, tab, page, revision]);
  const change = (key: keyof Filters, value: string) => setDraft(old => ({ ...old, [key]: value, ...(key === 'tourId' ? { scheduleId: '' } : {}) }));
  const switchTab = (next: ReportTab) => { setTab(next); setPage(0); setActionError(''); setError(''); };
  async function exportCsv() { setExporting(true); setActionError(''); try { await reportApi.export(filters, tab); } catch (e) { setActionError(e instanceof Error ? e.message : 'Unable to export CSV.'); } finally { setExporting(false); } }
  const monthly = filters.period === 'MONTH';
  const dates = reportDates(filters);
  const timeline = tours ? dates.map(date => ({ date, receivedAmount: tours.series.filter(row => row.date === date).reduce((sum, row) => sum + row.receivedAmount, 0), refundedAmount: tours.series.filter(row => row.date === date).reduce((sum, row) => sum + row.refundedAmount, 0), netAmount: tours.series.filter(row => row.date === date).reduce((sum, row) => sum + row.netAmount, 0) })) : overview?.series || [];
  const productTimeline = products ? dates.map(date => ({ date, sale: products.series.filter(row => row.date === date).reduce((sum, row) => sum + row.saleValue, 0), rental: products.series.filter(row => row.date === date).reduce((sum, row) => sum + row.rentalValue, 0) })) : [];
  const tourTotals = tours?.tours.reduce((sum, row) => ({ receivedAmount: sum.receivedAmount + row.receivedAmount, refundedAmount: sum.refundedAmount + row.refundedAmount, netAmount: sum.netAmount + row.netAmount }), { receivedAmount: 0, refundedAmount: 0, netAmount: 0 });

  return <main className="revenue-page">
    <header className="rp-heading"><div><span className="rp-eyebrow">BUSINESS INTELLIGENCE</span><h1>Revenue & Refund Reports</h1><p>Track equipment and tour payments using verified transactions.</p></div><button className="rp-button" disabled={exporting || loading || !!error || tab === 'products'} onClick={() => void exportCsv()} title={tab === 'products' ? 'Export payment and refund transactions from Overview or Tours' : 'Export transactions using the applied filters'}><Download size={16}/>{exporting ? 'Exporting…' : 'Export transactions CSV'}</button></header>
    <div className="rp-tabs" role="group" aria-label="Report type">{([{ id: 'overview', text: 'Overview', icon: <BarChart3 size={16}/> }, { id: 'products', text: 'Products', icon: <Package size={16}/> }, { id: 'tours', text: 'Tours & Departures', icon: <Ticket size={16}/> }] as const).map(item => <button key={item.id} aria-pressed={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => switchTab(item.id)}>{item.icon}{item.text}</button>)}</div>
    <form className="rp-filters" onSubmit={e => { e.preventDefault(); const message = validateFilters(draft); if (message) { setActionError(message); return; } setActionError(''); setPage(0); setFilters({ ...draft }); }}>
      <label>From<input type="date" required value={draft.from} max={draft.to} onChange={e => change('from', e.target.value)}/></label><label>To<input type="date" required value={draft.to} min={draft.from} onChange={e => change('to', e.target.value)}/></label>
      <label>Branch<select value={draft.branchId} onChange={e => change('branchId', e.target.value)}><option value="">All branches</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
      <label>Group by<select value={draft.period} onChange={e => change('period', e.target.value)}><option value="DAY">Daily</option><option value="MONTH">Monthly</option></select></label>
      {tab === 'overview' && <label>Revenue source<select value={draft.sector} onChange={e => change('sector', e.target.value)}><option value="">Equipment & Tours</option><option value="EQUIPMENT">Equipment</option><option value="TOUR">Tour</option></select></label>}
      {tab !== 'products' && <label>Payment method<select value={draft.paymentMethod} onChange={e => change('paymentMethod', e.target.value)}><option value="">All</option><option value="ZALOPAY">ZaloPay</option><option value="MANUAL">Manual</option></select></label>}
      {tab === 'products' && <label>Product<select value={draft.productId} onChange={e => change('productId', e.target.value)}><option value="">All products</option>{catalog.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>}
      {tab === 'tours' && <><label>Tour<select value={draft.tourId} onChange={e => change('tourId', e.target.value)}><option value="">All tours</option>{events.map(event => <option key={event.eventId} value={event.eventId}>{event.eventName}</option>)}</select></label><label>Departure ID<input type="number" min="1" step="1" placeholder="All departures" value={draft.scheduleId} onChange={e => change('scheduleId', e.target.value)}/></label></>}
      <button className="rp-button" type="submit"><CalendarDays size={15}/>Apply</button><button className="rp-icon-button" type="button" aria-label="Refresh report" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw size={17} className={loading ? 'rp-spin' : ''}/></button>
    </form>
    <div className="rp-period-note">Reporting period: <strong>{filters.from} → {filters.to}</strong><span>Vietnam time (UTC+7) · {monthly ? 'Monthly' : 'Daily'}</span></div>
    {optionsError && <p className="rp-hint">{optionsError}</p>}{actionError && <div className="rp-error" role="alert"><AlertCircle size={18}/>{actionError}</div>}
    {error ? <div className="rp-error" role="alert"><AlertCircle size={18}/><span>{error}</span><button onClick={() => setRevision(value => value + 1)}>Try again</button></div> : loading ? <div className="rp-loading" role="status"><RefreshCw className="rp-spin"/>Loading report…</div> : <>
      {overview && <><div className="rp-kpis"><Kpi title="Total received" value={overview.totals.receivedAmount} detail={`${overview.totals.paymentCount} successful payments`} icon={<ArrowDownLeft size={18}/>}/><Kpi title="Completed refunds" value={overview.totals.refundedAmount} detail={`${overview.totals.refundCount} completed refunds`} icon={<ArrowUpRight size={18}/>} tone="orange"/><Kpi title="Net receipts in period" value={overview.totals.netAmount} detail="Payments received minus completed refunds" icon={<Wallet size={18}/>} tone="green"/><Kpi title="Pending refunds" value={overview.pendingRefundAmount} detail={`${overview.pendingRefundCount} current requests · all dates`} icon={<RefreshCw size={18}/>}/></div>
        {overview.undatedSucceededCount > 0 && <div className="rp-warning"><AlertCircle size={18}/><span>{overview.undatedSucceededCount} older transactions have no verified success time and are excluded from this period: received {money(overview.undatedReceivedAmount)}, refunded {money(overview.undatedRefundedAmount)}.</span></div>}
      </>}
      {tourTotals && <div className="rp-kpis three"><Kpi title="Tour payments" value={tourTotals.receivedAmount} detail="Successful payments in the selected period" icon={<Ticket size={18}/>}/><Kpi title="Tour refunds" value={tourTotals.refundedAmount} detail="Completed refunds in the selected period" icon={<ArrowUpRight size={18}/>} tone="orange"/><Kpi title="Net tour receipts" value={tourTotals.netAmount} detail="May be negative when refunding earlier payments" icon={<Wallet size={18}/>} tone="green"/></div>}
      {products && <><div className="rp-warning"><Package size={18}/><span>Item value in fully paid orders, before refunds. Uses booked prices and rental days; this is not net receipts per product.</span></div><div className="rp-kpis three"><Kpi title="Sales value" value={products.products.reduce((sum, row) => sum + row.saleValue, 0)} detail="Sold items in fully paid orders" icon={<Package size={18}/>}/><Kpi title="Rental value" value={products.products.reduce((sum, row) => sum + row.rentalValue, 0)} detail="Quantity × rental days" icon={<CalendarDays size={18}/>} tone="orange"/><Kpi title="Total item value" value={products.products.reduce((sum, row) => sum + row.totalValue, 0)} detail="Order refunds are not allocated to individual items" icon={<Wallet size={18}/>} tone="green"/></div></>}
      <Panel title={tab === 'products' ? 'Sales & rental value over time' : 'Payments, refunds & net receipts'} subtitle={tab === 'products' ? 'Recorded when the order is first fully paid.' : 'Based on verified success time. Refunds are recorded in the period they are completed.'}>
        <ReportChart labels={(products ? productTimeline : timeline).map(row => shortDate(row.date, monthly))} series={products ? [{ name: 'Sales value', color: chartColors[0], values: productTimeline.map(row => row.sale) }, { name: 'Rental value', color: chartColors[1], values: productTimeline.map(row => row.rental) }] : [{ name: 'Payments received', color: chartColors[0], values: timeline.map(row => row.receivedAmount) }, { name: 'Refunds', color: chartColors[1], values: timeline.map(row => row.refundedAmount) }, { name: 'Net receipts', color: chartColors[2], values: timeline.map(row => row.netAmount) }]}/>
      </Panel>
      {overview && <div className="rp-two-columns"><Panel title="Net receipts by branch"><BranchBars rows={overview.branches}/></Panel><Panel title="Payment share" subtitle="Share of successful payments, before refunds."><SectorDonut rows={overview.sectors}/></Panel></div>}
      {products && <><Panel title="Product trends" subtitle="Compare total sales and rental value across products in the selected period."><EntityTrend key={JSON.stringify(filters)} dates={dates} entities={products.products.map(row => ({ id: row.productId, name: row.productName }))} points={products.series.map(row => ({ date: row.date, id: row.productId, value: row.totalValue }))} label="Value in fully paid orders, before refunds"/></Panel><Panel title="Product comparison" subtitle="Sales and rental value by product. Browse all groups to see every product."><Comparison key={JSON.stringify(filters)} product rows={products.products.map(row => ({ id: row.productId, name: row.productName, a: row.saleValue, b: row.rentalValue, c: row.totalValue }))}/></Panel><Panel title="Product details"><div className="rp-table-scroll"><table><thead><tr><th>Product</th><th>Units sold</th><th>Units rented</th><th>Units × rental days</th><th>Fully paid orders</th><th>Sales value</th><th>Rental value</th><th>Total value</th></tr></thead><tbody>{products.products.length ? products.products.map(row => <tr key={row.productId}><td><strong>{row.productName}</strong><small>#{row.productId}</small></td><td>{row.saleQuantity}</td><td>{row.rentalQuantity}</td><td>{row.rentalDays}</td><td>{row.paidOrderCount}</td><td>{money(row.saleValue)}</td><td>{money(row.rentalValue)}</td><td>{money(row.totalValue)}</td></tr>) : <NoRows/>}</tbody></table></div></Panel></>}
      {tours && <><Panel title="Tour trends" subtitle="Compare net receipts across tours. Refunds can produce negative values."><EntityTrend key={JSON.stringify(filters)} dates={dates} entities={tours.tours.map(row => ({ id: row.tourId, name: row.tourName }))} points={tours.series.map(row => ({ date: row.date, id: row.tourId, value: row.netAmount }))} label="Net receipts = payments − refunds"/></Panel><Panel title="Tour comparison"><Comparison key={JSON.stringify(filters)} rows={tours.tours.map(row => ({ id: row.tourId, name: row.tourName, a: row.receivedAmount, b: row.refundedAmount, c: row.netAmount }))}/></Panel><Panel title="Departure breakdown"><div className="rp-table-scroll"><table><thead><tr><th>Tour / departure</th><th>Departure</th><th>Branch</th><th>Tickets paid in period</th><th>Received</th><th>Refunds</th><th>Net</th></tr></thead><tbody>{tours.schedules.length ? tours.schedules.map(row => <tr key={row.scheduleId}><td><strong>{row.tourName}</strong><small>Departure #{row.scheduleId}</small></td><td>{datetime(row.startDatetime)}</td><td>{row.branchName}</td><td>{row.paidTicketCount}</td><td>{money(row.receivedAmount)}</td><td>{money(row.refundedAmount)}</td><td className={row.netAmount < 0 ? 'rp-negative' : ''}>{money(row.netAmount)}</td></tr>) : <NoRows/>}</tbody></table></div></Panel></>}
    </>}
    {tab !== 'products' && <Panel title="Successful transactions" subtitle="Verified payments and refunds in the selected period.">{tableError ? <div className="rp-error" role="alert">{tableError}</div> : tableLoading ? <div className="rp-loading" role="status">Loading transactions…</div> : transactions && <><div className="rp-table-scroll"><table><thead><tr><th>Transaction</th><th>Order / ticket</th><th>Branch</th><th>Type</th><th>Payment method</th><th>Amount</th><th>Succeeded at</th></tr></thead><tbody>{transactions.content.length ? transactions.content.map(row => <tr key={row.transactionId}><td>#{row.transactionId}</td><td>{row.orderId ? `Order #${row.orderId}` : `Ticket #${row.participantId}`}<small>{row.tourName}</small></td><td>{row.branchName}</td><td><span className={`rp-type ${row.transactionType === 'REFUND' ? 'refund' : ''}`}>{row.transactionType === 'REFUND' ? 'Refund' : 'Payment'}</span></td><td>{row.paymentMethod === 'MANUAL' ? 'Manual' : row.paymentMethod}</td><td>{money(row.amount)}</td><td>{datetime(row.succeededAt)}</td></tr>) : <NoRows/>}</tbody></table></div>{transactions.totalPages > 1 && <div className="rp-pagination"><span>{transactions.totalElements} transactions · Page {page + 1}/{transactions.totalPages}</span><div><button disabled={page === 0} onClick={() => setPage(value => value - 1)}><ChevronLeft size={15}/>Previous</button><button disabled={page + 1 >= transactions.totalPages} onClick={() => setPage(value => value + 1)}>Next<ChevronRight size={15}/></button></div></div>}</> }</Panel>}
    <p className="rp-footer-note">Source: verified transactions · Currency: VND · Payment and refund report, not profit.</p>
  </main>;
};
