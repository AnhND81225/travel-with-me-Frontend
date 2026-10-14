import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ActiveCustodyItem } from '../../interfaces';
import { Card, Button, Badge } from '../../components/ui';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  QrCode, 
  Clock, 
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const StaffRentalsPage: React.FC = () => {
  const { custodyItems, clearCustody, selectedStation } = useAppStore();
  const [activeItem, setActiveItem] = useState<ActiveCustodyItem | null>(custodyItems[0] || null);

  // 5-point inspection checklist
  const [checklist, setChecklist] = useState({
    fabricTears: true,
    zipperTeeth: true,
    hardwareFatigue: true,
    seamSealIntact: true,
    soilCleanliness: true,
  });

  const [conditionGrade, setConditionGrade] = useState<'A+' | 'A' | 'B' | 'C'>('A+');
  const [damageFee, setDamageFee] = useState(0);
  const [completedNotice, setCompletedNotice] = useState<string | null>(null);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAuthorizeReturn = () => {
    if (!activeItem) return;
    const bondRelease = Math.max(0, activeItem.depositPaid - damageFee);
    clearCustody(activeItem.id);
    setCompletedNotice(
      `Return finalized for ${activeItem.gearItem.name}. Released bond: ${formatCurrency(bondRelease)}${
        damageFee > 0 ? ` (Deducted fee: ${formatCurrency(damageFee)})` : ''
      }. Item routed to sanitization.`
    );
    setActiveItem(custodyItems.find((c) => c.id !== activeItem.id) || null);
    setTimeout(() => setCompletedNotice(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">INTAKE & INSPECTION LAB</Badge>
            <span className="text-xs text-[#5C665F]">BRANCH: {selectedStation.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Rental Operations, Handoff & Optical Audit
          </h1>
          <p className="text-xs text-[#5C665F]">
            Validate return condition against 5-point technical checklist and execute automated escrow bond settlement.
          </p>
        </div>

        <div className="text-right">
          <Badge variant="secondary">{custodyItems.length} ACTIVE MANIFESTS IN FIELD</Badge>
        </div>
      </div>

      {completedNotice && (
        <div className="p-3.5 bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs text-xs font-bold text-[#152A20] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#152A20]" />
          <span>{completedNotice}</span>
        </div>
      )}

      {custodyItems.length === 0 ? (
        <Card padding="lg" className="text-center py-20 space-y-3">
          <ShieldCheck className="w-12 h-12 text-[#7A857E] mx-auto" />
          <h3 className="text-base font-bold text-[#111D16] font-headline uppercase">All Field Gear Accounted For</h3>
          <p className="text-xs text-[#5C665F] font-body max-w-sm mx-auto">
            No pending returns for this station at present. Ready units are prepped in depot armouries.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Items Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-bold text-[#5C665F] uppercase tracking-wider block">
              Awaiting Return Audit:
            </span>

            <div className="space-y-2">
              {custodyItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className={`p-3 rounded-xs border cursor-pointer transition text-xs ${
                    activeItem?.id === item.id
                      ? 'bg-[#152A20] text-white border-[#152A20]'
                      : 'bg-[#F8F6F1] hover:bg-[#EBE6DC] text-[#111D16] border-[#D8D2C5]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">MANIFEST #{item.orderNumber}</span>
                    <span className="text-[10px] font-mono-spec">Due: {item.dueDate}</span>
                  </div>
                  <h4 className="font-bold font-headline mt-1 truncate">{item.gearItem.name}</h4>
                  <div className="flex justify-between items-center text-[10px] mt-1 text-[#D7ECE1]">
                    <span>Renter: {item.userName || 'Alex Rivers'}</span>
                    <span className="font-bold">Bond: {formatCurrency(item.depositPaid)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspection Terminal (8 cols) */}
          {activeItem && (
            <div className="lg:col-span-8 space-y-4">
              <Card padding="md" className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8D2C5]">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeItem.gearItem.imageUrl}
                      alt={activeItem.gearItem.name}
                      className="w-16 h-16 rounded-xs object-cover bg-[#E7E2D8] border border-[#D8D2C5]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">MANIFEST #{activeItem.orderNumber}</Badge>
                        <span className="text-xs text-[#7A857E] font-mono-spec">SKU: {activeItem.gearItem.modelCode}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#111D16] font-headline mt-0.5">{activeItem.gearItem.name}</h3>
                      <span className="text-xs text-[#5C665F]">Renter: <strong>{activeItem.userName || 'Alex Rivers'}</strong></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#5C665F] font-bold block uppercase">Held Security Bond:</span>
                    <span className="text-xl font-bold text-[#152A20] font-headline font-mono-spec">{formatCurrency(activeItem.depositPaid)}</span>
                  </div>
                </div>

                {/* 5-Point Technical Checklist */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[#111D16] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#152A20]" />
                      5-POINT OPTICAL & STRUCTURAL CHECKLIST
                    </h4>
                    <span className="text-[10px] text-[#7A857E]">Click to toggle pass/fail</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleCheck('fabricTears')}
                      className={`p-2.5 rounded-xs border text-left flex items-center justify-between transition cursor-pointer ${
                        checklist.fabricTears
                          ? 'bg-[#E0EFE6] border-[#ADCBBB] text-[#152A20]'
                          : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]'
                      }`}
                    >
                      <span>1. Fabric Integrity (Zero Tears / Abrasion)</span>
                      <span className="font-bold">{checklist.fabricTears ? 'PASS' : 'FAIL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCheck('zipperTeeth')}
                      className={`p-2.5 rounded-xs border text-left flex items-center justify-between transition cursor-pointer ${
                        checklist.zipperTeeth
                          ? 'bg-[#E0EFE6] border-[#ADCBBB] text-[#152A20]'
                          : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]'
                      }`}
                    >
                      <span>2. YKK Zippers & Teeth Engagement</span>
                      <span className="font-bold">{checklist.zipperTeeth ? 'PASS' : 'FAIL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCheck('hardwareFatigue')}
                      className={`p-2.5 rounded-xs border text-left flex items-center justify-between transition cursor-pointer ${
                        checklist.hardwareFatigue
                          ? 'bg-[#E0EFE6] border-[#ADCBBB] text-[#152A20]'
                          : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]'
                      }`}
                    >
                      <span>3. DAC Poles & Hardware Fatigue</span>
                      <span className="font-bold">{checklist.hardwareFatigue ? 'PASS' : 'FAIL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCheck('seamSealIntact')}
                      className={`p-2.5 rounded-xs border text-left flex items-center justify-between transition cursor-pointer ${
                        checklist.seamSealIntact
                          ? 'bg-[#E0EFE6] border-[#ADCBBB] text-[#152A20]'
                          : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]'
                      }`}
                    >
                      <span>4. Polyurethane Seam Taping</span>
                      <span className="font-bold">{checklist.seamSealIntact ? 'PASS' : 'FAIL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCheck('soilCleanliness')}
                      className={`p-2.5 rounded-xs border text-left flex items-center justify-between transition cursor-pointer sm:col-span-2 ${
                        checklist.soilCleanliness
                          ? 'bg-[#E0EFE6] border-[#ADCBBB] text-[#152A20]'
                          : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]'
                      }`}
                    >
                      <span>5. Soil & Humidity Standard (Ready for Sanitization)</span>
                      <span className="font-bold">{checklist.soilCleanliness ? 'PASS' : 'FAIL'}</span>
                    </button>
                  </div>
                </div>

                {/* Grading & Deductions */}
                <div className="pt-3 border-t border-[#D8D2C5] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">ASSIGN RETURN GRADE:</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['A+', 'A', 'B', 'C'] as const).map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => setConditionGrade(grade)}
                          className={`py-1.5 rounded-xs border text-center font-bold cursor-pointer transition ${
                            conditionGrade === grade
                              ? 'bg-[#152A20] text-white border-[#152A20]'
                              : 'bg-[#EBE6DC] text-[#111D16] border-[#D8D2C5]'
                          }`}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">DAMAGE FEE DEDUCTION ($):</label>
                    <input
                      type="number"
                      min="0"
                      max={activeItem.depositPaid}
                      value={damageFee}
                      onChange={(e) => setDamageFee(Number(e.target.value))}
                      className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-1.5 font-bold text-[#111D16] text-xs font-mono-spec"
                    />
                    <span className="text-[10px] text-[#7A857E]">Deducted from refundable security bond</span>
                  </div>
                </div>

                {/* Final Settlement Summary */}
                <div className="pt-4 border-t border-[#D8D2C5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-[#5C665F] font-bold block uppercase">NET BOND RETURNED TO CUSTOMER:</span>
                    <span className="text-2xl font-bold text-[#152A20] font-headline font-mono-spec">
                      {formatCurrency(Math.max(0, activeItem.depositPaid - damageFee))}
                    </span>
                  </div>

                  <Button
                    variant="accent"
                    size="lg"
                    onClick={handleAuthorizeReturn}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Release Bond & Send to UV Lab
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
