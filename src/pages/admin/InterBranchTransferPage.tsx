import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { Truck, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GEAR_ITEMS } from '../../data/mockData';

export const InterBranchTransferPage: React.FC = () => {
  const { outposts } = useAppStore();
  const [origin, setOrigin] = useState('hanoi-central');
  const [dest, setDest] = useState('sapa-base');
  const [gearId, setGearId] = useState(GEAR_ITEMS[0].id);
  const [qty, setQty] = useState(4);
  const [dispatchedToast, setDispatchedToast] = useState(false);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchedToast(true);
    setTimeout(() => setDispatchedToast(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Command Center</span>
      </Link>

      <div className="border-b border-[#D8D2C5] pb-4">
        <Badge variant="primary">INTERNAL LOGISTICS</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-1">
          Inter-Station Equipment Courier Dispatch
        </h1>
        <p className="text-xs text-[#5C665F]">Redistribute armory assets between branches to meet peak mountaineering demand.</p>
      </div>

      {dispatchedToast && (
        <div className="p-3.5 bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs text-xs font-bold text-[#152A20] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#152A20]" />
          <span>Shuttle Dispatch #TRF-9921 authorized. Mountain express courier scheduled.</span>
        </div>
      )}

      <Card padding="lg">
        <form onSubmit={handleDispatch} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">ORIGIN STATION:</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2.5 font-bold text-[#111D16]"
              >
                {outposts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">DESTINATION STATION:</label>
              <select
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2.5 font-bold text-[#111D16]"
              >
                {outposts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">EQUIPMENT ASSET:</label>
              <select
                value={gearId}
                onChange={(e) => setGearId(e.target.value)}
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2.5 font-bold text-[#111D16]"
              >
                {GEAR_ITEMS.map((g) => (
                  <option key={g.id} value={g.id}>{g.brand} - {g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">QUANTITY:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2.5 font-bold text-[#111D16] text-center"
              />
            </div>
          </div>

          <Button variant="primary" size="lg" fullWidth type="submit" icon={<Truck className="w-4 h-4" />}>
            Authorize Shuttle Transfer
          </Button>
        </form>
      </Card>
    </div>
  );
};
