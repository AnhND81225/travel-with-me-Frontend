import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { 
  Package, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StaffInventoryPage: React.FC = () => {
  const { selectedStation, fleetUnits, setFleetUnits, sanitizeUnit } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<string>('ALL');

  const filteredUnits = fleetUnits.filter((u) => {
    if (filterState !== 'ALL' && u.custodyState !== filterState) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return u.gearName.toLowerCase().includes(q) || u.serialNumber.toLowerCase().includes(q) || u.rfidTag.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleHold = (serial: string) => {
    setFleetUnits(
      fleetUnits.map((u) => {
        if (u.serialNumber === serial) {
          const nextState = u.custodyState === 'AVAILABLE_IN_DEPOT' ? 'SANITIZATION_HOLD' : 'AVAILABLE_IN_DEPOT';
          return { ...u, custodyState: nextState };
        }
        return u;
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">SERIALIZED DEPOT VAULT</Badge>
            <span className="text-xs text-[#5C665F]">STATION: {selectedStation.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Branch Armoury Inventory & RFID Assets
          </h1>
          <p className="text-xs text-[#5C665F]">
            Track serialized hardware units, fatigue indexing, UV decontamination holding, and inter-branch transfers.
          </p>
        </div>

        <Link to="/admin/transfers">
          <Button variant="secondary" size="md" icon={<Truck className="w-4 h-4" />}>
            Request Inbound Shuttle
          </Button>
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {['ALL', 'AVAILABLE_IN_DEPOT', 'DEPLOYED_TO_FIELD', 'SANITIZATION_HOLD'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterState(st)}
              className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                filterState === st
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
            placeholder="Search Serial, RFID, model..."
            className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs pl-8 pr-3 py-1.5 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] font-body"
          />
          <Search className="w-3.5 h-3.5 text-[#7A857E] absolute left-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Fleet Units Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-label">
            <thead className="bg-[#EBE6DC] text-[#7A857E] border-b border-[#D8D2C5] uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Serial # / RFID</th>
                <th className="p-3.5">Asset Model</th>
                <th className="p-3.5">Wear Index</th>
                <th className="p-3.5">Deployments</th>
                <th className="p-3.5">Last Sanitized</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Armourer Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C5]">
              {filteredUnits.map((unit) => (
                <tr key={unit.serialNumber} className="hover:bg-[#EBE6DC]/30 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-[#111D16] font-mono-spec">{unit.serialNumber}</div>
                    <div className="text-[10px] text-[#7A857E] font-mono-spec">RFID: {unit.rfidTag}</div>
                  </td>
                  <td className="p-3.5 font-bold text-[#111D16]">
                    {unit.gearName}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 font-mono-spec font-bold">
                      <span className={unit.conditionScore > 90 ? 'text-emerald-700' : 'text-[#D97845]'}>
                        {unit.conditionScore}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono-spec text-[11px]">
                    {unit.fieldDeploymentsCount} Expeditions
                  </td>
                  <td className="p-3.5 text-[11px] text-[#5C665F]">
                    {unit.lastSanitizedDate}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase ${
                      unit.custodyState === 'AVAILABLE_IN_DEPOT'
                        ? 'bg-[#E0EFE6] text-[#152A20] border border-[#ADCBBB]'
                        : unit.custodyState === 'SANITIZATION_HOLD'
                        ? 'bg-[#FDF2EC] text-[#D97845] border border-[#F1BA9B]'
                        : 'bg-[#152A20] text-white'
                    }`}>
                      {unit.custodyState.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {unit.custodyState === 'AVAILABLE_IN_DEPOT' ? (
                      <button
                        onClick={() => toggleHold(unit.serialNumber)}
                        className="text-[11px] text-[#D97845] hover:underline font-bold cursor-pointer"
                      >
                        Tag for Sanitization
                      </button>
                    ) : unit.custodyState === 'SANITIZATION_HOLD' ? (
                      <button
                        onClick={() => sanitizeUnit(unit.serialNumber)}
                        className="text-[11px] text-emerald-700 hover:underline font-bold cursor-pointer"
                      >
                        Execute UV Clear
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#7A857E]">In Field Custody</span>
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
