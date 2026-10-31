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
    void load().catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load details.'); });
    return () => { active = false; };
  }, [orderId, participantId]);
  const date = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (error) return <p className="pp-error" role="alert">Unable to load details: {error}</p>;
  if (order) return <div className="rf-target"><div className="rf-target-heading"><Package size={22}/><div><span className="tc-eyebrow">EQUIPMENT ORDER #{order.id}</span><h2>Order details for refund</h2><p>Ordered on: {date(order.orderDate)}</p></div><Link to="/orders">View order →</Link></div><div className="rf-products">{order.items.map(item => <div key={item.id}><div><span className="pp-label">{item.itemType === 'RENTAL' ? 'EQUIPMENT RENTAL' : 'EQUIPMENT PURCHASE'}</span><h3>{products[item.productId]?.name || `Equipment #${item.productId}`}</h3><p>Quantity: {item.quantity} · Unit price: {vnd(item.unitPrice)}{item.itemType === 'RENTAL' ? ' / day' : ''}</p>{item.rentalStartDate && item.rentalEndDate && <p><CalendarDays size={13}/> {item.rentalStartDate} → {item.rentalEndDate}</p>}</div></div>)}</div></div>;
  if (tour) return <div className="rf-target"><div className="rf-target-heading"><Ticket size={22}/><div><span className="tc-eyebrow">TOUR TICKET #{tour.ticket.id}</span><h2>{tour.event.eventName}</h2><p>Departure schedule #{tour.schedule.id} · 01 guest</p></div><Link to={`/my-tours/${tour.ticket.id}`}>View ticket →</Link></div><div className="rf-tour-info"><p><CalendarDays size={16}/>Departure: {date(tour.schedule.startDatetime)}</p>{tour.event.location && <p><MapPin size={16}/>{tour.event.location}</p>}<p>Booked ticket price: <strong>{vnd(tour.ticket.registeredPrice)}</strong></p></div></div>;
  return <p role="status">Loading refund details…</p>;
}
