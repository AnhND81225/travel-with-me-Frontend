import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { catalogApi, vnd, type Branch } from "../equipment/catalogApi";
import type { Order } from "./orderApi";
import { useAuth } from "../../hooks/useAuth";
import { Card, Button, Badge } from "../../components/ui";
import {
  ShoppingBag,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
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
  const signInUrl = `/login?returnTo=${encodeURIComponent(`/gear/${productId}`)}`;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const createdOrderId = createdOrder?.id ?? null;
  const [busy, setBusy] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"SALE" | "RENTAL">(
    sale !== null ? "SALE" : "RENTAL"
  );

  useEffect(() => {
    catalogApi<Branch[]>("/branches")
      .then((b) => setBranches(b.filter((x) => x.status === "ACTIVE")))
      .catch((e) => setMessage(e instanceof Error ? e.message : "Unable to load branches"));
  }, []);

  useEffect(() => { setCreatedOrder(null); setMessage(""); setIsSuccess(false); }, [productId]);

  return (
    <Card padding="md" className="bg-[#F8F6F1] border border-[#D8D2C5] font-label text-xs space-y-4">
      <div className="border-b border-[#D8D2C5] pb-3">
        <Badge variant="primary" className="mb-1">EXPEDITION DISPATCH</Badge>
        <h3 className="text-base font-bold text-[#111D16] font-headline">
          Buy or Rent at a Branch
        </h3>
        <p className="text-[11px] text-[#5C665F] font-body mt-0.5">
          Prices and availability are checked when you order. Rental charges include both pickup and return dates.
        </p>
      </div>

      <form
        className="space-y-3.5"
        onChange={() => {
          if (createdOrderId !== null) { setCreatedOrder(null); setMessage(""); setIsSuccess(false); }
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
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
              throw new Error("Please select valid pickup and return dates.");
            }

            if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "cart") {
              const cart = JSON.parse(
                sessionStorage.getItem("treektour.order.cart") || "[]"
              ) as { branchId: number; productId: number }[];
              const branchId = Number(data.get("branch"));

              if (cart.length > 0 && cart.some((x) => x.branchId !== branchId)) {
                throw new Error(
                  "Each cart belongs to one branch. Complete or clear your current cart first."
                );
              }
              if (cart.some((x) => x.productId === productId)) {
                throw new Error(
                  "This product is already in your cart. Open the cart to update its quantity."
                );
              }

              sessionStorage.setItem(
                "treektour.order.cart",
                JSON.stringify([...cart, { ...line, branchId }])
              );
              window.dispatchEvent(new Event("cart_updated"));
              setIsSuccess(true);
              setMessage("Equipment added to your cart.");
              return;
            }

            if (!isAuthenticated || !sessionStorage.getItem("treektour.catalog.token")) {
              setMessage("Please sign in to place an order. You can still add equipment to your cart.");
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
              `Đã tạo đơn #${order.id} · ${vnd(order.totalAmount)} · Chờ chi nhánh duyệt.`
            );
          } catch (error) {
            setIsSuccess(false);
            setMessage(error instanceof Error ? error.message : "Unable to create the order");
          } finally {
            setBusy(false);
          }
        }}
      >
        {/* Branch select */}
        <div className="space-y-1">
          <label className="font-bold text-[#111D16] uppercase text-[10px] block">
            Pickup branch *
          </label>
          <select
            name="branch"
            required
            className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
          >
            <option value="">-- Select an outpost --</option>
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
            Order type *
          </label>
          <select
            name="mode"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as "SALE" | "RENTAL")}
            className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
          >
            {sale !== null && <option value="SALE">Buy equipment · {vnd(sale)}</option>}
            {rental !== null && (
              <option value="RENTAL">Rent equipment · {vnd(rental)} / day</option>
            )}
          </select>
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <label className="font-bold text-[#111D16] uppercase text-[10px] block">
            Quantity *
          </label>
          <input
            name="quantity"
            type="number"
            min="1"
            max="100"
            defaultValue="1"
            required
            className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] font-mono-spec focus:outline-none focus:border-[#152A20]"
          />
        </div>

        {/* Rental Dates (if mode === RENTAL) */}
        {selectedMode === "RENTAL" && rental !== null && (
          <div className="grid grid-cols-2 gap-2.5 p-3 bg-white border border-[#D8D2C5] rounded-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#D97845] uppercase text-[10px] block">
                Pickup date
              </label>
              <input
                name="start"
                type="date"
                required
                className="w-full py-1.5 px-2 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-[11px] text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#D97845] uppercase text-[10px] block">
                Return date
              </label>
              <input
                name="end"
                type="date"
                required
                className="w-full py-1.5 px-2 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs text-[11px] text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-xs text-xs font-bold flex items-center justify-between gap-2 ${
              isSuccess
                ? "bg-[#E0EFE6] text-[#065F46] border border-[#ADCBBB]"
                : "bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{message}</span>
            </div>
            {isSuccess && (
              <Link to="/cart" className="underline hover:text-black shrink-0 font-bold">
                Mở giỏ hàng →
              </Link>
            )}
          </div>
        )}

        {!authLoading && !isAuthenticated && (
          <div role="status" className="p-3 border border-[#F1BA9B] bg-[#FFF8F3] text-[#9A4D22] rounded-xs">
            <p>Please sign in to place an order. You can still add equipment to your cart.</p>
            <Link to={signInUrl} className="font-bold underline">Sign in to continue →</Link>
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
            disabled={busy}
            icon={<PlusCircle className="w-4 h-4 text-[#D97845]" />}
          >
            Add to Cart
          </Button>

          <Button
            type={createdOrderId ? "button" : "submit"}
            onClick={createdOrderId ? () => navigate(`/payment/pending?orderId=${createdOrderId}`) : undefined}
            variant="primary"
            size="md"
            fullWidth
            disabled={busy || authLoading || !isAuthenticated}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {busy ? "Đang xử lý..." : authLoading ? "Đang kiểm tra đăng nhập..." : createdOrderId ? "Thanh toán" : "Đặt Ngay"}
          </Button>
        </div>

        {/* Quick Links */}
        <div className="flex items-center justify-between pt-2 border-t border-[#D8D2C5] text-[11px] text-[#5C665F]">
          <Link to="/cart" className="hover:text-[#111D16] font-bold underline">
            Open cart
          </Link>
          <Link to="/orders" className="hover:text-[#111D16] font-bold underline">
            My orders
          </Link>
          <Link to={signInUrl} className="hover:text-[#D97845]">
            Sign in
          </Link>
        </div>
      </form>
    </Card>
  );
}
