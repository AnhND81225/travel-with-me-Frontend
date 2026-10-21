import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalogApi, vnd } from "../../features/equipment/catalogApi";
import type { Order } from "../../features/orders/orderApi";

export function MyOrdersPage({ operations = false }: { operations?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  async function load() {
    setError(""); setLoading(true);
    try { setOrders(await catalogApi<Order[]>(operations ? "/orders" : "/orders/me")); }
    catch (e) { setError(e instanceof Error ? e.message : "Không tải được đơn hàng"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [operations]);
  async function act(id: number, action: string) {
    setBusy(id); setError("");
    try {
      const updated = await catalogApi<Order>(`/orders/${id}/${action}`, { method: "POST" });
      setOrders(rows => rows.map(row => row.id === id ? updated : row));
    } catch (e) { setError(e instanceof Error ? e.message : "Thao tác thất bại"); }
    finally { setBusy(null); }
  }
  return <main className="store-container py-8">
    <h1 className="text-2xl mb-4">{operations ? "Vận hành đơn mua / thuê" : "Đơn mua / thuê của tôi"}</h1>
    <div className="flex gap-4 mb-4"><Link to="/shop">Mua thiết bị</Link><Link to="/rent">Thuê thiết bị</Link><Link to="/login?returnTo=/orders">Đăng nhập</Link><button onClick={() => void load()}>Tải lại</button></div>
    {loading && <p role="status">Đang tải đơn hàng…</p>}
    {error && <p role="alert" className="customer-notice">{error}</p>}
    {!loading && !error && orders.length === 0 && <p>Chưa có đơn hàng.</p>}
    {orders.map(order => <article key={order.id} className="border bg-white p-4 mb-4">
      <h2 className="font-bold">Đơn #{order.id} · {order.status}</h2>
      <p>Chi nhánh #{order.branchId} · {new Date(order.orderDate).toLocaleString("vi-VN")}</p>
      {order.items.map(item => <p key={item.id}>{item.quantity} × Thiết bị #{item.productId} · {item.itemType === "SALE" ? "Mua" : "Thuê"} · {vnd(item.unitPrice)}{item.rentalStartDate && ` / ngày · ${item.rentalStartDate} → ${item.rentalEndDate}`} · {item.status}</p>)}
      <strong>Tổng: {vnd(order.totalAmount)}</strong>
      <div className="flex gap-3 mt-3">
        {!operations && order.status === "PENDING" && <button disabled={busy === order.id} onClick={() => void act(order.id, "cancel")}>Hủy đơn</button>}
        {operations && order.status === "PENDING" && <button disabled={busy === order.id} onClick={() => void act(order.id, "confirm")}>Xác nhận thủ công</button>}
        {operations && order.status === "CONFIRMED" && <button disabled={busy === order.id} onClick={() => void act(order.id, "hand-over")}>Bàn giao</button>}
        {operations && order.status === "IN_PROGRESS" && <button disabled={busy === order.id} onClick={() => void act(order.id, "return")}>Nhận trả</button>}
      </div>
    </article>)}
  </main>;
}
