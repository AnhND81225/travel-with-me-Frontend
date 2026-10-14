import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { ArrowLeft, Clock, PlusCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const RentalExtensionPage: React.FC = () => {
  const navigate = useNavigate();
  const { custodyItems, extendRental } = useAppStore();
  const [selectedId, setSelectedId] = useState(custodyItems[0]?.id || '');
  const [extraDays, setExtraDays] = useState(2);
  const [extendedToast, setExtendedToast] = useState(false);

  const selectedItem = custodyItems.find((c) => c.id === selectedId) || custodyItems[0];
  const extensionFee = selectedItem ? selectedItem.dailyRate * extraDays : 0;

  const handleApply = () => {
    if (selectedItem) {
      extendRental(selectedItem.id, extraDays);
      setExtendedToast(true);
      setTimeout(() => {
        navigate('/custody');
      }, 1400);
    }
  };

  if (!selectedItem) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center font-label">
        <h3 className="text-base font-bold text-[#152A20]">No active custody items to extend.</h3>
        <Link to="/" className="text-xs text-[#D97845] underline mt-2 block">Browse Gear</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <Link to="/custody" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Custody Hub</span>
      </Link>

      <div className="border-b border-[#D8D2C5] pb-4">
        <Badge variant="primary">SATELLITE RIDGE EXTENSION</Badge>
        <h1 className="text-2xl font-bold text-[#152A20] font-headline mt-1">
          Request Custody Extension
        </h1>
        <p className="text-xs text-[#5C665F]">Delayed at high camp or extending ridge trek? Instant clearance with zero late fee.</p>
      </div>

      <Card padding="md" className="space-y-4">
        <div>
          <label className="text-[10px] text-[#5C665F] font-bold block mb-1">SELECT GEAR ITEM:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2 font-bold text-[#111D16] text-xs"
          >
            {custodyItems.map((c) => (
              <option key={c.id} value={c.id}>
                {c.gearItem.name} (#{c.orderNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">ADDITIONAL EXPEDITION DAYS:</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setExtraDays(d)}
                className={`py-2 rounded-xs border text-xs font-bold cursor-pointer transition uppercase ${
                  extraDays === d ? 'bg-[#152A20] text-white border-[#152A20]' : 'bg-[#EBE6DC] text-[#111D16] border-[#D8D2C5]'
                }`}
              >
                +{d} {d === 1 ? 'Day' : 'Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5] text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-[#5C665F]">Daily Tariff:</span>
            <span className="font-bold text-[#152A20]">{formatCurrency(selectedItem.dailyRate)}/day</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5C665F]">Extension Fee:</span>
            <span className="font-bold text-[#D97845]">{formatCurrency(extensionFee)}</span>
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleApply}
          disabled={extendedToast}
          icon={extendedToast ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        >
          {extendedToast ? 'Extension Confirmed!' : `Authorize Extension (${formatCurrency(extensionFee)})`}
        </Button>
      </Card>
    </div>
  );
};
