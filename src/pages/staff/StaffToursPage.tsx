import React, { useState } from 'react';
import { GUIDED_EXPEDITIONS } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { 
  Mountain, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const StaffToursPage: React.FC = () => {
  const { selectedStation } = useAppStore();
  const [signedTours, setSignedTours] = useState<Record<string, boolean>>({});

  const handleSignOff = (tourId: string) => {
    setSignedTours((prev) => ({ ...prev, [tourId]: true }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">EXPEDITION DISPATCH</Badge>
            <span className="text-xs text-[#5C665F]">OUTPOST: {selectedStation.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Guided Alpine Traverses & Departures
          </h1>
          <p className="text-xs text-[#5C665F]">
            Review squad manifest rosters, UIAGM lead guide verification, and Iridium emergency transceiver telemetry before departure.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {GUIDED_EXPEDITIONS.map((tour) => {
          const isCleared = signedTours[tour.id];

          return (
            <Card key={tour.id} padding="none" className="overflow-hidden">
              <div className="p-4 bg-[#EBE6DC] border-b border-[#D8D2C5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xs bg-[#152A20] flex items-center justify-center text-white">
                    <Mountain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{tour.difficulty}</Badge>
                      <span className="text-xs font-bold text-[#D97845] font-mono-spec">CEILING: {tour.peakAltitude}</span>
                    </div>
                    <h3 className="font-bold text-base text-[#111D16] font-headline mt-0.5">{tour.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xs text-xs font-bold uppercase ${
                    isCleared ? 'bg-[#E0EFE6] text-[#152A20] border border-[#ADCBBB]' : 'bg-[#FDF2EC] text-[#D97845] border border-[#F1BA9B]'
                  }`}>
                    {isCleared ? 'DEPARTURE CLEARED' : 'PRE-FLIGHT BRIEFING PENDING'}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4 text-xs font-label">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-[#D8D2C5]">
                  <div>
                    <span className="text-[10px] text-[#7A857E] font-bold block uppercase">LEAD UIAGM GUIDE:</span>
                    <span className="font-bold text-[#111D16]">{tour.leadGuide?.name || 'Capt. Vu Hoang'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A857E] font-bold block uppercase">ROSTER CAPACITY:</span>
                    <span className="font-bold text-[#111D16]">{tour.totalSlots} Climbers Squad</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A857E] font-bold block uppercase">DEPARTURE WINDOW:</span>
                    <span className="font-bold text-[#111D16]">{tour.nextDeparture} (05:30)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A857E] font-bold block uppercase">IRIDIUM BEACON ID:</span>
                    <span className="font-bold text-[#152A20] font-mono-spec">PLB-406-V{tour.id.slice(-3)}</span>
                  </div>
                </div>

                {/* Climber Squad Roster */}
                <div>
                  <h4 className="text-xs font-bold text-[#111D16] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#152A20]" />
                    REGISTERED CLIMBERS ROSTER
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5] space-y-1">
                      <div className="font-bold text-[#111D16]">Alex Rivers (Squad Lead)</div>
                      <div className="text-[10px] text-[#5C665F]">Emergency Contact: +84 912 345 678</div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-[#E0EFE6] text-[#152A20] font-bold">Waiver Signed</span>
                    </div>
                    <div className="p-3 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5] space-y-1">
                      <div className="font-bold text-[#111D16]">Elena Rostova</div>
                      <div className="text-[10px] text-[#5C665F]">High-Altitude Med: Cleared</div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-[#E0EFE6] text-[#152A20] font-bold">Waiver Signed</span>
                    </div>
                    <div className="p-3 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5] space-y-1">
                      <div className="font-bold text-[#111D16]">Marcus Vance</div>
                      <div className="text-[10px] text-[#5C665F]">High-Altitude Med: Cleared</div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-[#E0EFE6] text-[#152A20] font-bold">Waiver Signed</span>
                    </div>
                  </div>
                </div>

                {/* Departure Clearance Action */}
                <div className="pt-3 border-t border-[#D8D2C5] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#5C665F] text-[11px]">
                    <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>Emergency Frequency 406.037 MHz Synchronized to Station Repeater</span>
                  </div>

                  {!isCleared ? (
                    <Button
                      variant="accent"
                      size="md"
                      onClick={() => handleSignOff(tour.id)}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Authorize Squad Departure
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-[#152A20] flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Roster Dispatched & Logged to HQ
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
