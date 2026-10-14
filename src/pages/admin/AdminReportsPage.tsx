import React from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { BarChart3, TrendingUp, DollarSign, ShieldCheck, Download, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const AdminReportsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">BUSINESS INTELLIGENCE</Badge>
            <span className="text-xs text-[#5C665F]">FY2026 Q4 SUMMARY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Executive Analytics & Financial Performance
          </h1>
          <p className="text-xs text-[#5C665F]">
            Revenue stream attribution across retail equipment, high-altitude field rentals, and guided expeditions.
          </p>
        </div>

        <Button variant="secondary" size="md" icon={<Download className="w-4 h-4" />}>
          Export Financial Report (CSV)
        </Button>
      </div>

      {/* Top Level Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider">GROSS REVENUE (MTD)</span>
          <div className="text-2xl font-bold text-[#152A20] font-headline font-mono-spec">$148,920.00</div>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs previous cycle
          </span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider">FIELD RENTAL REVENUE</span>
          <div className="text-2xl font-bold text-[#D97845] font-headline font-mono-spec">$64,300.00</div>
          <span className="text-[11px] text-[#5C665F]">43.2% of total turnover</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider">GUIDED EXPEDITIONS</span>
          <div className="text-2xl font-bold text-[#111D16] font-headline font-mono-spec">$52,480.00</div>
          <span className="text-[11px] text-[#5C665F]">35.2% of total turnover</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider">ESCROW DAMAGE RATIO</span>
          <div className="text-2xl font-bold text-[#152A20] font-headline font-mono-spec">0.6%</div>
          <span className="text-[11px] text-emerald-700 font-bold">99.4% Integrity Index</span>
        </Card>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="md" className="space-y-4">
          <div className="border-b border-[#D8D2C5] pb-3 flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#111D16] uppercase">REVENUE CONTRIBUTION BY SECTOR</h3>
            <span className="text-xs text-[#7A857E]">OCTOBER 2026</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1 font-bold">
                <span>Field Equipment Technical Rentals</span>
                <span className="font-mono-spec">$64,300 (43%)</span>
              </div>
              <div className="w-full bg-[#EBE6DC] h-2 rounded-xs overflow-hidden">
                <div className="bg-[#152A20] h-full" style={{ width: '43%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-bold">
                <span>UIAGM Guided Wilderness Expeditions</span>
                <span className="font-mono-spec">$52,480 (35%)</span>
              </div>
              <div className="w-full bg-[#EBE6DC] h-2 rounded-xs overflow-hidden">
                <div className="bg-[#D97845] h-full" style={{ width: '35%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-bold">
                <span>Retail Equipment Acquisition</span>
                <span className="font-mono-spec">$32,140 (22%)</span>
              </div>
              <div className="w-full bg-[#EBE6DC] h-2 rounded-xs overflow-hidden">
                <div className="bg-[#1F3D2B] h-full" style={{ width: '22%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card padding="md" className="space-y-4">
          <div className="border-b border-[#D8D2C5] pb-3 flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#111D16] uppercase">DEPOT UTILIZATION RANKINGS</h3>
            <span className="text-xs text-[#7A857E]">FLEET ACTIVE RATIO</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5]">
              <div>
                <div className="font-bold text-[#111D16]">1. Sapa Ridge Outpost (SP-1604)</div>
                <div className="text-[10px] text-[#5C665F]">Peak Fansipan traverse traffic</div>
              </div>
              <Badge variant="primary">94% Active</Badge>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5]">
              <div>
                <div className="font-bold text-[#111D16]">2. Ha Giang Frontier Station (HG-1020)</div>
                <div className="text-[10px] text-[#5C665F]">Ma Pi Leng gorge trekking squads</div>
              </div>
              <Badge variant="primary">88% Active</Badge>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5]">
              <div>
                <div className="font-bold text-[#111D16]">3. Da Lat Highland Depot (DL-1500)</div>
                <div className="text-[10px] text-[#5C665F]">Bidoup cloud forest expeditions</div>
              </div>
              <Badge variant="neutral">76% Active</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
