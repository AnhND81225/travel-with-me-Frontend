import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock3, Compass, CreditCard, FileText, LockKeyhole, MapPin, Package, RefreshCw, ShieldCheck, ShoppingBag } from 'lucide-react';
import { ApiError, catalogApi, vnd, type Branch, type Product } from '../equipment/catalogApi';
import type { Order, OrderItem } from '../orders/orderApi';
import './payment-pages.css';
import { paymentApi, payments, type Payment } from './paymentApi';
import { TourPaymentPage } from './TourPaymentPage';

const positiveId = (value: string | null) => value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const date = (value: string) => new Date(value).toLocaleDateString('en-GB');
function lineTotal(item: OrderItem) {
  const days = item.itemType === 'RENTAL' && item.rentalStartDate && item.rentalEndDate
    ? Math.round((Date.parse(item.rentalEndDate) - Date.parse(item.rentalStartDate)) / 86400000) + 1 : 1;
  return item.unitPrice * item.quantity * days;
}

/** ZIP's success / payment-interruption designs, with the host project's layout and real data. */
export function PaymentResultPage() {
  const [params] = useSearchParams();
  const participantId = positiveId(params.get('participantId'));
  const transactionId = positiveId(params.get('transactionId'));
  const orderId = positiveId(params.get('orderId'));
  const [resolved, setResolved] = useState<{ transactionId: number; participantId: number | null } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!transactionId || orderId || participantId) return;
    let active = true;
    setError('');
    payments.query(transactionId).then(result => {
      if (active) setResolved({ transactionId, participantId: result.participantId });
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load transactions.'); });
    return () => { active = false; };
  }, [transactionId, orderId, participantId]);
  if (participantId) return <TourPaymentPage key={participantId} id={participantId} />;
  if (transactionId && !orderId && resolved?.transactionId !== transactionId) return <div className="payment-pages">{error ? <div className="pp-error" role="alert">{error} <Link to={'/login?returnTo=' + encodeURIComponent('/payment/result?' + params.toString())}>Sign in again</Link><button onClick={() => window.location.reload()}>Try again</button></div> : <p>Loading transactions…</p>}</div>;
  if (resolved?.transactionId === transactionId && resolved.participantId) return <TourPaymentPage key={resolved.participantId} id={resolved.participantId} />;
  return <GearPaymentResultPage />;
}

