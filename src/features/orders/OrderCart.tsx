import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Calendar,
  Building,
  Trash2,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  RotateCcw,
  User,
  Info,
  Sparkles,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';
import { catalogApi, Branch, Product, vnd } from '../equipment/catalogApi';
import type { Order } from './orderApi';
import { useAuth } from '../../hooks/useAuth';

type CartLine = {
  branchId: number;
  productId: number;
  itemType: 'SALE' | 'RENTAL';
  quantity: number;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
};

const CART_KEY = 'treektour.order.cart';

function getRentalDays(start: string | null, end: string | null): number {
  if (!start || !end) return 1;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return 1;
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

export function OrderCart() {
  const navigate = useNavigate();
  const { account, isAuthenticated, loading: authLoading } = useAuth();

  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(CART_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState<Record<number, Product>>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Sync lines to sessionStorage
  const saveLines = (newLines: CartLine[]) => {
    setLines(newLines);
    if (newLines.length > 0) {
      sessionStorage.setItem(CART_KEY, JSON.stringify(newLines));
    } else {
      sessionStorage.removeItem(CART_KEY);
    }
    window.dispatchEvent(new Event('cart_updated'));
  };

  // Fetch branches once
  useEffect(() => {
    let alive = true;
    catalogApi<Branch[]>('/branches')
      .then((res) => {
        if (alive && Array.isArray(res)) {
          setBranches(res);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Fetch product details for all cart lines
  useEffect(() => {
    if (lines.length === 0) return;

    let alive = true;
    setLoadingProducts(true);

    const productIds = Array.from(new Set(lines.map((l) => l.productId)));
    Promise.allSettled(
      productIds.map((id) => catalogApi<Product>(`/products/${id}`))
    )
      .then((results) => {
        if (!alive) return;
        const map: Record<number, Product> = {};
        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value) {
            map[res.value.id] = res.value;
          }
        });
        setProducts(map);
      })
      .finally(() => {
        if (alive) setLoadingProducts(false);
      });

    return () => {
      alive = false;
    };
  }, [lines]);

  // Branch map
  const branchMap = useMemo(() => {
    const map = new Map<number, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  // Active branch for this cart batch
  const activeBranch = useMemo(() => {
    if (lines.length === 0) return null;
    return branchMap.get(lines[0].branchId) || null;
  }, [lines, branchMap]);

  // Adjust item quantity
  const handleUpdateQuantity = (index: number, delta: number) => {
    const target = lines[index];
    if (!target) return;

    const newQty = target.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    const next = [...lines];
    next[index] = { ...target, quantity: newQty };
    saveLines(next);
  };

  // Remove single line
  const handleRemoveItem = (index: number) => {
    const next = lines.filter((_, i) => i !== index);
    saveLines(next);
  };

  // Clear entire cart
  const handleClearCart = () => {
    saveLines([]);
  };

  // Submit checkout
  const handleCheckout = async () => {
    if (lines.length === 0) return;
    if (!isAuthenticated || !sessionStorage.getItem('treektour.catalog.token')) {
      setError('Please sign in to place an order. Your cart has been saved.');
      return;
    }
    setBusy(true);
    setError('');

    try {
      const order = await catalogApi<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          branchId: lines[0].branchId,
          items: lines,
        }),
      });

      setCreatedOrder(order);
      saveLines([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to complete your order');
    } finally {
      setBusy(false);
    }
  };

  // Price calculations
  const totals = useMemo(() => {
    let saleSubtotal = 0;
    let rentalSubtotal = 0;
    let totalItemsCount = 0;

    lines.forEach((line) => {
      const prod = products[line.productId];
      totalItemsCount += line.quantity;

      if (line.itemType === 'SALE') {
        const price = prod?.salePrice ?? 0;
        saleSubtotal += price * line.quantity;
      } else {
        const pricePerDay = prod?.rentalPricePerDay ?? 0;
        const days = getRentalDays(line.rentalStartDate, line.rentalEndDate);
        rentalSubtotal += pricePerDay * days * line.quantity;
      }
    });

    const grandTotal = saleSubtotal + rentalSubtotal;
    return { saleSubtotal, rentalSubtotal, totalItemsCount, grandTotal };
  }, [lines, products]);

  // 1. Success confirmation screen after checkout
  if (createdOrder) {
    const orderBranch = branchMap.get(createdOrder.branchId);

    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 font-label">
        <Card padding="lg" className="border-2 border-[#152A20] bg-[#F8F6F1] space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#E0EFE6] border-2 border-[#10B981] flex items-center justify-center mx-auto text-[#059669]">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <Badge variant="primary" className="bg-[#152A20] text-emerald-400">
              EXPEDITION MANIFEST CONFIRMED
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline">
              Order Placed · Order #{createdOrder.id}
            </h1>
            <p className="text-xs text-[#5C665F] max-w-lg mx-auto font-body">
              Your equipment order has been submitted. Complete payment before the branch can approve your order and arrange handover.
            </p>
          </div>

          {/* Quick Invoice Card */}
          <div className="bg-white border border-[#D8D2C5] rounded-xs p-5 max-w-lg mx-auto text-left text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#737C75]">Order ID:</span>
              <span className="font-bold font-headline text-sm text-[#111D16]">#{createdOrder.id}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#737C75]">Pickup branch:</span>
              <span className="font-bold text-[#111D16]">
                {orderBranch?.name || `Outpost #${createdOrder.branchId}`}
              </span>
            </div>
            {orderBranch?.address && (
              <div className="flex justify-between items-center border-b border-[#EBE6DC] pb-2.5">
                <span className="text-[#737C75]">Pickup address:</span>
                <span className="text-right text-[#5C665F] font-body max-w-xs">{orderBranch.address}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#737C75]">Created at:</span>
              <span className="font-mono-spec">
                {new Date(createdOrder.orderDate).toLocaleString('en-GB')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-bold text-[#111D16] uppercase">Order value:</span>
              <span className="text-lg font-bold text-[#D97845] font-headline">
                {vnd(createdOrder.totalAmount)}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs max-w-lg mx-auto text-left text-xs text-[#5C665F] space-y-1.5 font-body">
            <div className="font-bold text-[#D97845] flex items-center gap-1.5 font-label uppercase text-[11px]">
              <Info className="w-4 h-4 shrink-0" />
              Equipment pickup notes
            </div>
            <p>• Bring your national ID or passport when collecting your equipment.</p>
            <p>• For rentals, inspect the equipment with branch staff and sign the condition report before pickup.</p>
          </div>

          {/* Navigation CTA */}
          <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
            {createdOrder.status === 'PENDING' && createdOrder.paymentStatus !== 'PAID' && (
              <Link to={`/payment/pending?orderId=${createdOrder.id}`}>
                <Button variant="accent" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Continue to payment
                </Button>
              </Link>
            )}
            <Link to="/orders">
              <Button variant="primary" size="md" icon={<Package className="w-4 h-4" />}>
                View My Orders
              </Button>
            </Link>
            {account?.role === 'ADMIN' && (
              <Link to="/admin/orders">
                <Button variant="accent" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Manage Orders (Admin)
                </Button>
              </Link>
            )}
            <Link to="/shop">
              <Button variant="secondary" size="md">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  // 2. Empty Cart Screen
  if (lines.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 font-label">
        <div className="flex items-center gap-2 border-b border-[#D8D2C5] pb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#111D16] font-bold">
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <span className="text-[#A39B8D]">/</span>
          <span className="text-xs text-[#111D16] font-bold">Equipment cart</span>
        </div>

        <Card padding="lg" className="text-center py-16 space-y-4 bg-[#F8F6F1] border border-[#D8D2C5]">
          <div className="w-16 h-16 rounded-full bg-[#EBE6DC] border border-[#D8D2C5] flex items-center justify-center mx-auto text-[#737C75]">
            <ShoppingBag className="w-8 h-8 stroke-1" />
          </div>

          <div className="space-y-1.5">
            <Badge variant="neutral">EXPEDITION MANIFEST EMPTY</Badge>
            <h1 className="text-2xl font-bold text-[#111D16] font-headline">
              Your Equipment Cart Is Empty
            </h1>
            <p className="text-xs text-[#5C665F] max-w-md mx-auto font-body">
              You have not added any equipment yet. Explore our gear and prepare for your next trip.
            </p>
          </div>

          <div className="flex justify-center flex-wrap gap-3 pt-3">
            <Link to="/rent">
              <Button variant="accent" size="md" icon={<Calendar className="w-4 h-4" />}>
                Equipment Rentals
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="primary" size="md" icon={<ShoppingBag className="w-4 h-4" />}>
                Equipment Shop
              </Button>
            </Link>
            <Link to="/orders">
              <Button variant="secondary" size="md">
                Order History
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  // 3. Normal Cart View with items
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D2C5] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" className="bg-[#152A20] text-emerald-400">
              EQUIPMENT DISPATCH MANIFEST
            </Badge>
            <span className="text-xs text-[#5C665F] font-mono-spec">
              SYS // ORDER_CART
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline tracking-tight">
            Equipment Cart & Checkout
          </h1>
          <p className="text-xs text-[#5C665F] font-body mt-1">
            Review your equipment, quantities and rental dates before placing your order.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/shop">
            <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              Add more equipment
            </Button>
          </Link>
          <Link to="/orders">
            <Button variant="secondary" size="sm">
              My orders
            </Button>
          </Link>
          <Button
            variant="outlined"
            size="sm"
            onClick={handleClearCart}
            disabled={busy}
            icon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
          >
            Clear cart
          </Button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xs text-xs text-[#B91C1C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-xs font-bold underline hover:text-black cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Active Branch Depot Banner */}
      {activeBranch && (
        <div className="p-3.5 bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xs bg-[#152A20] text-emerald-400 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider">
                PICKUP BRANCH
              </div>
              <div className="font-bold text-sm text-[#111D16] font-headline">
                {activeBranch.name}
              </div>
              {activeBranch.address && (
                <div className="text-[11px] text-[#5C665F] flex items-center gap-1 mt-0.5 font-body">
                  <MapPin className="w-3 h-3 text-[#737C75]" />
                  <span>{activeBranch.address}</span>
                  {activeBranch.phone && (
                    <>
                      <span className="mx-1">•</span>
                      <Phone className="w-3 h-3 text-[#737C75]" />
                      <span>{activeBranch.phone}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-[#5C665F] sm:text-right font-body bg-white/60 p-2 rounded-xs border border-[#D8D2C5]/50">
            <span className="font-bold text-[#152A20] block font-label uppercase text-[10px]">
              PICKUP & RETURN
            </span>
            Collect and return equipment at this same outpost.
          </div>
        </div>
      )}

      {/* Main Grid: Cart Items (Left 8 cols) + Checkout Summary (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of items */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8D2C5] pb-2 text-xs text-[#737C75] font-bold uppercase">
            <span>EQUIPMENT LIST ({lines.length} ITEMS)</span>
            <span>ITEM TOTAL</span>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => {
              const prod = products[line.productId];
              const isRental = line.itemType === 'RENTAL';
              const days = isRental ? getRentalDays(line.rentalStartDate, line.rentalEndDate) : 1;
              const unitPrice = isRental ? (prod?.rentalPricePerDay ?? 0) : (prod?.salePrice ?? 0);
              const lineTotal = unitPrice * line.quantity * (isRental ? days : 1);

              return (
                <Card
                  key={`${line.productId}-${index}`}
                  padding="md"
                  className="bg-[#F8F6F1] border border-[#D8D2C5] hover:border-[#152A20] transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Item info */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xs bg-[#152A20] text-[#D97845] flex items-center justify-center shrink-0 border border-[#2B4E3C]">
                        <Package className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/gear/${line.productId}`}
                            className="font-bold text-sm text-[#111D16] font-headline hover:text-[#D97845] transition flex items-center gap-1"
                          >
                            <span>{prod?.name || `Product #${line.productId}`}</span>
                            <ExternalLink className="w-3 h-3 text-[#A39B8D]" />
                          </Link>

                          <Badge variant={isRental ? 'warning' : 'neutral'} size="sm">
                            {isRental ? 'RENTAL' : 'PURCHASE'}
                          </Badge>
                        </div>

                        <div className="text-[11px] text-[#5C665F] flex flex-wrap items-center gap-2">
                          <span>SKU: #{line.productId}</span>
                          {prod?.category && (
                            <>
                              <span>•</span>
                              <span>Category: {prod.category}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Unit price: {vnd(unitPrice)}{isRental && ' / day'}</span>
                        </div>

                        {/* Rental Date Range Badge */}
                        {isRental && line.rentalStartDate && line.rentalEndDate && (
                          <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-[10px] text-[#D97845] font-bold">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Rental dates: {line.rentalStartDate} → {line.rentalEndDate} ({days} days)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Line total price */}
                    <div className="sm:text-right shrink-0">
                      <div className="text-[10px] text-[#737C75] uppercase">Subtotal</div>
                      <div className="text-base font-bold text-[#152A20] font-headline">
                        {loadingProducts && !prod ? '...' : vnd(lineTotal)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Actions Bar */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#DDD7CB] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#737C75] font-bold uppercase">Quantity:</span>
                      <div className="flex items-center border border-[#D8D2C5] rounded-xs bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, -1)}
                          disabled={busy}
                          className="px-2 py-1 text-[#5C665F] hover:bg-[#EBE6DC] hover:text-[#111D16] transition cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 font-mono-spec font-bold text-xs text-[#111D16]">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, 1)}
                          disabled={busy}
                          className="px-2 py-1 text-[#5C665F] hover:bg-[#EBE6DC] hover:text-[#111D16] transition cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={busy}
                      className="text-xs text-[#B91C1C] hover:text-[#991B1B] font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove from cart</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Expedition Terms Note */}
          <div className="p-4 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-xs text-[#5C665F] space-y-2">
            <h4 className="font-bold text-[#111D16] flex items-center gap-1.5 uppercase text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#152A20]" />
              TerraPeak Equipment Safety Standards
            </h4>
            <p className="font-body text-[11px] leading-relaxed">
              Inspect your equipment with branch staff at pickup and review its condition before signing the handover record.
            </p>
          </div>
        </div>

        {/* Right Column: Checkout Summary Sidebar */}
        <div className="lg:col-span-4 space-y-4 sticky top-6">
          <Card padding="md" className="bg-white border-2 border-[#152A20] space-y-4 shadow-sm">
            <div className="border-b border-[#D8D2C5] pb-3">
              <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider block">
                MANIFEST FINANCIALS
              </span>
              <h3 className="text-base font-bold text-[#111D16] font-headline mt-0.5">
                Order Summary
              </h3>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2.5 text-xs">
              {totals.saleSubtotal > 0 && (
                <div className="flex justify-between items-center text-[#5C665F]">
                  <span>Buy equipment ({lines.filter((l) => l.itemType === 'SALE').length} items):</span>
                  <span className="font-mono-spec font-bold text-[#111D16]">
                    {vnd(totals.saleSubtotal)}
                  </span>
                </div>
              )}

              {totals.rentalSubtotal > 0 && (
                <div className="flex justify-between items-center text-[#5C665F]">
                  <span>Rent equipment ({lines.filter((l) => l.itemType === 'RENTAL').length} items):</span>
                  <span className="font-mono-spec font-bold text-[#111D16]">
                    {vnd(totals.rentalSubtotal)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#5C665F]">
                <span>Inspection & sanitization:</span>
                <span className="font-bold text-emerald-600 uppercase text-[10px]">
                  Free
                </span>
              </div>

              <div className="flex justify-between items-center text-[#5C665F]">
                <span>Trail emergency support:</span>
                <span className="font-bold text-[#152A20] text-[10px]">
                  Included
                </span>
              </div>

              <div className="border-t border-[#D8D2C5] pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-[#111D16] uppercase block">
                    ORDER TOTAL:
                  </span>
                  <span className="text-[10px] text-[#737C75]">
                    ({totals.totalItemsCount} equipment items)
                  </span>
                </div>
                <div className="text-xl font-bold text-[#D97845] font-headline">
                  {vnd(totals.grandTotal)}
                </div>
              </div>
            </div>

            {/* Account Status / Login reminder */}
            {authLoading ? <p role="status">Checking sign-in...</p> : isAuthenticated && account ? (
              <div className="p-2.5 bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs text-[11px] text-[#152A20] space-y-0.5">
                <span className="font-bold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  {account.fullName}
                </span>
                <span className="text-[#5C665F] block font-mono-spec text-[10px]">
                  {account.email || account.phone || 'Climber Verified'}
                </span>
              </div>
            ) : (
              <div role="status" className="p-2.5 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-[11px] text-[#D97845] space-y-1">
                <span>Please sign in to place an order. Your cart will be kept while you sign in.</span>
                <Link
                  to="/login?returnTo=/cart"
                  className="font-bold underline block hover:text-[#C66735]"
                >
                  Sign in now →
                </Link>
              </div>
            )}

            {/* Checkout Action Button */}
            <Button
              variant="accent"
              size="lg"
              fullWidth
              disabled={busy || authLoading || !isAuthenticated || lines.length === 0}
              onClick={() => void handleCheckout()}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {busy ? 'Placing order...' : 'Place Order'}
            </Button>

            <p className="text-[10px] text-[#737C75] text-center font-body">
              After placing your order, complete payment so branch staff can approve it and prepare your equipment.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
