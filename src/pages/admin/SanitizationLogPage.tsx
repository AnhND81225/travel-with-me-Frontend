import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SanitizationLogPage: React.FC = () => {
  const { fleetUnits, sanitizeUnit } = useAppStore();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const unitsInHold = fleetUnits.filter((u) => u.custodyState === 'SANITIZATION_HOLD');

  const handleRunUV = (serial: string) => {
    sanitizeUnit(serial);
    setSuccessToast(`Autoclave & UV sanitization cycle completed for serial ${serial}. Unit returned to ready status.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Command Center</span>
      </Link>

      <div className="border-b border-[#D8D2C5] pb-4">
        <Badge variant="secondary">HOSPITAL-GRADE LAB</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-1">
          UV Chamber & Autoclave Sanitization Queue
        </h1>
        <p className="text-xs text-[#5C665F]">Mandatory post-expedition decontamination for thermal insulation and technical shelters.</p>
      </div>

      {successToast && (
        <div className="p-3.5 bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs text-xs font-bold text-[#152A20] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {unitsInHold.length === 0 ? (
        <Card padding="lg" className="text-center py-16 space-y-2">
          <Sparkles className="w-10 h-10 text-[#A39B8D] mx-auto" />
          <h3 className="text-base font-bold text-[#152A20] font-headline">SANITIZATION QUEUE IS CLEAR</h3>
          <p className="text-xs text-[#5C665F]">All returned equipment has undergone certified decontamination cycles.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {unitsInHold.map((unit) => (
            <Card key={unit.serialNumber} padding="md" className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">SANITIZATION HOLD</Badge>
                  <span className="text-xs font-bold text-[#152A20]">{unit.serialNumber}</span>
                </div>
                <h4 className="text-sm font-bold text-[#152A20] font-headline mt-1">{unit.gearName}</h4>
                <span className="text-[11px] text-[#737C75]">Wear Score: {unit.conditionScore}% • Deployments: {unit.fieldDeploymentsCount}</span>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleRunUV(unit.serialNumber)}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Execute 30m UV Chamber
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