function GearPaymentResultPage() {
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
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState('');
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
        ? await payments.forOrder(storedOrderId)
        : transactionId ? await payments.query(transactionId) : null;
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
      if (!background && version === generation.current) { setError(e instanceof Error ? e.message : 'Unable to check the payment result.'); setAuthError(e instanceof ApiError && (e.status === 401 || e.status === 403)); }
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
    if (!order || order.refundPending || order.status !== 'PENDING' || paymentInFlight.current) return;
    paymentInFlight.current = true;
    // Ignore an older background response arriving after the user starts paying.
    generation.current++;
    setPaying(true); setError(''); setNotice(''); setAuthError(false);
    try {
      const result = await (payment?.status === 'PENDING' ? payments.retry : payments.create)({ orderId: order.id });
      sessionStorage.setItem(`payment.order.${result.transaction_id}`, String(order.id));
      sessionStorage.setItem(`payment.transaction.${order.id}`, String(result.transaction_id));
      if (result.status === 'SUCCEEDED') {
        setPayment(result);
        const updated = await paymentApi<Order>(`/orders/${order.id}`);
        setOrder(updated); setPaying(false); paymentInFlight.current = false;
        return;
      }
      const url = result.zalopay_response?.order_url;
      if (!url || result.status === 'FAILED') throw new Error(result.zalopay_response?.return_message || 'Unable to create a payment link.');
      const destination = new URL(url);
      if (!['http:', 'https:'].includes(destination.protocol)) throw new Error('Invalid payment URL.');
      window.location.assign(destination.toString());
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        paymentInFlight.current = false;
        await check();
      } else {
        setError(e instanceof Error ? e.message : 'Unable to create payment.');
        setAuthError(e instanceof ApiError && (e.status === 401 || e.status === 403));
      }
      setPaying(false);
      paymentInFlight.current = false;
    }
  }


  async function cancelPayment() {
    const id = payment?.transaction_id;
    if (!id || payment.status !== 'PENDING' || paymentInFlight.current) return;
    paymentInFlight.current = true;
    generation.current++;
    setCancelling(true); setChecking(false); setError(''); setNotice(''); setAuthError(false);
    try {
      const result = await payments.cancel(id);
      setPayment(result);
      setNotice(result.status === 'SUCCEEDED'
        ? 'Payment succeeded before cancellation.'
        : result.status === 'CANCELLED'
          ? 'Payment cancelled. You can try paying for this order again.'
          : 'The payment attempt has ended. The order is unchanged.');
      const targetOrderId = result.orderId || orderId;
      if (targetOrderId) setOrder(await paymentApi<Order>(`/orders/${targetOrderId}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment cancellation has not been confirmed.');
      setAuthError(e instanceof ApiError && (e.status === 401 || e.status === 403));
    } finally {
      setCancelling(false);
      paymentInFlight.current = false;
    }
  }


  return <div className="payment-pages">
    <div className="pp-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/orders">My Orders</Link><span>/</span><span>Payment result</span></div>
    {error && <div className="pp-error" role="alert"><AlertTriangle size={18}/><span>{error}</span>{authError && <Link to={loginUrl}>Sign in again</Link>}<button onClick={() => void check()} disabled={checking}>Try again</button></div>}
    {notice && <p className="pp-note" role="status">{notice}</p>}
    <div className="pp-sync-slot">{checking && <p className="pp-sync" role="status"><RefreshCw size={14} className="pp-spin"/>Verifying payment…</p>}</div>
    <div className="pp-grid">
      <div className="pp-main">
        <section className="pp-card gp-checkout">
          <div className="pp-card-title"><Package size={20}/><h2>EQUIPMENT ORDER & CHECKOUT</h2>{orderId && <span>ORDER #{orderId}</span>}</div>
          <div className="pp-steps gp-steps" aria-label="Order progress">{['Order placed', 'Payment', 'Approval & preparation', 'Equipment receipt'].map((label, index) => {
            const paid = success || order?.paymentStatus === 'PAID';
            const cancelled = order?.status === 'CANCELLED';
            const approved = !!order && ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status);
            const received = !!order?.customerReceivedAt;
            const done = [!!order, paid, approved, received][index];
            const active = !cancelled && !done && index === (paid ? approved ? 3 : 2 : order ? 1 : 0);
            return <div key={label} className={`pp-step${done ? ' done' : ''}${active ? ' active' : ''}`} aria-current={active ? 'step' : undefined}><span>{done ? <Check size={17}/> : index + 1}</span><p>{label}</p></div>;
          })}</div>
          {order?.refundPending && <p className="pp-note" role="status">A refund is pending. Payment and order approval are paused. <Link to="/refunds">View refund request</Link></p>}
          {order?.status === 'CANCELLED' && <p className="pp-note" role="status">This order has been cancelled. Check the transaction if you already paid.</p>}
          <div className="gp-order-heading"><div><span className="pp-label">EQUIPMENT BOOKING DETAILS</span><h3>Equipment for your adventure</h3></div>{order && <span>{order.items.length} items · Ordered on {date(order.orderDate)}</span>}</div>
          {order ? <div className="pp-items">{order.items.map(item=><div className="pp-item" key={item.id}><div className="pp-item-icon">{item.itemType==='RENTAL'?<Compass/>:<ShoppingBag/>}</div><div><span className="pp-label">{item.itemType==='RENTAL'?'RENTAL EQUIPMENT':'PURCHASED EQUIPMENT'}</span><Link to={`/gear/${item.productId}`}><h3>{products[item.productId]?.name || `Product #${item.productId}`}</h3></Link><p>Quantity: {item.quantity} · Unit price: {vnd(item.unitPrice)}{item.itemType==='RENTAL'?' / day':''}</p>{item.rentalStartDate && item.rentalEndDate && <small>{date(item.rentalStartDate)} → {date(item.rentalEndDate)}</small>}</div><strong>{vnd(lineTotal(item))}</strong></div>)}</div>:<div className="pp-empty"><Package size={35}/><h3>{transactionId?'Order details are not available':'No order selected'}</h3><p>Open your order to review equipment and continue to payment.</p><Link className="pp-text-link" to="/orders">My Orders <ArrowRight size={15}/></Link></div>}
          <div className="pp-body gp-checkout-actions">
            {order?.paymentStatus === 'REFUNDED' ? <div className="gp-paid"><Check size={19}/><div><strong>Refunded</strong><p>The order was cancelled after the remaining balance was fully refunded.</p></div><Link className="pp-text-link" to="/refunds">View refund history</Link></div> : order?.refundPending ? <div className="gp-paid"><Clock3 size={19}/><div><strong>Refund pending</strong><p>An admin is reviewing the refund. Payment and approval are unavailable.</p></div><Link className="pp-text-link" to="/refunds">View request</Link></div> : success ? <div className="gp-paid"><Check size={19}/><div><strong>Payment received</strong><p>Track your order for approval, preparation and equipment collection updates.</p></div><Link className="pp-text-link" to="/orders">My Orders <ArrowRight size={14}/></Link></div> : <>
              <div className="pp-provider"><div className="pp-zalo">Z</div><div><strong>Pay with ZaloPay</strong><p>Choose your payment method at checkout.</p></div><ShieldCheck size={23}/></div><div className="pp-actions"><button className="pp-button" disabled={!order || paying || cancelling || checking || success || order.refundPending || order.status !== 'PENDING' || order.paymentStatus === 'PAID'} onClick={() => void pay()}><CreditCard size={17}/>{paying?'Processing…':'Pay'}<ArrowRight size={17}/></button><button className="pp-button secondary" disabled={checking || paying || cancelling || (!transactionId && !orderId)} onClick={() => void check()}><RefreshCw size={16}/>Check again</button>{payment?.status === 'PENDING' && <button className="pp-button secondary" disabled={checking || paying || cancelling} onClick={() => void cancelPayment()}>{cancelling ? 'Cancelling…' : 'Cancel payment'}</button>}</div>{payment?.status === 'PENDING' && <p className="pp-caption">You can retry payment. The previous attempt will be verified and closed before a new one opens for the same order.</p>}
            </>}
          </div>
        </section>
        <div className="pp-assurances"><div><ShieldCheck/><strong>Verified information</strong><span>Verified payment results</span></div><div><Package/><strong>Equipment pickup</strong><span>Collect as specified in your order</span></div><div><Compass/><strong>Ready to explore</strong><span>Get ready for your adventure</span></div></div>
      </div>
      <aside className="pp-side"><section className="pp-card pp-summary"><div className="pp-summary-heading"><FileText size={20}/><h2>Payment summary</h2></div><dl><div><dt>Order</dt><dd>{orderId?`#${orderId}`:'—'}</dd></div><div><dt>Transaction</dt><dd>{(payment?.transaction_id || transactionId)?`#${payment?.transaction_id || transactionId}`:'—'}</dd></div><div><dt>Net amount paid</dt><dd>{order?vnd(order.paidAmount):'—'}</dd></div><div><dt>Amount due</dt><dd>{order?vnd(order.remainingAmount):'—'}</dd></div></dl><div className="pp-total"><span>ORDER TOTAL</span><strong>{order?vnd(order.totalAmount):'—'}</strong></div><Link className="pp-button" to="/orders"><FileText size={17}/>My Orders<ArrowRight size={17}/></Link><Link className="pp-button secondary" to="/shop"><ArrowLeft size={16}/>Continue exploring</Link><p className="pp-secure"><LockKeyhole size={13}/>Payment status verified by our system</p></section><section className="pp-card pp-branch"><div className="pp-summary-heading"><MapPin size={19}/><h2>Equipment pickup branch</h2></div><div className="pp-branch-art"><Compass size={68}/><span>YOUR NEXT ADVENTURE</span></div><div className="pp-body"><h3>{branch?.name || (order?`Branch #${order.branchId}`:'As specified in your order')}</h3><p>{branch?.address || 'Check branch details and confirm your equipment collection schedule.'}</p>{branch?.phone && <a className="pp-text-link" href={`tel:${branch.phone}`}>{branch.phone}</a>}{order && <Link className="pp-text-link" to={`/outposts/${order.branchId}`}>Branch details <ArrowRight size={15}/></Link>}</div></section><div className="pp-help"><Clock3 size={21}/><div><strong>Need help with your payment?</strong><p>If you were charged without confirmation, check the transaction before paying again.</p></div></div></aside>
    </div>
  </div>;
}
