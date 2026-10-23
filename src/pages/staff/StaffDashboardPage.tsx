import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { 
  PlusCircle, 
  ShoppingBag, 
  ShieldCheck, 
  Calendar, 
  Package, 
  MapPin, 
  Radio, 
  Truck, 
  QrCode,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const StaffDashboardPage: React.FC = () => {
  const { selectedStation, custodyItems, fleetUnits, outposts } = useAppStore();

  const { account } = useAuth();
  const stationCustody = custodyItems;
  const inFieldCount = fleetUnits.filter((u) => u.custodyState === 'DEPLOYED_TO_FIELD').length;
  const sanitizingCount = fleetUnits.filter((u) => u.custodyState === 'SANITIZATION_HOLD').length;
  const readyUnits = fleetUnits.filter((u) => u.custodyState === 'AVAILABLE_IN_DEPOT').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      {/* Top Banner */}
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">STATION ARMOURER DESK</Badge>
            <span className="text-xs text-[#5C665F] font-mono-spec">DEPOT CODE: {selectedStation.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            {selectedStation.name} Operations
          </h1>
          <p className="text-xs text-[#5C665F]">
            Elevation: <strong className="text-[#111D16]">{selectedStation.elevation}</strong> • Temp: {selectedStation.weather.temp} • Gale: {selectedStation.weather.wind}
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/staff/pos">
            <Button variant="accent" size="md" icon={<PlusCircle className="w-4 h-4" />}>
              New POS Order
            </Button>
          </Link>
          <Link to="/staff/rentals">
            <Button variant="primary" size="md" icon={<ShieldCheck className="w-4 h-4" />}>
              Return Desk
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider">UNITS IN FIELD</span>
          <div className="text-2xl font-bold text-[#111D16] font-headline font-mono-spec">{inFieldCount} Units</div>
          <span className="text-[11px] text-[#5C665F]">Active on mountain ridges</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider">DEPOT ARMOURY READY</span>
          <div className="text-2xl font-bold text-[#152A20] font-headline font-mono-spec">{readyUnits} Units</div>
          <span className="text-[11px] text-[#152A20] font-semibold">100% Inspected & Prepped</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider">SANITIZATION HOLD</span>
          <div className="text-2xl font-bold text-[#D97845] font-headline font-mono-spec">{sanitizingCount} Units</div>
          <span className="text-[11px] text-[#5C665F]">Awaiting UV autoclave chamber</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider">PENDING PICKUPS TODAY</span>
          <div className="text-2xl font-bold text-[#111D16] font-headline font-mono-spec">{stationCustody.length} Orders</div>
          <span className="text-[11px] text-[#5C665F]">Allocated for dawn departure</span>
        </Card>
      </div>

      {/* Action Desk Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Return Intake */}
        <Card padding="md" className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#111D16] uppercase flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#152A20]" />
              EQUIPMENT RETURN DESK
            </h3>
            <Badge variant="primary">{stationCustody.length} DUE</Badge>
          </div>
          <p className="text-xs text-[#5C665F] font-body">
            Scan returned hardware passes, perform 5-point tensile & fabric inspection, and authorize instant escrow bond release.
          </p>
          <Link to="/staff/rentals" className="block pt-2">
            <Button variant="secondary" size="sm" fullWidth>Open Inspection Desk</Button>
          </Link>
        </Card>

        {/* Guided Tour Manifest */}
        <Card padding="md" className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#111D16] uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#D97845]" />
              TOUR DEPARTURE ROSTER
            </h3>
            <Badge variant="secondary">3 EXPEDITIONS</Badge>
          </div>
          <p className="text-xs text-[#5C665F] font-body">
            Verify climber squad rosters, beacon telemetry sync (406 MHz), and UIAGM guide safety clearance before departure.
          </p>
          <Link to="/staff/tours" className="block pt-2">
            <Button variant="secondary" size="sm" fullWidth>View Departure Roster</Button>
          </Link>
        </Card>

        {/* Inter-Branch Transfer Shuttle */}
        <Card padding="md" className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#111D16] uppercase flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#152A20]" />
              SHUTTLE LOGISTICS
            </h3>
            <Badge variant="neutral">5 DEPOTS</Badge>
          </div>
          <p className="text-xs text-[#5C665F] font-body">
            Request urgent gear courier from Hanoi HQ or Da Lat Highland Depot to fulfill high-altitude weekend summit demand.
          </p>
          {account?.role === 'ADMIN' && <Link to="/admin/transfers" className="block pt-2">
            <Button variant="secondary" size="sm" fullWidth>Dispatch Shuttle</Button>
          </Link>}
        </Card>
      </div>

      {/* Live Custody Ledger at Branch */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-[#D8D2C5] bg-[#EBE6DC] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#111D16] uppercase">ACTIVE FIELD MANIFESTS UNDER BRANCH CUSTODY</h3>
          <span className="text-xs text-[#5C665F] font-mono-spec">ESCROW PROTECTION ACTIVE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-label">
            <thead className="bg-[#EBE6DC]/60 text-[#7A857E] border-b border-[#D8D2C5] uppercase text-[10px]">
              <tr>
                <th className="p-3">Order / Climber</th>
                <th className="p-3">Gear Item</th>
                <th className="p-3">Period</th>
                <th className="p-3">Return Depot</th>
                <th className="p-3">Held Bond</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C5]">
              {custodyItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#EBE6DC]/30 transition">
                  <td className="p-3">
                    <div className="font-bold text-[#111D16]">#{item.orderNumber}</div>
                    <div className="text-[10px] text-[#7A857E]">{item.userName || 'Alex Rivers'}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-[#111D16]">{item.gearItem.name}</div>
                    <div className="text-[10px] text-[#7A857E] font-mono-spec">SKU: {item.gearItem.modelCode}</div>
                  </td>
                  <td className="p-3 font-mono-spec text-[11px]">
                    <div>{item.startDate}</div>
                    <div className="text-[#D97845] font-bold">Due: {item.dueDate}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant="neutral">{item.dropoffStation || 'Sapa Ridge Outpost'}</Badge>
                  </td>
                  <td className="p-3 font-bold text-[#152A20] font-mono-spec">
                    {formatCurrency(item.depositPaid)}
                  </td>
                  <td className="p-3 text-right">
                    <Link to="/staff/rentals">
                      <Button variant="primary" size="sm">Inspect & Release</Button>
                    </Link>
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
