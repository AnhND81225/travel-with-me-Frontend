import React from 'react';
import { OUTPOSTS } from '../../data/mockData';
import { Card, Button, Badge } from '../../components/ui';
import { MapPin, Radio, Thermometer, Wind, ShieldCheck, PhoneCall, Layers } from 'lucide-react';

export const AdminBranchesPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">LOGISTICS INFRASTRUCTURE</Badge>
            <span className="text-xs text-[#5C665F]">5 ACTIVE DEPOTS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            National Branch Depots & Operations Network
          </h1>
          <p className="text-xs text-[#5C665F]">
            Coordinating mountain stations, basecamp armoury depots, and Iridium telemetry repeaters across Vietnam.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {OUTPOSTS.map((st) => (
          <Card key={st.id} padding="md" className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#D8D2C5]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xs bg-[#152A20] flex items-center justify-center text-white">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#111D16] font-headline">{st.name}</h3>
                    <span className="text-[10px] text-[#7A857E] font-mono-spec">SECTOR {st.code}</span>
                  </div>
                </div>
                <Badge variant={st.status === 'OPTIMAL' ? 'success' : 'warning'}>
                  {st.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div className="text-xs text-[#5C665F] space-y-1">
                <div>Region: <strong className="text-[#111D16]">{st.region}</strong></div>
                <div>Elevation: <strong className="text-[#111D16]">{st.elevation}</strong></div>
                <div>Coordinates: <span className="font-mono-spec text-[11px] text-[#7A857E]">{st.coordinates}</span></div>
                <div>Hotline: <span className="font-mono-spec text-[11px] text-[#111D16]">{st.phone}</span></div>
              </div>

              {/* Station Weather Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#D8D2C5]">
                <div className="p-2 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5]">
                  <span className="text-[9px] text-[#7A857E] font-bold block uppercase">CURRENT TEMP</span>
                  <span className="font-bold text-[#D97845] font-mono-spec">{st.weather.temp}</span>
                </div>
                <div className="p-2 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5]">
                  <span className="text-[9px] text-[#7A857E] font-bold block uppercase">WIND SPEED</span>
                  <span className="font-bold text-[#111D16] font-mono-spec">{st.weather.wind}</span>
                </div>
              </div>

              {/* Inventory Breakdown */}
              <div className="p-2.5 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5] text-xs space-y-1">
                <span className="text-[10px] text-[#7A857E] font-bold block uppercase">DEPOT ASSETS HELD:</span>
                <div className="grid grid-cols-3 gap-1 text-center font-mono-spec text-[11px]">
                  <div><strong className="text-[#111D16]">{st.inventorySummary.tentsAvailable}</strong> Tents</div>
                  <div><strong className="text-[#111D16]">{st.inventorySummary.packsAvailable}</strong> Packs</div>
                  <div><strong className="text-[#111D16]">{st.inventorySummary.hardwareAvailable}</strong> Axes</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#D8D2C5] flex justify-between items-center text-xs">
              <span className="text-[11px] text-[#7A857E]">Capacity: {st.inventorySummary.totalUnits} Units</span>
              <Button variant="secondary" size="sm">Manage Depot</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
