import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { Layers, Package, Sparkles, MapPin, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const AdminDashboardPage: React.FC = () => {
  const { fleetUnits, custodyItems, outposts, selectedStation } = useAppStore();

  const inFieldCount = fleetUnits.filter((u) => u.custodyState === 'DEPLOYED_TO_FIELD').length;
  const sanitizeHoldCount = fleetUnits.filter((u) => u.custodyState === 'SANITIZATION_HOLD').length;
  const readyCount = fleetUnits.filter((u) => u.custodyState === 'AVAILABLE_IN_DEPOT').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex justify-between items-end">
        <div>
          <Badge variant="secondary">RANGER QUARTERMASTER</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-1">
            Outpost Operations Command Center
          </h1>
          <p className="text-xs text-[#5C665F]">HQ Terminal: {selectedStation.name} ({selectedStation.code})</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#737C75] font-bold uppercase">DEPLOYED TO FIELD</span>
          <div className="text-2xl font-bold text-[#152A20] font-headline">{inFieldCount} Units</div>
          <span className="text-[11px] text-[#5C665F]">Active on mountain ridges</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#737C75] font-bold uppercase">SANITIZATION HOLD</span>
          <div className="text-2xl font-bold text-[#D97845] font-headline">{sanitizeHoldCount} Units</div>
          <span className="text-[11px] text-[#5C665F]">Awaiting UV & autoclave cycle</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#737C75] font-bold uppercase">READY IN DEPOTS</span>
          <div className="text-2xl font-bold text-[#152A20] font-headline">{readyCount} Units</div>
          <span className="text-[11px] text-[#152A20] font-semibold">100% Inspected & Cleared</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#737C75] font-bold uppercase">ACTIVE MANIFESTS</span>
          <div className="text-2xl font-bold text-[#152A20] font-headline">{custodyItems.length}</div>
          <span className="text-[11px] text-[#5C665F]">Tracked under escrow bonds</span>
        </Card>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="md" className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#152A20] uppercase flex items-center gap-2">
              <Package className="w-4 h-4 text-[#152A20]" />
              SERIALIZED FLEET LEDGER
            </h3>
            <Link to="/admin/fleet">
              <Button variant="secondary" size="sm">Manage Fleet</Button>
            </Link>
          </div>
          <p className="text-xs text-[#5C665F] font-body">
            Audit serial numbers, RFID chips, hardware fatigue indexes, and deployment life cycles.
          </p>
        </Card>

        <Card padding="md" className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#152A20] uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D97845]" />
              UV SANITIZATION PROTOCOLS
            </h3>
            <Link to="/admin/sanitize">
              <Button variant="secondary" size="sm">Enter Lab</Button>
            </Link>
          </div>
          <p className="text-xs text-[#5C665F] font-body">
            Log medical-grade autoclave and UV chambers for down sleeping bags and Kerlon shelters between field expeditions.
          </p>
        </Card>
      </div>
    </div>
  );
};
