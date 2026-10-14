import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { ShieldCheck, CheckCircle2, ArrowLeft, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

export const CustodyInspectionPage: React.FC = () => {
  const { custodyItems, clearCustody } = useAppStore();
  const [clearedToast, setClearedToast] = useState<string | null>(null);

  const handleClear = (id: string, name: string, bond: number) => {
    clearCustody(id);
    setClearedToast(`Deposit bond of ${formatCurrency(bond)} released for ${name}. Returned to depot ledger.`);
    setTimeout(() => setClearedToast(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Command Center</span>
      </Link>

      <div className="border-b border-[#D8D2C5] pb-4">
        <Badge variant="primary">STATION INTAKE DESK</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-1">
          Ranger Return Audit & Bond Release Terminal
        </h1>
        <p className="text-xs text-[#5C665F]">Scan returned hardware, verify condition checklist, and release digital escrow bonds.</p>
      </div>

      {clearedToast && (
        <div className="p-3.5 bg-[#E0EFE6] border border-[#ADCBBB] rounded-xs text-xs font-bold text-[#152A20] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{clearedToast}</span>
        </div>
      )}

      {custodyItems.length === 0 ? (
        <Card padding="lg" className="text-center py-16 space-y-2">
          <ShieldCheck className="w-10 h-10 text-[#A39B8D] mx-auto" />
          <h3 className="text-base font-bold text-[#152A20] font-headline">NO PENDING RETURNS</h3>
          <p className="text-xs text-[#5C665F]">All field gear is reconciled in depot armouries.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {custodyItems.map((item) => (
            <Card key={item.id} padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={item.gearItem.imageUrl} alt={item.gearItem.name} className="w-16 h-16 rounded-xs object-cover border border-[#D8D2C5]" />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">MANIFEST #{item.orderNumber}</Badge>
                    <span className="text-xs text-[#737C75]">Due: {item.dueDate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#152A20] font-headline mt-1">{item.gearItem.name}</h4>
                  <div className="text-xs text-[#D97845] font-bold">Held Escrow Bond: {formatCurrency(item.depositPaid)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/custody/${item.id}/audit`}>
                  <Button variant="secondary" size="md">
                    Inspect 5-Points
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleClear(item.id, item.gearItem.name, item.depositPaid)}
                >
                  Verify & Release Bond
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
