import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Compass, CreditCard, FileText, LockKeyhole, MapPin, Package, RefreshCw, ShieldCheck, ShoppingBag } from 'lucide-react';
import { ApiError, catalogApi, vnd, type Branch, type Product } from '../equipment/catalogApi';
import type { Order, OrderItem } from '../orders/orderApi';
import './payment-pages.css';
import { paymentApi } from './paymentApi';

type Payment = { orderId?: number | null; participantId?: number | null; transaction_id: number; status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'; zalopay_response: { order_url?: string; return_message?: string } };
const positiveId = (value: string | null) => value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const date = (value: string) => new Date(value).toLocaleDateString('vi-VN');
function lineTotal(item: OrderItem) {
  const days = item.itemType === 'RENTAL' && item.rentalStartDate && item.rentalEndDate
    ? Math.round((Date.parse(item.rentalEndDate) - Date.parse(item.rentalStartDate)) / 86400000) + 1 : 1;
  return item.unitPrice * item.quantity * days;
}

/** ZIP's success / payment-interruption designs, with the host project's layout and real data. */
export function PaymentResultPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const loginUrl = '/login?returnTo=' + encodeURIComponent(location.pathname + location.search);
  const requestedOrderId = positiveId(params.get('orderId'));
  const transactionId = positiveId(params.get('transactionId')) || (requestedOrderId ? positiveId(sessionStorage.getItem(`payment.transaction.${requestedOrderId}`)) : null);
  const storedOrderId = requestedOrderId || (transactionId ? positiveId(sessionStorage.getItem(`payment.order.${transactionId}`)) : null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const orderId = payment?.orderId || storedOrderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [authError, setAuthError] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const generation = useRef(0);
  const checkInFlight = useRef<number | null>(null);
  const paymentInFlight = useRef(false);
  // Redirect is a display hint only. It never marks a payment or order as successful.
  const gatewayCancelled = params.get('status') === '-49';
  const success = payment?.status === 'SUCCEEDED' || (!transactionId && order?.paymentStatus === 'PAID');
  const terminal = payment?.status === 'FAILED' || payment?.status === 'CANCELLED';

  const check = useCallback(async (background = false) => {
    const version = generation.current;
    if (checkInFlight.current === version || paymentInFlight.current) return;
    checkInFlight.current = version;
    if (!background) { setChecking(true); setError(''); setAuthError(false); }
    try {
      const result = storedOrderId
        ? await paymentApi<Payment | null>(`/payments/zalopay/orders/${storedOrderId}/payment`, {}, true)
        : transactionId ? await paymentApi<Payment>(`/payments/zalopay/query/${transactionId}`) : null;
      if (version !== generation.current) return;
      setPayment(previous => JSON.stringify(previous) === JSON.stringify(result) ? previous : result);
      const resolvedOrderId = result?.orderId || storedOrderId;
      if (resolvedOrderId) {
        const data = await paymentApi<Order>(`/orders/${resolvedOrderId}`);
        if (version === generation.current) {
          setOrder(previous => JSON.stringify(previous) === JSON.stringify(data) ? previous : data);
        }
      }
    } catch (e) {
      if (!background && version === generation.current) { setError(e instanceof Error ? e.message : 'Chưa thể kiểm tra kết quả thanh toán.'); setAuthError(e instanceof ApiError && (e.status === 401 || e.status === 403)); }
    } finally {
      if (checkInFlight.current === version) checkInFlight.current = null;
      if (!background && version === generation.current) setChecking(false);
    }
  }, [transactionId, storedOrderId]);

  useEffect(() => {
    generation.current++;
    setPayment(null); setOrder(null); setBranch(null); setProducts({});
    void check();
    return () => { generation.current++; };
  }, [check]);

  useEffect(() => {
    if (payment?.status !== 'PENDING') return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden' || checkInFlight.current !== null || paymentInFlight.current) return;
      if (++attempts >= 6) window.clearInterval(timer);
      void check(true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [transactionId, payment?.status, check]);

  useEffect(() => {
    if (!order) return;
    let active = true;
    catalogApi<Branch[]>('/branches').then(b => { if (active) setBranch(b.find(x => x.id === order.branchId) || null); }).catch(() => {});
    const ids = [...new Set(order.items.map(i => i.productId))];
    Promise.all(ids.map(id => catalogApi<Product>(`/products/${id}`).catch(() => null))).then(values => {
      if (active) setProducts(Object.fromEntries(values.filter((p): p is Product => !!p).map(p => [p.id, p])));
    });
    return () => { active = false; };
  }, [order]);

  async function pay() {
    if (!order || order.status !== 'PENDING' || paymentInFlight.current) return;
    paymentInFlight.current = true;
    // Ignore an older background response arriving after the user starts paying.
    generation.current++;
    setPaying(true); setError(''); setAuthError(false);
    try {
      const returnUrl = new URL('/payment/result', window.location.origin);
      returnUrl.searchParams.set('orderId', String(order.id));
      const result = await paymentApi<Payment>(payment?.status === 'PENDING' ? '/payments/zalopay/retry' : '/payments/zalopay/', {
        method: 'POST', body: JSON.stringify({ orderId: order.id, redirectUrl: returnUrl.toString() }),
      });
      sessionStorage.setItem(`payment.order.${result.transaction_id}`, String(order.id));
      sessionStorage.setItem(`payment.transaction.${order.id}`, String(result.transaction_id));
      if (result.status === 'SUCCEEDED') {
        setPayment(result);
        const updated = await paymentApi<Order>(`/orders/${order.id}`);
        setOrder(updated); setPaying(false); paymentInFlight.current = false;
        return;
      }
      const url = result.zalopay_response?.order_url;
      if (!url || result.status === 'FAILED') throw new Error(result.zalopay_response?.return_message || 'Chưa tạo được đường dẫn thanh toán.');
      const destination = new URL(url);
      if (!['http:', 'https:'].includes(destination.protocol)) throw new Error('Đường dẫn thanh toán không hợp lệ.');
      window.location.assign(destination.toString());
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        paymentInFlight.current = false;
        await check();
      } else {
        setError(e instanceof Error ? e.message : 'Không thể tạo thanh toán.');
        setAuthError(e instanceof ApiError && (e.status === 401 || e.status === 403));
      }
      setPaying(false);
      paymentInFlight.current = false;
    }
  }

  const title = !payment && transactionId ? 'Đang xác minh kết quả thanh toán' : success ? 'Thanh toán thành công!' : gatewayCancelled ? 'Bạn đã hủy phiên thanh toán' : terminal ? 'Thanh toán chưa thành công' : transactionId ? 'Giao dịch thanh toán chưa hoàn tất' : order ? 'Hoàn tất thanh toán đơn hàng' : 'Kiểm tra thanh toán của bạn';
  const description = success ? 'Khoản thanh toán đã được xác nhận. Đơn hàng được ghi nhận và chờ chi nhánh duyệt trước khi bàn giao trang bị.' : gatewayCancelled ? 'Bạn đã quay về từ cổng thanh toán. Hệ thống tiếp tục đối soát giao dịch; trạng thái của đơn được cập nhật theo kết quả từ ZaloPay.' : terminal ? 'Giao dịch đã thất bại hoặc kết thúc. Bạn có thể kiểm tra đơn và tạo lượt thanh toán mới nếu đơn còn chờ xử lý.' : 'Hoàn tất thanh toán qua ZaloPay để chuẩn bị hành trình. Nếu vừa quay về từ cổng thanh toán, hãy chờ kết quả xác nhận hoặc kiểm tra lại.';

  return <div className="payment-pages">
    <div className="pp-breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><Link to="/orders">Đơn của tôi</Link><span>/</span><span>Kết quả thanh toán</span></div>
    <section className={`pp-banner ${success ? 'pp-success' : ''}`} aria-live="polite">
      <div className="pp-banner-icon">{success ? <CheckCircle2 size={32}/> : <AlertTriangle size={32}/>}</div>
      <div className="pp-banner-copy"><div className="pp-tags"><span>{success ? 'GIAO DỊCH ĐÃ KHỚP' : 'EXPEDITION DISPATCH'}</span><span>ZALOPAY · {payment?.status || 'KIỂM TRA GIAO DỊCH'}</span></div><h1>{title}</h1><p>{description}</p></div>
      <div className="pp-reference"><span>MÃ THAM CHIẾU</span><strong>{orderId ? `#ORDER-${orderId}` : (payment?.transaction_id || transactionId) ? `#TXN-${payment?.transaction_id || transactionId}` : 'Chưa chọn đơn'}</strong><small>{(payment?.transaction_id || transactionId) ? `Giao dịch #${payment?.transaction_id || transactionId}` : 'Theo dõi tại Đơn của tôi'}</small></div>
    </section>
    {error && <div className="pp-error" role="alert"><AlertTriangle size={18}/><span>{error}</span>{authError && <Link to={loginUrl}>Đăng nhập lại</Link>}<button onClick={() => void check()} disabled={checking}>Thử lại</button></div>}
    <div className="pp-sync-slot">{checking && <p className="pp-sync" role="status"><RefreshCw size={14} className="pp-spin"/>Đang xác minh kết quả thanh toán…</p>}</div>
    <div className="pp-grid">
      <div className="pp-main">
        {success ? <section className="pp-card"><div className="pp-card-title"><Compass size={20}/><h2>HÀNH TRÌNH CỦA BẠN ĐÃ SẴN SÀNG</h2></div><div className="pp-steps">{['Đã tạo đơn', 'Đã thanh toán', 'Chờ duyệt & chuẩn bị', 'Nhận trang bị'].map((s,i)=><div key={s} className={i<2?'pp-step done':'pp-step'}><span>{i<2?<Check size={17}/>:i+1}</span><p>{s}</p></div>)}</div><div className="pp-note"><ShieldCheck size={20}/><p>Thanh toán và duyệt đơn là hai bước riêng. Theo dõi trạng thái tại <Link to="/orders">Đơn của tôi</Link> trước khi đến nhận trang bị.</p></div></section>
        : <section className="pp-card"><div className="pp-card-title"><LockKeyhole size={20}/><h2>TIẾP TỤC CHUẨN BỊ HÀNH TRÌNH</h2></div><div className="pp-body"><h3>Một bước nữa để hoàn tất đơn hàng</h3><p>Kết quả giao dịch được xác minh trực tiếp với ZaloPay. Lỗi kết nối hoặc đóng trang thanh toán chưa có nghĩa là tiền đã được hoàn lại hay giao dịch đã kết thúc.</p><div className="pp-benefits"><div><ShieldCheck/><strong>Giá từ đơn hàng</strong><span>Số tiền do hệ thống tính và xác nhận.</span></div><div><RefreshCw/><strong>Đối soát tự động</strong><span>Kết quả sẽ cập nhật sau khi xác minh.</span></div><div><ShoppingBag/><strong>Giữ nguyên đơn</strong><span>Kiểm tra trạng thái trước khi đặt lại.</span></div></div><div className="pp-provider"><div className="pp-zalo">Z</div><div><strong>Thanh toán bằng ZaloPay</strong><p>Chuyển đến cổng thanh toán để chọn phương thức.</p></div><ShieldCheck size={23}/></div><div className="pp-actions"><button className="pp-button" disabled={!order || paying || checking || success || order.status !== 'PENDING' || order.paymentStatus === 'PAID'} onClick={() => void pay()}><CreditCard size={17}/>{paying?'Đang xử lý…':payment?.status === 'PENDING' || terminal || gatewayCancelled ? 'Thanh toán lại qua ZaloPay' : 'Thanh toán qua ZaloPay'}<ArrowRight size={17}/></button><button className="pp-button secondary" disabled={checking || (!transactionId && !orderId)} onClick={() => void check()}><RefreshCw size={16}/>Kiểm tra lại</button></div>{payment?.status === 'PENDING' && <p className="pp-caption">Bạn có thể thanh toán lại. Hệ thống sẽ xác minh và đóng lượt cũ với ZaloPay trước khi mở lượt mới, giữ nguyên đơn hàng.</p>}</div></section>}
        <section className="pp-card"><div className="pp-card-title"><Package size={20}/><h2>TRANG BỊ CHO HÀNH TRÌNH</h2><span>{order ? `${order.items.length} HẠNG MỤC` : 'ĐƠN HÀNG'}</span></div>{order ? <div className="pp-items">{order.items.map(item=><div className="pp-item" key={item.id}><div className="pp-item-icon">{item.itemType==='RENTAL'?<Compass/>:<ShoppingBag/>}</div><div><span className="pp-label">{item.itemType==='RENTAL'?'TRANG BỊ THUÊ':'TRANG BỊ MUA'}</span><Link to={`/gear/${item.productId}`}><h3>{products[item.productId]?.name || `Sản phẩm #${item.productId}`}</h3></Link><p>Số lượng: {item.quantity} · Đơn giá: {vnd(item.unitPrice)}{item.itemType==='RENTAL'?' / ngày':''}</p>{item.rentalStartDate && item.rentalEndDate && <small>{date(item.rentalStartDate)} → {date(item.rentalEndDate)}</small>}</div><strong>{vnd(lineTotal(item))}</strong></div>)}</div>:<div className="pp-empty"><Package size={35}/><h3>{transactionId?'Chưa có thông tin chi tiết đơn':'Chưa chọn đơn hàng'}</h3><p>Mở đơn của bạn để xem trang bị và tiếp tục thanh toán.</p><Link className="pp-text-link" to="/orders">Xem đơn của tôi <ArrowRight size={15}/></Link></div>}</section>
        <div className="pp-assurances"><div><ShieldCheck/><strong>Thông tin được xác minh</strong><span>Kết quả từ cổng thanh toán</span></div><div><Package/><strong>Trang bị tại chi nhánh</strong><span>Nhận theo thông tin đơn hàng</span></div><div><Compass/><strong>Sẵn sàng khám phá</strong><span>Chuẩn bị kỹ trước hành trình</span></div></div>
      </div>
      <aside className="pp-side"><section className="pp-card pp-summary"><div className="pp-summary-heading"><FileText size={20}/><h2>Chi tiết thanh toán</h2></div><dl><div><dt>Đơn hàng</dt><dd>{orderId?`#${orderId}`:'—'}</dd></div><div><dt>Giao dịch</dt><dd>{(payment?.transaction_id || transactionId)?`#${payment?.transaction_id || transactionId}`:'—'}</dd></div><div><dt>Đã thanh toán (ròng)</dt><dd>{order?vnd(order.paidAmount):'—'}</dd></div><div><dt>Còn thanh toán</dt><dd>{order?vnd(order.remainingAmount):'—'}</dd></div></dl><div className="pp-total"><span>TỔNG GIÁ TRỊ ĐƠN</span><strong>{order?vnd(order.totalAmount):'—'}</strong></div><Link className="pp-button" to="/orders"><FileText size={17}/>Xem đơn của tôi<ArrowRight size={17}/></Link><Link className="pp-button secondary" to="/shop"><ArrowLeft size={16}/>Tiếp tục khám phá</Link><p className="pp-secure"><LockKeyhole size={13}/>Kết quả thanh toán do backend xác nhận</p></section><section className="pp-card pp-branch"><div className="pp-summary-heading"><MapPin size={19}/><h2>Chi nhánh nhận trang bị</h2></div><div className="pp-branch-art"><Compass size={68}/><span>YOUR NEXT ADVENTURE</span></div><div className="pp-body"><h3>{branch?.name || (order?`Chi nhánh #${order.branchId}`:'Theo thông tin đơn hàng')}</h3><p>{branch?.address || 'Xem thông tin chi nhánh và xác nhận lịch nhận trước khi khởi hành.'}</p>{branch?.phone && <a className="pp-text-link" href={`tel:${branch.phone}`}>{branch.phone}</a>}{order && <Link className="pp-text-link" to={`/outposts/${order.branchId}`}>Thông tin chi nhánh <ArrowRight size={15}/></Link>}</div></section><div className="pp-help"><Clock3 size={21}/><div><strong>Cần kiểm tra thêm?</strong><p>Nếu đã bị trừ tiền nhưng chưa có xác nhận, kiểm tra lại giao dịch trước khi thanh toán lần nữa.</p></div></div></aside>
    </div>
  </div>;
}
