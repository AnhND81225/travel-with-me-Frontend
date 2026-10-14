import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useCustodyAudit } from '../../hooks/useCustodyAudit';
import { Card, Button, Badge } from '../../components/ui';
import { ArrowLeft, ShieldCheck, Camera, Check, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ConditionAuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { custodyItems, clearCustody } = useAppStore();

  const item = custodyItems.find((c) => c.id === id) || custodyItems[0];
  const {
    checklistState,
    toggleCheck,
    inspectionPhotoAdded,
    inspectionNote,
    simulatePhotoCapture,
    allPassed,
  } = useCustodyAudit(item?.inspectionChecklist || []);

  const handleComplete = () => {
    if (item) {
      clearCustody(item.id);
      navigate('/custody');
    }
  };

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center font-label">
        <h3 className="text-base font-bold text-[#152A20]">Custody record not found</h3>
        <Link to="/custody" className="text-xs text-[#D97845] underline mt-2 block">Back to Custody Ledger</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <Link to="/custody" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Custody Ledger</span>
      </Link>

      <div className="border-b border-[#D8D2C5] pb-4">
        <Badge variant="primary">DIGITAL CONDITION AUDIT</Badge>
        <h1 className="text-2xl font-bold text-[#152A20] font-headline mt-1">
          Inspection Checklist: {item.gearItem.name}
        </h1>
        <p className="text-xs text-[#5C665F]">Manifest #{item.orderNumber} • Escrow Bond: {formatCurrency(item.depositPaid)}</p>
      </div>

      <div className="space-y-4">
        {item.inspectionChecklist.map((chk) => {
          const isPassed = checklistState[chk.id];
          return (
            <Card
              key={chk.id}
              padding="sm"
              onClick={() => toggleCheck(chk.id)}
              className={`flex items-center justify-between cursor-pointer ${
                isPassed ? 'bg-[#EAE5DB] border-[#152A20]' : 'bg-[#F3EFE6]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  isPassed ? 'bg-[#152A20] text-white border-[#152A20]' : 'bg-[#F3EFE6] border-[#CCC6B9]'
                }`}>
                  {isPassed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="text-xs font-medium text-[#152A20]">{chk.item}</span>
              </div>
              <Badge variant={isPassed ? 'success' : 'neutral'}>
                {isPassed ? 'PASSED' : 'PENDING'}
              </Badge>
            </Card>
          );
        })}
      </div>

      {/* Optical Frame */}
      <Card padding="md" className="space-y-3 bg-[#EBE6DC]">
        <div className="flex justify-between items-center text-xs font-bold text-[#152A20]">
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#152A20]" />
            HIGH-RES FIELD MACRO PHOTO
          </span>
          <button
            onClick={simulatePhotoCapture}
            className="text-[#D97845] hover:underline cursor-pointer"
          >
            {inspectionPhotoAdded ? 'Retake Optical Frame' : 'Capture Optical Scan'}
          </button>
        </div>

        {inspectionPhotoAdded ? (
          <div className="flex items-center gap-3 p-3 bg-[#F8F6F1] rounded-xs border border-[#D8D2C5]">
            <img src={item.gearItem.imageUrl} alt="Frame" className="w-16 h-16 rounded-xs object-cover border border-[#D8D2C5]" />
            <div className="text-xs">
              <span className="font-bold text-[#152A20]">✓ Verified Optical Frame Attached</span>
              <p className="text-[11px] text-[#5C665F] font-body mt-0.5">{inspectionNote}</p>
            </div>
          </div>
        ) : (
          <div
            onClick={simulatePhotoCapture}
            className="border-2 border-dashed border-[#CCC6B9] p-6 text-center rounded-xs cursor-pointer hover:border-[#152A20]"
          >
            <Camera className="w-6 h-6 text-[#737C75] mx-auto mb-1" />
            <span className="text-xs font-bold text-[#111D16] block uppercase">Click to capture high-resolution return photo</span>
          </div>
        )}
      </Card>

      <div className="flex justify-between items-center pt-4 border-t border-[#D8D2C5]">
        <div>
          <span className="text-[10px] text-[#5C665F] font-bold block">REFUNDABLE BOND RELEASE:</span>
          <span className="text-lg font-bold text-[#152A20] font-headline">{formatCurrency(item.depositPaid)}</span>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleComplete}
        >
          Submit Inspection & Release Bond
        </Button>
      </div>
    </div>
  );
};
