import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { catalogApi, vnd, type Branch } from "../equipment/catalogApi";
import type { Order } from "./orderApi";
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
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"SALE" | "RENTAL">(
    sale !== null ? "SALE" : "RENTAL"
  );

  useEffect(() => {
    catalogApi<Branch[]>("/branches")
      .then((b) => setBranches(b.filter((x) => x.status === "ACTIVE")))
      .catch((e) => setMessage(e instanceof Error ? e.message : "Không tải được danh sách chi nhánh"));
  }, []);

  useEffect(() => { setCreatedOrderId(null); setMessage(""); setIsSuccess(false); }, [productId]);

  return (
    <Card padding="md" className="bg-[#F8F6F1] border border-[#D8D2C5] font-label text-xs space-y-4">
      <div className="border-b border-[#D8D2C5] pb-3">
        <Badge variant="primary" className="mb-1">EXPEDITION DISPATCH</Badge>
        <h3 className="text-base font-bold text-[#111D16] font-headline">
          Đặt Mua & Thuê Tại Chi Nhánh
        </h3>
        <p className="text-[11px] text-[#5C665F] font-body mt-0.5">
          Giá và số lượng tồn khả dụng sẽ được đối soát tự động khi đặt. Thuê tính đủ ngày nhận và trả đồ.
        </p>
      </div>

      <form
        className="space-y-3.5"
        onChange={() => {
          if (createdOrderId !== null) { setCreatedOrderId(null); setMessage(""); setIsSuccess(false); }
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
              throw new Error("Vui lòng chọn ngày nhận và ngày trả hợp lệ.");
            }

            if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "cart") {
              const cart = JSON.parse(
                sessionStorage.getItem("treektour.order.cart") || "[]"
              ) as { branchId: number; productId: number }[];
              const branchId = Number(data.get("branch"));

              if (cart.length > 0 && cart.some((x) => x.branchId !== branchId)) {
                throw new Error(
                  "Mỗi giỏ hàng thuộc về một chi nhánh trạm. Vui lòng hoàn tất hoặc xóa giỏ hàng hiện tại trước."
                );
              }
              if (cart.some((x) => x.productId === productId)) {
                throw new Error(
                  "Thiết bị này đã có trong giỏ hàng. Mở giỏ hàng để cập nhật số lượng."
                );
              }

              sessionStorage.setItem(
                "treektour.order.cart",
                JSON.stringify([...cart, { ...line, branchId }])
              );
              window.dispatchEvent(new Event("cart_updated"));
              setIsSuccess(true);
              setMessage("Đã thêm thiết bị vào giỏ hàng thành công!");
              return;
            }

            const order = await catalogApi<Order>("/orders", {
              method: "POST",
              body: JSON.stringify({
                branchId: Number(data.get("branch")),
                items: [line],
              }),
            });

            setCreatedOrderId(order.id);
            setIsSuccess(true);
            setMessage(
              `Đã tạo đơn #${order.id} · ${vnd(order.totalAmount)} · Chờ chi nhánh duyệt.`
            );
          } catch (error) {
            setIsSuccess(false);
            setMessage(error instanceof Error ? error.message : "Không tạo được đơn");
          } finally {
            setBusy(false);
          }
        }}
      >
        {/* Branch select */}
        <div className="space-y-1">
          <label className="font-bold text-[#111D16] uppercase text-[10px] block">
            Chi nhánh nhận trang bị *
          </label>
          <select
            name="branch"
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
            Hình thức *
          </label>
          <select
            name="mode"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as "SALE" | "RENTAL")}
            className="w-full py-2 px-3 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
          >
            {sale !== null && <option value="SALE">Mua trang bị · {vnd(sale)}</option>}
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
                Ngày nhận đồ
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
                Ngày hoàn trả
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
            Thêm Vào Giỏ
          </Button>

          <Button
            type={createdOrderId ? "button" : "submit"}
            onClick={createdOrderId ? () => navigate(`/payment/pending?orderId=${createdOrderId}`) : undefined}
            variant="primary"
            size="md"
            fullWidth
            disabled={busy}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {busy ? "Đang xử lý..." : createdOrderId ? "Thanh toán" : "Đặt Ngay"}
          </Button>
        </div>

        {/* Quick Links */}
        <div className="flex items-center justify-between pt-2 border-t border-[#D8D2C5] text-[11px] text-[#5C665F]">
          <Link to="/cart" className="hover:text-[#111D16] font-bold underline">
            Mở giỏ hàng
          </Link>
          <Link to="/orders" className="hover:text-[#111D16] font-bold underline">
            Xem đơn của tôi
          </Link>
          <Link to="/login?returnTo=/cart" className="hover:text-[#D97845]">
            Đăng nhập tài khoản
          </Link>
        </div>
      </form>
    </Card>
  );
}
