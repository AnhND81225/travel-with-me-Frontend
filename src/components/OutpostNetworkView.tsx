import React, { useState } from 'react';
import { OutpostStation, GearItem } from '../types';
import { 
  MapPin, 
  Thermometer, 
  Wind, 
  Radio, 
  Layers, 
  Truck, 
  ArrowRight, 
  ShieldCheck, 
  PhoneCall, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface OutpostNetworkViewProps {
  outposts: OutpostStation[];
  gearItems: GearItem[];
  selectedStation: OutpostStation;
  onSelectStation: (station: OutpostStation) => void;
}

export const OutpostNetworkView: React.FC<OutpostNetworkViewProps> = ({
  outposts,
  gearItems,
  selectedStation,
  onSelectStation
}) => {
  const [transferOrigin, setTransferOrigin] = useState<string>('hanoi-central');
  const [transferDest, setTransferDest] = useState<string>('sapa-base');
  const [transferGearId, setTransferGearId] = useState<string>(gearItems[0]?.id || '');
  const [transferQuantity, setTransferQuantity] = useState<number>(3);
  const [transferSuccess, setTransferSuccess] = useState<boolean>(false);

  const handleDispatchTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferSuccess(true);
    setTimeout(() => setTransferSuccess(false), 3000);
  };

  const selectedTransferGear = gearItems.find((g) => g.id === transferGearId) || gearItems[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-label">
      {/* Header */}
      <div className="border-b border-[#D8D2C5] pb-5">
        <div className="flex items-center gap-2 text-xs font-label text-[#152A20] font-bold mb-1">
          <MapPin className="w-4 h-4 text-[#152A20]" />
          <span>EXPEDITION GRID • NATIONAL LOGISTICS NETWORK</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#152A20] tracking-tight font-headline">
          MULTI-BRANCH OUTPOST ARCHITECTURE
        </h2>
        <p className="text-xs sm:text-sm text-[#4A524C] mt-1 max-w-3xl font-body">
          Five synchronized mountain stations spanning Northern alpine peaks, central karst caves, and southern high plateaus. Cross-station gear returns and inter-branch equipment shuttles supported.
        </p>
      </div>

      {/* Outposts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outposts.map((station) => {
          const isCurrent = station.id === selectedStation.id;
          return (
            <div
              key={station.id}
              onClick={() => onSelectStation(station)}
              className={`p-5 rounded-xs border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 shadow-xs ${
                isCurrent
                  ? 'bg-[#F3EFE6] border-[#152A20] ring-1 ring-[#152A20]'
                  : 'bg-[#F3EFE6]/70 border-[#D8D2C5] hover:border-[#CCC6B9] hover:bg-[#F3EFE6]'
              }`}
            >
              <div className="space-y-3">
                {/* Station Code & Status Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-label font-bold px-2.5 py-0.5 rounded-md bg-[#E7E2D8] text-[#152A20] border border-[#D8D2C5]">
                    {station.code} • {station.elevation}
                  </span>

                  <span className={`text-[10px] font-label font-bold px-2 py-0.5 rounded-md ${
                    station.status === 'OPTIMAL'
                      ? 'bg-[#E0EFE6] text-[#152A20]'
                      : station.status === 'ALPINE_WARNING'
                      ? 'bg-[#FDF2EC] text-[#D97845]'
                      : 'bg-[#EAE5DB] text-[#5C665F]'
                  }`}>
                    {station.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Name & Region */}
                <div>
                  <h3 className="text-lg font-bold text-[#152A20] font-headline">{station.name}</h3>
                  <div className="text-xs text-[#5C665F] font-label mt-0.5">
                    {station.region}
                  </div>
                  <div className="text-[11px] text-[#737C75] font-label mt-1">
                    {station.address}
                  </div>
                </div>

                {/* Weather Telemetry Box */}
                <div className="bg-[#EBE6DC] p-3.5 rounded-xs border border-[#D8D2C5] space-y-1.5 text-xs font-label">
                  <div className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3 h-3 text-[#152A20]" />
                    LIVE STATION METEOROLOGY
                  </div>
                  <div className="flex items-center justify-between text-[#152A20] font-semibold">
                    <span className="flex items-center gap-1 text-[#D97845]">
                      <Thermometer className="w-3.5 h-3.5" />
                      {station.weather.temp}
                    </span>
                    <span className="flex items-center gap-1 text-[#5C665F]">
                      <Wind className="w-3.5 h-3.5" />
                      {station.weather.wind}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#152A20]">
                    Radar: {station.weather.condition}
                  </div>
                </div>

                {/* Armoury Stock Count */}
                <div className="grid grid-cols-3 gap-2 text-center font-label text-xs">
                  <div className="bg-[#EBE6DC] p-2.5 rounded-xs border border-[#DDD7CB]">
                    <div className="text-[#152A20] font-bold font-headline">{station.inventorySummary.tentsAvailable}</div>
                    <div className="text-[9px] text-[#737C75] font-bold">TENTS</div>
                  </div>
                  <div className="bg-[#EBE6DC] p-2.5 rounded-xs border border-[#DDD7CB]">
                    <div className="text-[#152A20] font-bold font-headline">{station.inventorySummary.packsAvailable}</div>
                    <div className="text-[9px] text-[#737C75] font-bold">PACKS</div>
                  </div>
                  <div className="bg-[#EBE6DC] p-2.5 rounded-xs border border-[#DDD7CB]">
                    <div className="text-[#152A20] font-bold font-headline">{station.inventorySummary.hardwareAvailable}</div>
                    <div className="text-[9px] text-[#737C75] font-bold">HARDWARE</div>
                  </div>
                </div>
              </div>

              {/* Station select action */}
              <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between">
                <span className="text-[11px] font-label text-[#5C665F] flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 text-[#737C75]" />
                  {station.phone}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStation(station);
                  }}
                  className={`px-3.5 py-1.5 rounded-xs text-xs font-label font-bold transition cursor-pointer ${
                    isCurrent
                      ? 'bg-[#152A20] text-white shadow-xs'
                      : 'bg-[#E7E2D8] hover:bg-[#DDD7CB] text-[#152A20] border border-[#D8D2C5]'
                  }`}
                >
                  {isCurrent ? 'ACTIVE HUB' : 'SET AS BASE'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inter-Branch Logistics & Shuttle Dispatcher */}
      <div className="bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-[#D8D2C5] pb-4">
          <div className="w-10 h-10 rounded-xs bg-[#152A20] flex items-center justify-center text-white">
            <Truck className="w-5 h-5 text-[#F3EFE6]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#152A20] font-headline">
              INTER-STATION EXPEDITION SHUTTLE DISPATCH
            </h3>
            <p className="text-xs text-[#5C665F] font-body">
              Need specialized gear re-allocated before an alpine push? Mobilize an internal transfer between outposts.
            </p>
          </div>
        </div>

        <form onSubmit={handleDispatchTransfer} className="grid grid-cols-1 md:grid-cols-4 gap-4 font-label text-xs">
          {/* Origin Station */}
          <div>
            <label className="text-[#5C665F] font-bold block mb-1">ORIGIN DEPOT:</label>
            <select
              value={transferOrigin}
              onChange={(e) => setTransferOrigin(e.target.value)}
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2.5 text-[#152A20] font-semibold"
            >
              {outposts.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} ({station.code})
                </option>
              ))}
            </select>
          </div>

          {/* Destination Station */}
          <div>
            <label className="text-[#5C665F] font-bold block mb-1">DESTINATION OUTPOST:</label>
            <select
              value={transferDest}
              onChange={(e) => setTransferDest(e.target.value)}
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2.5 text-[#152A20] font-semibold"
            >
              {outposts.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} ({station.code})
                </option>
              ))}
            </select>
          </div>

          {/* Equipment Asset */}
          <div>
            <label className="text-[#5C665F] font-bold block mb-1">EQUIPMENT ASSET:</label>
            <select
              value={transferGearId}
              onChange={(e) => setTransferGearId(e.target.value)}
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2.5 text-[#152A20] font-semibold truncate"
            >
              {gearItems.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.brand} - {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Dispatch Button */}
          <div>
            <label className="text-[#5C665F] font-bold block mb-1">UNITS TO DISPATCH:</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="10"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(Number(e.target.value))}
                className="w-20 bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-2.5 text-[#152A20] text-center font-bold font-headline"
              />
              <button
                type="submit"
                className="flex-1 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-white font-bold transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Dispatch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {transferSuccess && (
          <div className="bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs p-4 font-label text-xs text-[#152A20] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#152A20] shrink-0" />
            <span className="font-medium">
              Transfer Order #TRF-9024 logged. {transferQuantity}x {selectedTransferGear.name} dispatched via Mountain Express. Estimated arrival: 14h 30m.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
