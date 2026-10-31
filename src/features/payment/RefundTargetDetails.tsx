import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Package, Ticket, ArrowRight, ExternalLink, Calendar } from 'lucide-react';
import { catalogApi, vnd, type Product } from '../equipment/catalogApi';
import type { Order } from '../orders/orderApi';
import { participantApi, scheduleApi } from '../schedules/api';
import { eventGuideApi, type EventResponse } from '../../services/eventGuideApi';
import type { Participant, Schedule } from '../schedules/types';
import { Badge } from '../../components/ui';

export function RefundTargetDetails({ orderId, participantId }: { orderId: number | null; participantId: number | null }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [tour, setTour] = useState<{ ticket: Participant; schedule: Schedule; event: EventResponse } | null>(null);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setOrder(null);
    setTour(null);
    setError('');
    setProducts({});
    setLoading(true);

    async function load() {
      if (orderId) {
        const data = await catalogApi<Order>(`/orders/${orderId}`);
        if (!active) return;
        setOrder(data);
        const results = await Promise.allSettled(
          [...new Set(data.items.map(item => item.productId))].map(id => catalogApi<Product>(`/products/${id}`))
        );
        if (active) {
          setProducts(
            Object.fromEntries(
              results.flatMap(result => result.status === 'fulfilled' ? [[result.value.id, result.value]] : [])
            )
          );
        }
      } else if (participantId) {
        const ticket = await participantApi.get(participantId);
        const schedule = await scheduleApi.get(ticket.scheduleId);
        const event = await eventGuideApi.getEvent(schedule.eventId);
        if (active) setTour({ ticket, schedule, event });
      }
    }

    void load()
      .catch(e => {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId, participantId]);

  const date = (value: string) =>
    new Date(value).toLocaleString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (error) {
    return (
      <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xs text-xs text-[#B91C1C]">
        Unable to load target details: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs animate-pulse space-y-2">
        <div className="h-4 bg-[#EBE6DC] rounded-xs w-1/3" />
        <div className="h-6 bg-[#EBE6DC] rounded-xs w-2/3" />
        <div className="h-12 bg-[#EBE6DC] rounded-xs w-full" />
      </div>
    );
  }

  if (order) {
    return (
      <div className="bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-4 space-y-4 font-label">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8D2C5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xs bg-[#152A20] text-[#D97845] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider block">
                EQUIPMENT ORDER #{order.id}
              </span>
              <h3 className="text-base font-bold text-[#111D16] font-headline">
                Items Selected for Refund
              </h3>
              <p className="text-[11px] text-[#5C665F]">Ordered on: {date(order.orderDate)}</p>
            </div>
          </div>

          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#152A20] hover:text-[#D97845] transition self-start sm:self-auto"
          >
            <span>View in My Orders</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {order.items.map(item => {
            const isRental = item.itemType === 'RENTAL';
            const prod = products[item.productId];

            return (
              <div
                key={item.id}
                className="p-3 bg-white border border-[#D8D2C5] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xs bg-[#F3EFE6] border border-[#D8D2C5] flex items-center justify-center font-bold text-xs text-[#152A20] shrink-0 font-mono-spec">
                    {item.quantity}×
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#111D16] font-headline">
                        {prod?.name || `Equipment #${item.productId}`}
                      </span>
                      <Badge variant={isRental ? 'warning' : 'neutral'} size="sm" className="text-[9px]">
                        {isRental ? 'RENTAL' : 'PURCHASE'}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-[#5C665F] mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Unit price: {vnd(item.unitPrice)}{isRental ? ' / day' : ''}</span>
                      {isRental && item.rentalStartDate && item.rentalEndDate && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[#D97845] font-bold">
                            <Calendar className="w-3 h-3" />
                            {item.rentalStartDate} → {item.rentalEndDate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#737C75] uppercase block">Subtotal</span>
                  <span className="font-bold text-sm text-[#152A20] font-headline">
                    {vnd(item.quantity * item.unitPrice)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (tour) {
    return (
      <div className="bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-4 space-y-4 font-label">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8D2C5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xs bg-[#152A20] text-emerald-400 flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                EXPEDITION TICKET #{tour.ticket.id}
              </span>
              <h3 className="text-base font-bold text-[#111D16] font-headline">
                {tour.event.eventName}
              </h3>
              <p className="text-[11px] text-[#5C665F]">Departure schedule #{tour.schedule.id} · 01 Registered Guest</p>
            </div>
          </div>

          <Link
            to={`/my-tours/${tour.ticket.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#152A20] hover:text-[#D97845] transition self-start sm:self-auto"
          >
            <span>View Ticket</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-3.5 bg-white border border-[#D8D2C5] rounded-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#5C665F]">
            <CalendarDays className="w-4 h-4 text-[#152A20] shrink-0" />
            <span>Departure: {date(tour.schedule.startDatetime)}</span>
          </div>
          {tour.event.location && (
            <div className="flex items-center gap-2 text-[#5C665F]">
              <MapPin className="w-4 h-4 text-[#D97845] shrink-0" />
              <span>Location: {tour.event.location}</span>
            </div>
          )}
          <div className="pt-2 border-t border-[#EBE6DC] flex justify-between items-center">
            <span className="text-[#737C75] font-bold uppercase">Ticket Value:</span>
            <span className="text-base font-bold text-[#D97845] font-headline">
              {vnd(tour.ticket.registeredPrice)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
