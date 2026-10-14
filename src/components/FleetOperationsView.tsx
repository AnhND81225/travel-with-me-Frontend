import React, { useState } from 'react';
import { FleetGearUnit, OutpostStation } from '../types';
import { 
  Layers, 
  Search, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  QrCode,
  Sliders,
  Filter
} from 'lucide-react';

interface FleetOperationsViewProps {
  fleetUnits: FleetGearUnit[];
  outposts: OutpostStation[];
}

export const FleetOperationsView: React.FC<FleetOperationsViewProps> = ({
  fleetUnits: initialUnits,
  outposts
}) => {
  const [fleetUnits, setFleetUnits] = useState<FleetGearUnit[]>(initialUnits);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredUnits = fleetUnits.filter((unit) => {
    if (statusFilter !== 'all' && unit.custodyState !== statusFilter) return false;
    if (stationFilter !== 'all' && unit.currentStationId !== stationFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSerial = unit.serialNumber.toLowerCase().includes(q);
      const matchName = unit.gearName.toLowerCase().includes(q);
      const matchRfid = unit.rfidTag.toLowerCase().includes(q);
      if (!matchSerial && !matchName && !matchRfid) return false;
    }
    return true;
  });

  const handleUpdateStatus = (serialNumber: string, newState: FleetGearUnit['custodyState']) => {
    setFleetUnits((prev) =>
      prev.map((unit) =>
        unit.serialNumber === serialNumber ? { ...unit, custodyState: newState } : unit
      )
    );
    setActionMessage(`Serial ${serialNumber} custody state transitioned to ${newState.replace(/_/g, ' ')}`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleSanitize = (serialNumber: string) => {
    setFleetUnits((prev) =>
      prev.map((unit) =>
        unit.serialNumber === serialNumber
          ? {
              ...unit,
              custodyState: 'AVAILABLE_IN_DEPOT',
              conditionScore: Math.min(100, unit.conditionScore + 2),
              lastInspectionDate: new Date().toISOString().split('T')[0]
            }
          : unit
      )
    );
    setActionMessage(`UV sanitization & autoclave cycle logged for ${serialNumber}. Marked ready for field deployment.`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      {/* Header */}
      <div className="border-b border-[#D8D2C5] pb-5">
        <div className="flex items-center gap-2 text-xs font-label text-[#152A20] font-bold mb-1">
          <Layers className="w-4 h-4 text-[#152A20]" />
          <span>DEPOT QUARTERMASTER • SERIALIZED ARMOURY</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#152A20] tracking-tight font-headline">
          FLEET ASSET LEDGER & SANITIZATION LOGS
        </h2>
        <p className="text-xs sm:text-sm text-[#4A524C] mt-1 max-w-3xl font-body">
          Real-time tracking of individual serialized tents, ice axes, gore-tex shells, and satellite beacons. 
          Audited under military-grade autoclave sanitization protocols before each deployment.
        </p>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xs bg-[#E0EFE6] border border-[#ADCBBB] text-[#152A20] font-label text-xs flex items-center gap-2 shadow-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#152A20]" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#F3EFE6] p-4 rounded-xs border border-[#D8D2C5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-label text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Serial Number (e.g. SN-HLB-9941), Gear Name, RFID..."
            className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs pl-9 pr-4 py-2.5 text-[#152A20] placeholder-[#879089] font-medium"
          />
          <Search className="w-4 h-4 text-[#737C75] absolute left-3 top-3" />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[#5C665F] font-bold text-[11px] whitespace-nowrap">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs px-3 py-2 text-[#152A20] font-semibold"
          >
            <option value="all">All States</option>
            <option value="AVAILABLE_IN_DEPOT">Ready in Depot</option>
            <option value="DEPLOYED_TO_FIELD">Deployed in Field</option>
            <option value="SANITIZATION_HOLD">Sanitization Hold</option>
            <option value="MAINTENANCE_REQUIRED">Maintenance Required</option>
          </select>
        </div>

        {/* Station Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[#5C665F] font-bold text-[11px] whitespace-nowrap">DEPOT:</span>
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs px-3 py-2 text-[#152A20] font-semibold"
          >
            <option value="all">All Outposts</option>
            {outposts.map((station) => (
              <option key={station.id} value={station.id}>
                {station.code} - {station.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-label text-xs">
            <thead className="bg-[#E7E2D8] border-b border-[#D8D2C5] text-[#5C665F] text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">SERIAL & RFID</th>
                <th className="py-3.5 px-4">EQUIPMENT MODEL</th>
                <th className="py-3.5 px-4">LOCATION</th>
                <th className="py-3.5 px-4">CUSTODY STATE</th>
                <th className="py-3.5 px-4">INTEGRITY</th>
                <th className="py-3.5 px-4">EXPEDITIONS</th>
                <th className="py-3.5 px-4 text-right">RANGER ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D5]">
              {filteredUnits.map((unit) => {
                const station = outposts.find((s) => s.id === unit.currentStationId);
                return (
                  <tr key={unit.serialNumber} className="hover:bg-[#FAF8F4] transition">
                    {/* Serial & RFID */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#152A20] font-headline">{unit.serialNumber}</div>
                      <div className="text-[10px] text-[#737C75]">RFID: {unit.rfidTag}</div>
                    </td>

                    {/* Gear Name */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#152A20]">{unit.gearName}</div>
                      <div className="text-[10px] text-[#5C665F]">REF: {unit.modelCode}</div>
                    </td>

                    {/* Station Location */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#EBE6DC] text-[#152A20] font-semibold border border-[#D8D2C5] text-[11px]">
                        {station?.code || unit.currentStationId}
                      </span>
                    </td>

                    {/* Custody State */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        unit.custodyState === 'AVAILABLE_IN_DEPOT'
                          ? 'bg-[#152A20] text-white'
                          : unit.custodyState === 'DEPLOYED_TO_FIELD'
                          ? 'bg-[#EAE5DB] text-[#152A20]'
                          : unit.custodyState === 'SANITIZATION_HOLD'
                          ? 'bg-[#FDF2EC] text-[#D97845] border border-[#F1BA9B]'
                          : 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]'
                      }`}>
                        {unit.custodyState.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Integrity Score */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#152A20] font-headline">{unit.conditionScore}%</span>
                        <div className="w-12 h-1.5 bg-[#DDD7CB] rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${unit.conditionScore > 90 ? 'bg-[#152A20]' : 'bg-[#D97845]'}`}
                            style={{ width: `${unit.conditionScore}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#737C75]">Last: {unit.lastInspectionDate}</div>
                    </td>

                    {/* Deployments Count */}
                    <td className="py-4 px-4">
                      <span className="text-[#4A524C] font-semibold">{unit.fieldDeploymentsCount} trips</span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {unit.custodyState === 'SANITIZATION_HOLD' && (
                          <button
                            onClick={() => handleSanitize(unit.serialNumber)}
                            className="px-3 py-1 rounded-lg bg-[#D97845] hover:bg-[#C66735] text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Complete UV</span>
                          </button>
                        )}

                        {unit.custodyState === 'AVAILABLE_IN_DEPOT' && (
                          <button
                            onClick={() => handleUpdateStatus(unit.serialNumber, 'DEPLOYED_TO_FIELD')}
                            className="px-3 py-1 rounded-lg bg-[#152A20] hover:bg-[#1E3A2D] text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            Dispatch
                          </button>
                        )}

                        {unit.custodyState === 'DEPLOYED_TO_FIELD' && (
                          <button
                            onClick={() => handleUpdateStatus(unit.serialNumber, 'SANITIZATION_HOLD')}
                            className="px-3 py-1 rounded-lg bg-[#E7E2D8] hover:bg-[#DDD7CB] text-[#152A20] border border-[#D8D2C5] text-[11px] font-bold transition cursor-pointer"
                          >
                            Receive & Inspect
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
