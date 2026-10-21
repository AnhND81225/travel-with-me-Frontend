import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { ArrowLeft, MapPin, Radio, Thermometer, Wind, PhoneCall, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const OutpostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { outposts, selectedStation, setSelectedStation } = useAppStore();
  const station = outposts.find((o) => o.id === id) || selectedStation;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <Link to="/outposts" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Outpost Stations</span>
      </Link>

      <div className="border-b border-[#D8D2C5] pb-4 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">{station.code}</Badge>
            <Badge variant="neutral">{station.elevation}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-1">{station.name}</h1>
          <p className="text-xs text-[#5C665F]">{station.region} • {station.coordinates}</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setSelectedStation(station)}
        >
          Set As My Basecamp
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="md" className="space-y-3">
          <div className="text-xs font-bold text-[#152A20] uppercase flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#152A20]" />
            LIVE STATION METEOROLOGY
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5]">
              <span className="text-[10px] text-[#7A857E] block font-bold uppercase">SUMMIT TEMP</span>
              <span className="text-[#D97845] font-bold text-base font-mono-spec">{station.weather.temp}</span>
            </div>
            <div className="bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5]">
              <span className="text-[10px] text-[#7A857E] block font-bold uppercase">GALE FORCE</span>
              <span className="text-[#111D16] font-bold text-base font-mono-spec">{station.weather.wind}</span>
            </div>
          </div>
          <div className="text-xs text-[#5C665F]">
            Conditions: <span className="font-bold text-[#111D16]">{station.weather.condition}</span> • Visibility: {station.weather.visibility}
          </div>
        </Card>

        <Card padding="md" className="space-y-3">
          <div className="text-xs font-bold text-[#111D16] uppercase flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#152A20]" />
            OUTPOST INVENTORY LEDGER
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5]">
              <div className="text-lg font-bold text-[#111D16] font-headline font-mono-spec">{station.inventorySummary.tentsAvailable}</div>
              <div className="text-[10px] text-[#7A857E] font-bold uppercase">TENTS</div>
            </div>
            <div className="bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5]">
              <div className="text-lg font-bold text-[#111D16] font-headline font-mono-spec">{station.inventorySummary.packsAvailable}</div>
              <div className="text-[10px] text-[#7A857E] font-bold uppercase">PACKS</div>
            </div>
            <div className="bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5]">
              <div className="text-lg font-bold text-[#111D16] font-headline font-mono-spec">{station.inventorySummary.hardwareAvailable}</div>
              <div className="text-[10px] text-[#7A857E] font-bold uppercase">HARDWARE</div>
            </div>
          </div>
          <div className="text-xs text-[#5C665F]">
            Contact Desk: <span className="font-bold text-[#152A20]">{station.phone}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
