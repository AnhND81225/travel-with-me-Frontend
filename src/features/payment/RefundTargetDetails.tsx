import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Package, Ticket } from 'lucide-react';
import { catalogApi, vnd, type Product } from '../equipment/catalogApi';
import type { Order } from '../orders/orderApi';
import { participantApi, scheduleApi } from '../schedules/api';
import { eventGuideApi, type EventResponse } from '../../services/eventGuideApi';
import type { Participant, Schedule } from '../schedules/types';

export function RefundTargetDetails({ orderId, participantId }: { orderId: number | null; participantId: number | null }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [tour, setTour] = useState<{ ticket: Participant; schedule: Schedule; event: EventResponse } | null>(null);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setOrder(null); setTour(null); setError(''); setProducts({});
    async function load() {
      if (orderId) {
        const data = await catalogApi<Order>(`/orders/${orderId}`);
        if (!active) return;
        setOrder(data);
        const results = await Promise.allSettled([...new Set(data.items.map(item => item.productId))].map(id => catalogApi<Product>(`/products/${id}`)));
        if (active) setProducts(Object.fromEntries(results.flatMap(result => result.status === 'fulfilled' ? [[result.value.id, result.value]] : [])));
      } else if (participantId) {
        const ticket = await participantApi.get(participantId);
        const schedule = await scheduleApi.get(ticket.scheduleId);
        const event = await eventGuideApi.getEvent(schedule.eventId);
        if (active) setTour({ ticket, schedule, event });
      }
    }
    void load().catch(e => { if (active) setError(e instanceof Error ? e.message : 'Không tải được thông tin.'); });
    return () => { active = false; };
  }, [orderId, participantId]);
  const date = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (error) return <p className="pp-error" role="alert">Không tải được chi tiết: {error}</p>;
  if (order) return <div className="rf-target"><div className="rf-target-heading"><Package size={22}/><div><span className="tc-eyebrow">ĐƠN TRANG BỊ #{order.id}</span><h2>Thông tin đơn cần hoàn tiền</h2><p>Ngày đặt: {date(order.orderDate)}</p></div><Link to="/orders">Xem đơn hàng →</Link></div><div className="rf-products">{order.items.map(item => <div key={item.id}><div><span className="pp-label">{item.itemType === 'RENTAL' ? 'THUÊ TRANG BỊ' : 'MUA TRANG BỊ'}</span><h3>{products[item.productId]?.name || `Trang bị #${item.productId}`}</h3><p>Số lượng: {item.quantity} · Đơn giá: {vnd(item.unitPrice)}{item.itemType === 'RENTAL' ? ' / ngày' : ''}</p>{item.rentalStartDate && item.rentalEndDate && <p><CalendarDays size={13}/> {item.rentalStartDate} → {item.rentalEndDate}</p>}</div></div>)}</div></div>;
  if (tour) return <div className="rf-target"><div className="rf-target-heading"><Ticket size={22}/><div><span className="tc-eyebrow">VÉ TOUR #{tour.ticket.id}</span><h2>{tour.event.eventName}</h2><p>Lịch khởi hành #{tour.schedule.id} · 01 khách</p></div><Link to={`/my-tours/${tour.ticket.id}`}>Xem vé →</Link></div><div className="rf-tour-info"><p><CalendarDays size={16}/>Khởi hành: {date(tour.schedule.startDatetime)}</p>{tour.event.location && <p><MapPin size={16}/>{tour.event.location}</p>}<p>Giá vé đã đặt: <strong>{vnd(tour.ticket.registeredPrice)}</strong></p></div></div>;
  return <p role="status">Đang tải thông tin cần hoàn tiền…</p>;
}
