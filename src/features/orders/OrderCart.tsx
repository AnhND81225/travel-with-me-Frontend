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
  Compass,
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';
import { catalogApi, Branch, Product, vnd } from '../equipment/catalogApi';
import { CustomerContactSummary, getCustomerContact, contactError } from './customerContact';
import type { Order, DeliveryType } from './orderApi';
import { DeliveryDestinationSelector } from './DeliveryDestinationSelector';
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
const DELIVERY_KEY = 'treektour.order.delivery';

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
  const contact = getCustomerContact(account);

  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(CART_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [deliveryPref, setDeliveryPref] = useState<{
    deliveryType: DeliveryType;
    scheduleId: number | null;
    deliveryLocation: string;
    deliveryNotes: string;
  }>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(DELIVERY_KEY) || '{}');
      return {
        deliveryType: (stored.deliveryType as DeliveryType) || 'STORE_PICKUP',
        scheduleId: stored.scheduleId || null,
        deliveryLocation: stored.deliveryLocation || '',
        deliveryNotes: stored.deliveryNotes || '',
      };
    } catch {
      return {
        deliveryType: 'STORE_PICKUP',
        scheduleId: null,
        deliveryLocation: '',
        deliveryNotes: '',
      };
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
      sessionStorage.removeItem(DELIVERY_KEY);
    }
    window.dispatchEvent(new Event('cart_updated'));
  };

  // Fetch branches once
  useEffect(() => {
    let alive = true;
    catalogApi<Branch[]>('/branches')
      .then((res) => {
        if (alive && Array.isArray(res)) {
          setBranches(res.filter((x) => x.status === 'ACTIVE'));
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
  const currentBranchId = lines.length > 0 ? lines[0].branchId : (branches[0]?.id ?? '');
  const activeBranch = useMemo(() => {
    if (!currentBranchId) return null;
    return branchMap.get(Number(currentBranchId)) || null;
  }, [currentBranchId, branchMap]);

  // Handle Delivery Choice Change
  const handleDeliveryChange = (next: {
    deliveryType: DeliveryType;
    branchId: number | '';
    scheduleId?: number | null;
    deliveryLocation?: string;
    deliveryNotes?: string;
    rentalStartDate?: string;
    rentalEndDate?: string;
  }) => {
    const newPref = {
      deliveryType: next.deliveryType,
      scheduleId: next.scheduleId ?? null,
      deliveryLocation: next.deliveryLocation || '',
      deliveryNotes: next.deliveryNotes !== undefined ? next.deliveryNotes : deliveryPref.deliveryNotes,
    };
    setDeliveryPref(newPref);
    sessionStorage.setItem(DELIVERY_KEY, JSON.stringify(newPref));

    // Update lines branch and rental dates if provided
    if (lines.length > 0 && next.branchId) {
      const updatedLines = lines.map((l) => {
        const item: CartLine = { ...l, branchId: Number(next.branchId) };
        if (l.itemType === 'RENTAL' && next.rentalStartDate && next.rentalEndDate) {
          item.rentalStartDate = next.rentalStartDate;
          item.rentalEndDate = next.rentalEndDate;
        }
        return item;
      });
      saveLines(updatedLines);
    }
  };

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
      setError('Vui lòng đăng nhập để hoàn tất đơn hàng. Giỏ hàng của bạn đã được lưu.');
      return;
    }
    if (deliveryPref.deliveryType === 'TOUR_DELIVERY' && !deliveryPref.scheduleId) {
      setError('Vui lòng chọn tour bạn tham gia để nhân viên bàn giao thiết bị.');
      return;
    }
    const invalidContact = contactError(contact.value);
    if (invalidContact) {
      setError(invalidContact);
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
          deliveryType: deliveryPref.deliveryType,
          scheduleId: deliveryPref.deliveryType === 'TOUR_DELIVERY' ? deliveryPref.scheduleId : null,
          deliveryLocation: deliveryPref.deliveryType === 'TOUR_DELIVERY' ? deliveryPref.deliveryLocation : null,
          deliveryNotes: deliveryPref.deliveryNotes || null,
        }),
      });

      setCreatedOrder(order);
      saveLines([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể hoàn tất đơn hàng');
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
    const isTourDelivery = createdOrder.deliveryType === 'TOUR_DELIVERY';

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
              Đặt Hàng Thành Công · Đơn #{createdOrder.id}
            </h1>
            <p className="text-xs text-[#5C665F] max-w-lg mx-auto font-body">
              Đơn hàng thiết bị của bạn đã được ghi nhận. Vui lòng hoàn tất thanh toán để ban quản lý duyệt đơn và chuẩn bị bàn giao.
            </p>
          </div>

          {/* Quick Invoice Card */}
          <div className="bg-white border border-[#D8D2C5] rounded-xs p-5 max-w-lg mx-auto text-left text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#737C75]">Mã đơn hàng:</span>
              <span className="font-bold font-headline text-sm text-[#111D16]">#{createdOrder.id}</span>
            </div>

            <div className="flex justify-between items-center border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#737C75]">Phương thức nhận:</span>
              <span className="font-bold text-[#152A20] flex items-center gap-1">
                {isTourDelivery ? (
                  <>
                    <Compass className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="text-[#059669]">Bàn giao tại Tour</span>
                  </>
                ) : (
                  <>
                    <Building className="w-3.5 h-3.5 text-[#152A20]" />
                    <span>Nhận tại Outpost</span>
                  </>
                )}
              </span>
            </div>

            {isTourDelivery && createdOrder.deliveryLocation && (
              <div className="flex justify-between items-start border-b border-[#EBE6DC] pb-2.5">
                <span className="text-[#737C75] shrink-0">Điểm hẹn bàn giao:</span>
                <span className="text-right text-[#15803D] font-bold max-w-xs">
                  {createdOrder.deliveryLocation}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#737C75]">Chi nhánh phụ trách:</span>
              <span className="font-bold text-[#111D16]">
                {orderBranch?.name || `Outpost #${createdOrder.branchId}`}
              </span>
            </div>

            {createdOrder.deliveryNotes && (
              <div className="flex justify-between items-start border-b border-[#EBE6DC] pb-2.5">
                <span className="text-[#737C75] shrink-0">Ghi chú của bạn:</span>
                <span className="text-right text-[#5C665F] font-body max-w-xs">
                  {createdOrder.deliveryNotes}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#737C75]">Thời gian tạo:</span>
              <span className="font-mono-spec">
                {new Date(createdOrder.orderDate).toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-bold text-[#111D16] uppercase">Tổng giá trị:</span>
              <span className="text-lg font-bold text-[#D97845] font-headline">
                {vnd(createdOrder.totalAmount)}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs max-w-lg mx-auto text-left text-xs text-[#5C665F] space-y-1.5 font-body">
            <div className="font-bold text-[#D97845] flex items-center gap-1.5 font-label uppercase text-[11px]">
              <Info className="w-4 h-4 shrink-0" />
              Lưu ý bàn giao thiết bị
            </div>
            {isTourDelivery ? (
              <>
                <p>• Hướng dẫn viên / ban tổ chức tour sẽ mang đồ đến điểm tập kết xuất phát của tour.</p>
                <p>• Vui lòng có mặt đúng giờ hẹn và đối chiếu mã đơn #{createdOrder.id} để nhận thiết bị.</p>
              </>
            ) : (
              <>
                <p>• Vui lòng mang theo CMND/CCCD hoặc Hộ chiếu khi đến nhận thiết bị tại Outpost.</p>
                <p>• Đối với đồ thuê, bạn sẽ cùng nhân viên kiểm tra tình trạng và ký biên bản giao nhận.</p>
              </>
            )}
          </div>

          {/* Navigation CTA */}
          <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
            {createdOrder.status === 'PENDING' && createdOrder.paymentStatus !== 'PAID' && (
              <Link to={`/payment/pending?orderId=${createdOrder.id}`}>
                <Button variant="accent" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Tiếp tục thanh toán
                </Button>
              </Link>
            )}
            <Link to="/orders">
              <Button variant="primary" size="md" icon={<Package className="w-4 h-4" />}>
                Xem Đơn Hàng Của Tôi
              </Button>
            </Link>
            {account?.role === 'ADMIN' && (
              <Link to="/admin/orders">
                <Button variant="accent" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Quản lý đơn (Admin)
                </Button>
              </Link>
            )}
            <Link to="/shop">
              <Button variant="secondary" size="md">
                Tiếp tục mua sắm
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
        <Card padding="lg" className="border border-[#D8D2C5] bg-[#F8F6F1] text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-[#EBE6DC] text-[#737C75] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111D16] font-headline">
              Giỏ hàng của bạn đang trống
            </h1>
            <p className="text-xs text-[#5C665F] font-body max-w-md mx-auto">
              Bạn chưa có trang thiết bị nào trong danh mục chuẩn bị chuyến đi. Hãy khám phá kho thiết bị thám hiểm của chúng tôi.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/shop">
              <Button variant="accent" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                Khám phá kho thiết bị
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  // 3. Cart with items
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D2C5] pb-4">
        <div>
          <Badge variant="primary" className="mb-1">
            EXPEDITION MANIFEST
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline">
            Giỏ Hàng & Điểm Nhận Thiết Bị
          </h1>
          <p className="text-xs text-[#5C665F] font-body mt-0.5">
            Xem lại thiết bị chuẩn bị cho chuyến đi, chọn nhận tại chi nhánh Outpost hoặc giao tại tour bạn đã đặt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/shop">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Thêm thiết bị khác
            </Button>
          </Link>
          <Button
            variant="outlined"
            size="sm"
            onClick={handleClearCart}
            disabled={busy}
            icon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
          >
            Làm trống giỏ
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
            Đóng
          </button>
        </div>
      )}

      {/* Fulfillment / Delivery Destination Selector */}
      <Card padding="md" className="bg-[#F8F6F1] border border-[#D8D2C5] shadow-xs">
        <DeliveryDestinationSelector
          deliveryType={deliveryPref.deliveryType}
          branchId={currentBranchId}
          scheduleId={deliveryPref.scheduleId}
          deliveryNotes={deliveryPref.deliveryNotes}
          branches={branches}
          isAuthenticated={isAuthenticated}
          onDeliveryChange={handleDeliveryChange}
        />
      </Card>

      {/* Main Grid: Cart Items (Left 8 cols) + Checkout Summary (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of items */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8D2C5] pb-2 text-xs text-[#737C75] font-bold uppercase">
            <span>DANH SÁCH THIẾT BỊ ({lines.length} MÓN)</span>
            <span>TỔNG TIỀN</span>
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
                            {isRental ? 'THUÊ THEO NGÀY' : 'MUA MỚI'}
                          </Badge>
                        </div>

                        <div className="text-[11px] text-[#5C665F] flex flex-wrap items-center gap-2">
                          <span>Mã: #{line.productId}</span>
                          {prod?.category && (
                            <>
                              <span>•</span>
                              <span>Danh mục: {prod.category}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Đơn giá: {vnd(unitPrice)}{isRental && ' / ngày'}</span>
                        </div>

                        {/* Rental Date Range Badge */}
                        {isRental && line.rentalStartDate && line.rentalEndDate && (
                          <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-[10px] text-[#D97845] font-bold">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Thời gian thuê: {line.rentalStartDate} → {line.rentalEndDate} ({days} ngày)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Line total price */}
                    <div className="sm:text-right shrink-0">
                      <div className="text-[10px] text-[#737C75] uppercase">Tạm tính</div>
                      <div className="text-base font-bold text-[#152A20] font-headline">
                        {loadingProducts && !prod ? '...' : vnd(lineTotal)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Actions Bar */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#DDD7CB] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#737C75] font-bold uppercase">Số lượng:</span>
                      <div className="flex items-center border border-[#D8D2C5] rounded-xs bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, -1)}
                          disabled={busy}
                          className="px-2 py-1 text-[#5C665F] hover:bg-[#EBE6DC] hover:text-[#111D16] transition cursor-pointer"
                          title="Giảm số lượng"
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
                          title="Tăng số lượng"
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
                      <span>Xóa khỏi giỏ</span>
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
              Tiêu Chuẩn Thiết Bị & Khử Khuẩn TerraPeak
            </h4>
            <p className="font-body text-[11px] leading-relaxed">
              Mọi thiết bị thám hiểm đều được kiểm tra kỹ thuật và tiệt trùng trước khi giao. Quý khách vui lòng kiểm tra cùng nhân viên / hướng dẫn viên khi nhận đồ.
            </p>
          </div>
        </div>

        {/* Right Column: Checkout Summary Sidebar */}
        <div className="lg:col-span-4 space-y-4 sticky top-6">
          <Card padding="md" className="bg-white border-2 border-[#152A20] space-y-4 shadow-sm">
            <div className="border-b border-[#D8D2C5] pb-3">
              <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider block">
                TÓM TẮT ĐƠN HÀNG
              </span>
              <h3 className="text-base font-bold text-[#111D16] font-headline mt-0.5">
                Chi Tiết Thanh Toán
              </h3>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2.5 text-xs">
              {totals.saleSubtotal > 0 && (
                <div className="flex justify-between items-center text-[#5C665F]">
                  <span>Mua thiết bị ({lines.filter((l) => l.itemType === 'SALE').length} món):</span>
                  <span className="font-mono-spec font-bold text-[#111D16]">
                    {vnd(totals.saleSubtotal)}
                  </span>
                </div>
              )}

              {totals.rentalSubtotal > 0 && (
                <div className="flex justify-between items-center text-[#5C665F]">
                  <span>Thuê thiết bị ({lines.filter((l) => l.itemType === 'RENTAL').length} món):</span>
                  <span className="font-mono-spec font-bold text-[#111D16]">
                    {vnd(totals.rentalSubtotal)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#5C665F]">
                <span>Kiểm tra & khử trùng:</span>
                <span className="font-bold text-emerald-600 uppercase text-[10px]">
                  Miễn phí
                </span>
              </div>

              <div className="flex justify-between items-center text-[#5C665F]">
                <span>Hỗ trợ cứu hộ trail:</span>
                <span className="font-bold text-[#152A20] text-[10px]">
                  Bao gồm
                </span>
              </div>

              <div className="border-t border-[#D8D2C5] pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-[#111D16] uppercase block">
                    TỔNG CỘNG:
                  </span>
                  <span className="text-[10px] text-[#737C75]">
                    ({totals.totalItemsCount} món đồ)
                  </span>
                </div>
                <div className="text-xl font-bold text-[#D97845] font-headline">
                  {vnd(totals.grandTotal)}
                </div>
              </div>
            </div>

            {/* Account Status / Login reminder */}
            {authLoading ? (
              <p role="status">Đang kiểm tra đăng nhập...</p>
            ) : isAuthenticated && account ? (
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
              <div
                role="status"
                className="p-2.5 bg-[#FFF8F3] border border-[#F1BA9B] rounded-xs text-[11px] text-[#D97845] space-y-1"
              >
                <span>Vui lòng đăng nhập để tiến hành đặt hàng.</span>
                <Link
                  to="/login?returnTo=/cart"
                  className="font-bold underline block hover:text-[#C66735]"
                >
                  Đăng nhập ngay →
                </Link>
              </div>
            )}

            <CustomerContactSummary contact={contact} />

            {/* Checkout Action Button */}
            <Button
              variant="accent"
              size="lg"
              fullWidth
              disabled={
                busy ||
                authLoading ||
                !isAuthenticated ||
                lines.length === 0 ||
                (deliveryPref.deliveryType === 'TOUR_DELIVERY' && !deliveryPref.scheduleId) ||
                !!contactError(contact.value)
              }
              onClick={() => void handleCheckout()}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {busy ? 'Đang tạo đơn...' : 'Đặt Hàng & Thanh Toán'}
            </Button>

            <p className="text-[10px] text-[#737C75] text-center font-body">
              Sau khi đặt hàng, bạn sẽ thanh toán trực tuyến để ban quản lý duyệt đơn và chuẩn bị thiết bị.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
