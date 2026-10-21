import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalogApi, vnd, type Branch } from "../equipment/catalogApi";
import type { Order } from "./orderApi";

export function OrderCheckout({ productId, sale, rental }: { productId: number; sale: number | null; rental: number | null }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { catalogApi<Branch[]>("/branches").then(b => setBranches(b.filter(x => x.status === "ACTIVE"))).catch(e => setMessage(e.message)); }, []);
  return <form className="eq-panel eq-form" onSubmit={async e => {
    e.preventDefault(); const data = new FormData(e.currentTarget); setBusy(true); setMessage("");
    try {
      const mode = String(data.get("mode"));
      const line = { productId, itemType: mode, quantity: Number(data.get("quantity")),
        rentalStartDate: mode === "RENTAL" ? data.get("start") : null,
        rentalEndDate: mode === "RENTAL" ? data.get("end") : null };
      if (mode === "RENTAL" && (!line.rentalStartDate || !line.rentalEndDate || String(line.rentalEndDate) < String(line.rentalStartDate)))
        throw new Error("Chọn ngày nhận và ngày trả hợp lệ.");
      if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "cart") {
        const cart = JSON.parse(sessionStorage.getItem("treektour.order.cart") || "[]") as { branchId: number; productId: number }[];
        const branchId = Number(data.get("branch"));
        if (cart.some(x => x.branchId !== branchId)) throw new Error("Mỗi giỏ hàng thuộc một chi nhánh. Hoàn tất hoặc xóa giỏ hiện tại trước.");
        if (cart.some(x => x.productId === productId)) throw new Error("Thiết bị đã có trong giỏ. Xóa dòng cũ để thay đổi số lượng.");
        sessionStorage.setItem("treektour.order.cart", JSON.stringify([...cart, { ...line, branchId }]));
        setMessage("Đã thêm vào giỏ hàng."); return;
      }
      const order = await catalogApi<Order>("/orders", { method: "POST", body: JSON.stringify({
        branchId: Number(data.get("branch")), items: [line]
      }) });
      setMessage(`Đã tạo đơn #${order.id} · ${vnd(order.totalAmount)} · Chờ xác nhận tại chi nhánh.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không tạo được đơn"); }
    finally { setBusy(false); }
  }}>
    <h2>Đặt mua / thuê tại chi nhánh</h2>
    <p>Giá và lượng có thể thuê được kiểm tra lại khi đặt. Thuê tính cả ngày nhận và ngày trả.</p>
    <label>Chi nhánh<select name="branch" required><option value="">Chọn chi nhánh</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    <label>Hình thức<select name="mode">{sale !== null && <option value="SALE">Mua · {vnd(sale)}</option>}{rental !== null && <option value="RENTAL">Thuê · {vnd(rental)}/ngày</option>}</select></label>
    <label>Số lượng<input name="quantity" type="number" min="1" max="1000" defaultValue="1" required /></label>
    {rental !== null && <><label>Ngày nhận (khi thuê)<input name="start" type="date" /></label><label>Ngày trả (khi thuê)<input name="end" type="date" /></label></>}
    <button className="eq-primary" disabled={busy}>{busy ? "Đang đặt…" : "Đặt đơn"}</button>
    <button name="action" value="cart" disabled={busy}>Thêm vào giỏ</button>
    {message && <p role="status">{message}</p>}
    <Link to="/cart">Mở giỏ hàng</Link><Link to="/orders">Xem đơn của tôi</Link><Link to="/login?returnTo=/orders">Đăng nhập để đặt đơn</Link>
  </form>;
}
