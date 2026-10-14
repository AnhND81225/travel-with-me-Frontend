import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { 
  ShoppingBag, 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  MapPin, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface StaffOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  type: 'RENTAL' | 'RETAIL' | 'TOUR';
  itemsSummary: string;
  total: number;
  status: 'PENDING_PICKUP' | 'DEPLOYED_IN_FIELD' | 'FULFILLED' | 'RETURNED';
  date: string;
  pickupStation: string;
}

export const StaffOrdersPage: React.FC = () => {
  const { selectedStation } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [orders, setOrders] = useState<StaffOrderRecord[]>([
    {
      id: 'ord-101',
      orderNumber: 'TK-84920',
      customerName: 'Alex Rivers',
      type: 'RENTAL',
      itemsSummary: 'Hilleberg Keron 4 GT • Black Diamond Viper Axes',
      total: 310,
      status: 'DEPLOYED_IN_FIELD',
      date: '2026-10-12',
      pickupStation: 'Sapa Ridge Outpost',
    },
    {
      id: 'ord-102',
      orderNumber: 'TK-85112',
      customerName: 'Maya Chen',
      type: 'TOUR',
      itemsSummary: 'Fansipan West Ridge Alpine Traverse (2 Climbers)',
      total: 960,
      status: 'PENDING_PICKUP',
      date: '2026-10-14',
      pickupStation: 'Sapa Ridge Outpost',
    },
    {
      id: 'ord-103',
      orderNumber: 'TK-84090',
      customerName: 'David Kim',
      type: 'RETAIL',
      itemsSummary: 'Arc’teryx Alpha SV Jacket (Carbon)',
      total: 900,
      status: 'FULFILLED',
      date: '2026-10-10',
      pickupStation: 'Sapa Ridge Outpost',
    },
    {
      id: 'ord-104',
      orderNumber: 'TK-86200',
      customerName: 'Sarah Jenkins',
      type: 'RENTAL',
      itemsSummary: 'Western Mountaineering Puma -32°C Bag',
      total: 195,
      status: 'PENDING_PICKUP',
      date: '2026-10-14',
      pickupStation: 'Sapa Ridge Outpost',
    },
    {
      id: 'ord-105',
      orderNumber: 'TK-83411',
      customerName: 'Liam Tanaka',
      type: 'RENTAL',
      itemsSummary: 'Garmin inReach Explorer+ • Petzl Lynx Crampons',
      total: 160,
      status: 'RETURNED',
      date: '2026-10-08',
      pickupStation: 'Sapa Ridge Outpost',
    },
  ]);

  const handleStatusChange = (id: string, newStatus: StaffOrderRecord['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return o.customerName.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q) || o.itemsSummary.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">BRANCH DISPATCH DESK</Badge>
            <span className="text-xs text-[#5C665F]">STATION: {selectedStation.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Customer Orders & Reservations
          </h1>
          <p className="text-xs text-[#5C665F]">
            Manage unified branch order fulfillment for technical rentals, retail equipment, and tour departures.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {['ALL', 'PENDING_PICKUP', 'DEPLOYED_IN_FIELD', 'FULFILLED', 'RETURNED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-[#152A20] text-white shadow-xs'
                  : 'bg-[#EBE6DC] text-[#5C665F] hover:text-[#111D16] border border-[#D8D2C5]'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, gear..."
            className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs pl-8 pr-3 py-1.5 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] font-body"
          />
          <Search className="w-3.5 h-3.5 text-[#7A857E] absolute left-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Orders Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-label">
            <thead className="bg-[#EBE6DC] text-[#7A857E] border-b border-[#D8D2C5] uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Order / Date</th>
                <th className="p-3.5">Climber Customer</th>
                <th className="p-3.5">Manifest Type</th>
                <th className="p-3.5">Items Summary</th>
                <th className="p-3.5">Total Tariff</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C5]">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-[#EBE6DC]/30 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-[#111D16] font-mono-spec">#{o.orderNumber}</div>
                    <div className="text-[10px] text-[#7A857E]">{o.date}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-[#111D16]">{o.customerName}</div>
                    <div className="text-[10px] text-[#5C665F]">Verified Climber</div>
                  </td>
                  <td className="p-3.5">
                    <Badge variant={o.type === 'RENTAL' ? 'warning' : o.type === 'TOUR' ? 'secondary' : 'primary'}>
                      {o.type}
                    </Badge>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium text-[#111D16] max-w-xs truncate">{o.itemsSummary}</div>
                  </td>
                  <td className="p-3.5 font-bold text-[#152A20] font-mono-spec">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase ${
                      o.status === 'PENDING_PICKUP'
                        ? 'bg-[#FDF2EC] text-[#D97845] border border-[#F1BA9B]'
                        : o.status === 'DEPLOYED_IN_FIELD'
                        ? 'bg-[#152A20] text-white'
                        : o.status === 'RETURNED'
                        ? 'bg-[#E0EFE6] text-[#152A20] border border-[#ADCBBB]'
                        : 'bg-[#EBE6DC] text-[#5C665F]'
                    }`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {o.status === 'PENDING_PICKUP' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusChange(o.id, 'DEPLOYED_IN_FIELD')}
                      >
                        Authorize Handoff
                      </Button>
                    ) : o.status === 'DEPLOYED_IN_FIELD' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusChange(o.id, 'RETURNED')}
                      >
                        Check In Return
                      </Button>
                    ) : (
                      <span className="text-[10px] text-[#7A857E] font-semibold">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
