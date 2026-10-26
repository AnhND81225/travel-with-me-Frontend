import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { catalogApi, vnd, type Branch } from "../equipment/catalogApi";
import type { Order } from "./orderApi";
import { useAuth } from "../../hooks/useAuth";
import { useAppStore } from "../../store/useAppStore";
import { Card, Button, Badge } from "../../components/ui";
import {
  ShoppingBag,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  CreditCard,
} from "lucide-react";

export function OrderCheckout({
  productId,
  sale,
  rental,
}: {
  productId: number;
  sale: number | null;
  rental: number | null;
}) {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { setCartOpen } = useAppStore();

  const today = new Date();
  const minDate = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  const draft = new URLSearchParams(useLocation().search);
  const [branchId, setBranchId] = useState(draft.get("branch") || "");
  const [startDate, setStartDate] = useState(draft.get("start") || minDate);
  const [endDate, setEndDate] = useState(draft.get("end") || minDate);
  const [quantity, setQuantity] = useState(draft.get("quantity") || "1");
  const [retry, setRetry] = useState(0);
  const [availability, setAvailability] = useState<{ key: string; count?: number; error?: string } | null>(null);
  const [selectedMode, setSelectedMode] = useState<"SALE" | "RENTAL">(
    sale !== null ? "SALE" : "RENTAL"
  );
  const requestKey = [productId, branchId, selectedMode, selectedMode === "RENTAL" ? startDate : "", selectedMode === "RENTAL" ? endDate : "", retry].join("|");
  const dateError = !startDate || !endDate ? "Chọn đủ ngày nhận và ngày trả."
    : startDate < minDate ? "Ngày nhận phải từ hôm nay."
    : endDate < startDate ? "Ngày trả phải bằng hoặc sau ngày nhận." : "";
  const [branches, setBranches] = useState<Branch[]>([]);
  const signInUrl = "/login?returnTo=" + encodeURIComponent("/gear/" + productId + "?" + new URLSearchParams({ branch: branchId, start: startDate, end: endDate, quantity }));
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const createdOrderId = createdOrder?.id ?? null;
  const [busy, setBusy] = useState(false);


  useEffect(() => {
    catalogApi<Branch[]>("/branches")
      .then((b) => setBranches(b.filter((x) => x.status === "ACTIVE")))
      .catch((e) => setMessage(e instanceof Error ? e.message : "Unable to load branches"));
  }, []);

  useEffect(() => { setCreatedOrder(null); setMessage(""); setIsSuccess(false); }, [productId]);
  useEffect(() => {
    if (!branchId || (selectedMode === "RENTAL" && dateError)) return;
    const controller = new AbortController();
    let alive = true;
    const params = new URLSearchParams({ productId: String(productId), branchId });
    if (selectedMode === "RENTAL") { params.set("startDate", startDate); params.set("endDate", endDate); }
    const endpoint = selectedMode === "RENTAL" ? "/inventory/availability" : "/inventory/sale-availability";
    catalogApi<{ quantityRentable: number; quantityAvailable: number }>(endpoint + "?" + params, { signal: controller.signal })
      .then((value) => { if (alive) setAvailability({ key: requestKey, count: selectedMode === "RENTAL" ? value.quantityRentable : value.quantityAvailable }); })
      .catch((error) => { if (alive) setAvailability({ key: requestKey, error: error instanceof Error ? error.message : "Không tải được tồn kho." }); });
    return () => { alive = false; controller.abort(); };
  }, [productId, selectedMode, branchId, startDate, endDate, dateError, requestKey]);
  const current = availability?.key === requestKey ? availability : null;
  const canOrder = !!branchId && (selectedMode === "SALE" || !dateError) && !!current && !current.error &&
    Number.isInteger(Number(quantity)) && Number(quantity) > 0 && Number(quantity) <= (current.count ?? 0);
  const stockBlocked = !canOrder && createdOrderId === null;

  return (
    <Card padding="md" className="bg-[#F8F6F1] border border-[#D8D2C5] font-label text-xs space-y-4">
      <div className="border-b border-[#D8D2C5] pb-3">
        <Badge variant="primary" className="mb-1">EXPEDITION DISPATCH</Badge>
        <h3 className="text-base font-bold text-[#111D16] font-headline">
          Đặt Mua & Thuê Tại Trạm Outpost
        </h3>
        <p className="text-[11px] text-[#5C665F] font-body mt-0.5">
          Giá và tình trạng trang bị được kiểm tra thực tế khi tạo đơn. Thời gian thuê tính từ ngày nhận đến ngày hoàn trả tại trạm.
        </p>
      </div>

      <form
        className="space-y-3.5"
        onChange={() => {
          if (createdOrderId !== null) { setCreatedOrder(null); setMessage(""); setIsSuccess(false); }
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || stockBlocked) return;
          if (createdOrderId !== null && (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") !== "cart") {
            navigate(`/payment/pending?orderId=${createdOrderId}`);
            return;
          }
          const data = new FormData(e.currentTarget);
          setBusy(true);
          setMessage("");
          setIsSuccess(false);
          setCreatedOrder(null);

          try {
            const mode = String(data.get("mode"));
            const line = {
              productId,
              itemType: mode as "SALE" | "RENTAL",
              quantity: Number(data.get("quantity")),
              rentalStartDate: mode === "RENTAL" ? String(data.get("start")) : null,
              rentalEndDate: mode === "RENTAL" ? String(data.get("end")) : null,
            };

            if (
              mode === "RENTAL" &&
              (!line.rentalStartDate ||
                !line.rentalEndDate ||
                String(line.rentalEndDate) < String(line.rentalStartDate))
            ) {
              throw new Error("Vui lòng chọn ngày nhận và trả đồ hợp lệ.");
            }

            if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "cart") {
              const cart = JSON.parse(
                sessionStorage.getItem("treektour.order.cart") || "[]"
              ) as { branchId: number; productId: number }[];
              const branchId = Number(data.get("branch"));

              if (cart.length > 0 && cart.some((x) => x.branchId !== branchId)) {
                throw new Error(
                  "Mỗi giỏ hàng thuộc về một trạm Outpost. Vui lòng thanh toán hoặc xóa giỏ hàng hiện tại trước."
                );
              }
              if (cart.some((x) => x.productId === productId)) {
                throw new Error(
                  "Sản phẩm này đã có trong giỏ hàng. Bạn hãy mở giỏ hàng để cập nhật số lượng."
                );
              }

              sessionStorage.setItem(
                "treektour.order.cart",
                JSON.stringify([...cart, { ...line, branchId }])
              );
              window.dispatchEvent(new Event("cart_updated"));
              setIsSuccess(true);
              setMessage("Đã thêm trang bị vào giỏ hàng thành công.");
              setCartOpen(true);
              return;
            }

            if (!isAuthenticated || !sessionStorage.getItem("treektour.catalog.token")) {
              setMessage("Vui lòng đăng nhập tài khoản để đặt hàng và thanh toán trực tuyến.");
              return;
            }

            const order = await catalogApi<Order>("/orders", {
              method: "POST",
              body: JSON.stringify({
                branchId: Number(data.get("branch")),
                items: [line],
              }),
            });

            setIsSuccess(true);
            setCreatedOrder(order);
            setMessage(
              `Đã tạo đơn #${order.id} · ${vnd(order.totalAmount)} · Đang chuyển đến trang thanh toán...`
            );

            // Navigate directly to the payment page as requested!
            navigate(`/payment/pending?orderId=${order.id}`);
          } catch (error) {
            setIsSuccess(false);
            setRetry((v) => v + 1);
            setMessage(error instanceof Error ? error.message : "Không thể tạo đơn hàng.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {/* Branch select */}
        <div className="space-y-1">
          <label className="font-bold text-[#111D16] uppercase text-[10px] block">
            Trạm nhận trang bị (Pickup branch) *
          </label>
          <select
            name="branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}
            required
            className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
          >
            <option value="">-- Chọn trạm Outpost --</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mode select */}
        <div className="space-y-1">
          <label className="font-bold text-[#111D16] uppercase text-[10px] block">
            Hình thức (Order type) *
          </label>
          <select
            name="mode"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as "SALE" | "RENTAL")}
            className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
          >
            {sale !== null && <option value="SALE">Mua trang bị mới · {vnd(sale)}</option>}
            {rental !== null && (
              <option value="RENTAL">Thuê dã ngoại · {vnd(rental)} / ngày</option>
            )}
          </select>
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <label className="font-bold text-[#111D16] uppercase text-[10px] block">
            Số lượng *
          </label>
          <input
            name="quantity"
            type="number"
            min="1"
            max={current?.count}
            value={quantity} onInput={(e) => setQuantity(e.currentTarget.value)}
            required
            className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] font-mono-spec focus:outline-none focus:border-[#152A20]"
          />
        </div>

        {/* Rental Dates (if mode === RENTAL) */}
        {selectedMode === "RENTAL" && rental !== null && (
          <div className="grid grid-cols-2 gap-2.5 p-3 bg-white border border-[#D8D2C5] rounded-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#D97845] uppercase text-[10px] block">
                Ngày nhận đồ
              </label>
              <input
                name="start" min={minDate} value={startDate} onInput={(e) => { const next = e.currentTarget.value; setStartDate(next); if (endDate < next) setEndDate(next); }}
                type="date"
                required
                className="w-full py-1.5 px-2 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-[11px] text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#D97845] uppercase text-[10px] block">
                Ngày hoàn trả
              </label>
              <input
                name="end" min={startDate || minDate} value={endDate} onInput={(e) => setEndDate(e.currentTarget.value)}
                type="date"
                required
                className="w-full py-1.5 px-2 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-[11px] text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>
          </div>
        )}

        <div role="status" aria-live="polite" className="p-3 bg-white border border-[#D8D2C5] rounded-xs">
            {!branchId ? "Chọn chi nhánh nhận để xem số lượng có thể đặt."
              : selectedMode === "RENTAL" && dateError ? dateError : !current ? "Đang tải số lượng còn lại…"
              : current.error ? <>{current.error} <button type="button" onClick={() => setRetry((v) => v + 1)}>Thử lại</button></>
              : current.count === 0 ? (selectedMode === "SALE" ? "Hết hàng tại chi nhánh này." : "Hết thiết bị có thể thuê trong khoảng ngày này.")
              : <>{selectedMode === "SALE" ? "Còn lại có thể mua: " : "Có thể thuê: "}<strong>{current.count} thiết bị</strong>.
                {!canOrder && <p>Chọn số lượng từ 1 đến {current.count}.</p>}</>}
            <p className="mt-1 text-[11px]">Số lượng tự cập nhật theo chi nhánh và hình thức mua/thuê. Tra cứu chưa giữ chỗ.</p>
        </div>
        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-xs text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
              isSuccess
                ? "bg-[#E0EFE6] text-[#065F46] border border-[#ADCBBB]"
                : "bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]"
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#059669]" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              )}
              <span>{message}</span>
            </div>
            {isSuccess && (
              createdOrder ? (
                <Link
                  to={`/payment/pending?orderId=${createdOrder.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-white text-xs font-bold shrink-0 shadow-xs transition cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Thanh toán ngay</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="underline hover:text-black shrink-0 font-bold cursor-pointer"
                >
                  Mở giỏ hàng →
                </button>
              )
            )}
          </div>
        )}

        {!authLoading && !isAuthenticated && (
          <div role="status" className="p-3 border border-[#F1BA9B] bg-[#FFF8F3] text-[#9A4D22] rounded-xs space-y-1">
            <p>Vui lòng đăng nhập để tạo đơn và thanh toán trực tuyến. Bạn vẫn có thể thêm đồ vào giỏ hàng.</p>
            <Link to={signInUrl} className="font-bold underline block">Đăng nhập tài khoản →</Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            type="submit"
            name="action"
            value="cart"
            variant="secondary"
            size="md"
            fullWidth
            disabled={busy || stockBlocked}
            icon={<PlusCircle className="w-4 h-4 text-[#D97845]" />}
          >
            Thêm vào giỏ hàng
          </Button>

          <Button
            type={createdOrderId ? "button" : "submit"}
            name="action"
            value="buy_now"
            onClick={createdOrderId ? () => navigate(`/payment/pending?orderId=${createdOrderId}`) : undefined}
            variant="accent"
            size="md"
            fullWidth
            disabled={busy || stockBlocked || authLoading || !isAuthenticated}
            icon={<CreditCard className="w-4 h-4 text-white" />}
            style={{ backgroundColor: '#D97845', color: '#FFFFFF', borderColor: '#D97845' }}
            className="!bg-[#D97845] hover:!bg-[#C66735] !text-white font-bold shadow-xs cursor-pointer"
          >
            {busy ? "Đang xử lý..." : authLoading ? "Đang kiểm tra..." : createdOrderId ? `Thanh toán đơn #${createdOrderId}` : "Đặt Ngay & Thanh Toán"}
          </Button>
        </div>

        {/* Quick Links */}
        <div className="flex items-center justify-between pt-2 border-t border-[#D8D2C5] text-[11px] text-[#5C665F]">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="hover:text-[#111D16] font-bold underline cursor-pointer"
          >
            Mở giỏ hàng
          </button>
          <Link to="/orders" className="hover:text-[#111D16] font-bold underline">
            Đơn của tôi
          </Link>
          {!isAuthenticated && (
            <Link to={signInUrl} className="hover:text-[#D97845]">
              Đăng nhập
            </Link>
          )}
        </div>
      </form>
    </Card>
  );
}
