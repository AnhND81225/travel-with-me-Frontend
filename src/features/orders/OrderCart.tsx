import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalogApi, vnd, type Product } from "../equipment/catalogApi";
import type { Order } from "./orderApi";

type Line = { branchId: number; productId: number; itemType: "SALE" | "RENTAL"; quantity: number; rentalStartDate: string | null; rentalEndDate: string | null };
const key = "treektour.order.cart";
export function OrderCart() {
  const [lines, setLines] = useState<Line[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(key) || "[]"); } catch { return []; }
  });
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Order | null>(null);
  useEffect(() => {
    Promise.all(lines.map(line => catalogApi<Product>(`/products/${line.productId}`)))
      .then(rows => setProducts(Object.fromEntries(rows.map(row => [row.id, row]))))
      .catch(e => setError(e.message));
  }, [lines]);
  function remove(index: number) {
    const next = lines.filter((_, i) => i !== index); setLines(next); sessionStorage.setItem(key, JSON.stringify(next));
  }
  async function checkout() {
    setBusy(true); setError("");
    try {
      const order = await catalogApi<Order>("/orders", { method: "POST", body: JSON.stringify({ branchId: lines[0].branchId, items: lines }) });
      setCreated(order); setLines([]); sessionStorage.removeItem(key);
    } catch (e) { setError(e instanceof Error ? e.message : "Không đặt được đơn"); }
    finally { setBusy(false); }
  }
  return <main className="store-container py-8">
    <h1 className="text-2xl mb-4">Giỏ thiết bị</h1>
    <Link to="/shop">Chọn thêm thiết bị</Link> · <Link to="/orders">Đơn hàng của tôi</Link>
    {error && <p role="alert" className="customer-notice">{error}</p>}
    {created && <p role="status" className="customer-notice">Đã tạo đơn #{created.id} · {vnd(created.totalAmount)} · Chờ xác nhận thủ công tại chi nhánh.</p>}
    {!lines.length && !created && <p className="my-4">Giỏ hàng trống.</p>}
    {lines.map((line, index) => <article className="border p-4 my-4" key={line.productId}>
      <Link to={`/gear/${line.productId}`}>{products[line.productId]?.name || `Thiết bị #${line.productId}`}</Link>
      <p>{line.itemType === "SALE" ? "Mua" : "Thuê"} · {line.quantity} thiết bị · Chi nhánh #{line.branchId}</p>
      {line.itemType === "RENTAL" && <p>{line.rentalStartDate} → {line.rentalEndDate}</p>}
      <button disabled={busy} onClick={() => remove(index)}>Xóa</button>
    </article>)}
    {lines.length > 0 && <><p>Giá và tồn kho được xác nhận khi đặt đơn. Nhận và trả tại cùng chi nhánh.</p><button className="store-button my-4" disabled={busy} onClick={() => void checkout()}>{busy ? "Đang đặt…" : "Xác nhận đặt đơn"}</button><Link to="/login?returnTo=/cart">Đăng nhập</Link></>}
  </main>;
}
