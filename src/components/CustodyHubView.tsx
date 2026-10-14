import React, { useState } from 'react';
import { ActiveCustodyItem, UserRole } from '../types';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Camera, 
  PlusCircle, 
  Calendar, 
  Check, 
  RefreshCw, 
  Sparkles, 
  ArrowRight, 
  UserCheck 
} from 'lucide-react';

interface CustodyHubViewProps {
  custodyItems: ActiveCustodyItem[];
  userRole: UserRole;
  onExtendRental: (itemId: string, extraDays: number) => void;
  onClearCustody: (itemId: string) => void;
}

export const CustodyHubView: React.FC<CustodyHubViewProps> = ({
  custodyItems,
  userRole,
  onExtendRental,
  onClearCustody
}) => {
  const [selectedCustodyId, setSelectedCustodyId] = useState<string>(
    custodyItems[0]?.id || ''
  );
  const [checklistState, setChecklistState] = useState<{ [checkId: string]: boolean }>({
    'chk-1': true,
    'chk-2': true,
    'chk-3': true,
    'chk-4': false,
    'chk-5': false
  });
  const [showQrModal, setShowQrModal] = useState(false);
  const [inspectionNote, setInspectionNote] = useState('');
  const [inspectionPhotoAdded, setInspectionPhotoAdded] = useState(false);
  const [auditSuccessToast, setAuditSuccessToast] = useState(false);

  const activeItem = custodyItems.find((i) => i.id === selectedCustodyId) || custodyItems[0];

  const toggleCheck = (checkId: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [checkId]: !prev[checkId]
    }));
  };

  const handleSimulatePhoto = () => {
    setInspectionPhotoAdded(true);
    setInspectionNote('Groundsheet hydro-seal verified clean. No sharp rock punctures observed. Zipper sliders lubricated.');
  };

  const handleCompleteAudit = () => {
    setAuditSuccessToast(true);
    setTimeout(() => {
      setAuditSuccessToast(false);
      if (activeItem) {
        onClearCustody(activeItem.id);
      }
    }, 1800);
  };

  if (!activeItem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 font-label">
        <ShieldCheck className="w-12 h-12 text-[#737C75] mx-auto" />
        <h3 className="text-lg font-bold text-[#152A20] font-headline">NO ACTIVE GEAR IN CUSTODY</h3>
        <p className="text-xs text-[#5C665F] font-body">All rented field equipment has been inspected, sanitized, and returned to depot armouries.</p>
      </div>
    );
  }

  const percentElapsed = Math.min(100, Math.max(10, 100 - (activeItem.hoursRemaining / 72) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-label">
      {/* Header */}
      <div className="border-b border-[#D8D2C5] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-label text-[#152A20] font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-[#152A20]" />
            <span>FIELD CUSTODY & DIGITAL CONDITION AUDIT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#152A20] tracking-tight font-headline">
            ACTIVE EQUIPMENT CUSTODY LEDGER
          </h2>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="px-4 py-2.5 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-white font-label text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-xs"
          >
            <QrCode className="w-4 h-4 text-[#F3EFE6]" />
            <span>Station Return Pass QR</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List of Active Items in Field */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-label text-[#5C665F] font-bold uppercase tracking-wider">
            DEPLOYED FIELD ASSETS ({custodyItems.length})
          </div>

          <div className="space-y-3">
            {custodyItems.map((item) => {
              const isSelected = item.id === activeItem.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCustodyId(item.id)}
                  className={`p-4 rounded-xs border transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#F3EFE6] border-[#152A20] shadow-sm ring-1 ring-[#152A20]'
                      : 'bg-[#F3EFE6]/70 border-[#D8D2C5] hover:border-[#CCC6B9]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.gearItem.imageUrl}
                      alt={item.gearItem.name}
                      className="w-16 h-16 rounded-xs object-cover bg-[#E7E2D8]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-label font-bold text-[#152A20]">
                          MANIFEST #{item.orderNumber}
                        </span>
                        <span className="text-[10px] font-label font-bold px-2 py-0.5 rounded-md bg-[#FDF2EC] text-[#D97845] border border-[#F1BA9B]">
                          {item.hoursRemaining}H REMAINING
                        </span>
                      </div>
                      <h4 className="font-bold text-[#152A20] text-sm truncate mt-0.5 font-headline">
                        {item.gearItem.name}
                      </h4>
                      <div className="text-[11px] text-[#5C665F] font-label mt-1">
                        <span>Due: {item.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Extend Action Card */}
          <div className="bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-4 space-y-3 font-label">
            <div className="flex items-center justify-between text-xs text-[#152A20]">
              <span className="flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5 text-[#152A20]" />
                DELAYED AT RIDGE CAMP?
              </span>
              <span className="text-[#5C665F] text-[11px] font-medium">Instant Extension</span>
            </div>
            <p className="text-[11px] text-[#4A524C] font-body">
              Extend field custody by 2 additional days with zero late fee penalty. Daily rate automatically billed to registered card.
            </p>
            <button
              onClick={() => onExtendRental(activeItem.id, 2)}
              className="w-full py-2.5 rounded-xs bg-[#F3EFE6] hover:bg-[#DDD7CB] text-[#152A20] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-[#D8D2C5]"
            >
              <PlusCircle className="w-4 h-4 text-[#152A20]" />
              <span>Extend Custody +2 Days (${activeItem.dailyRate * 2})</span>
            </button>
          </div>
        </div>

        {/* Right Column: Digital Inspection Terminal & Return Station Handoff */}
        <div className="lg:col-span-7 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs p-6 shadow-sm space-y-6">
          {/* Top Custody Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D8D2C5] gap-3">
            <div>
              <span className="text-[10px] font-label font-bold px-2.5 py-0.5 rounded-md bg-[#152A20] text-white">
                ACTIVE CUSTODY ID: {activeItem.orderNumber}
              </span>
              <h3 className="text-lg font-bold text-[#152A20] mt-1 font-headline">
                {activeItem.gearItem.name}
              </h3>
              <div className="text-xs font-label text-[#5C665F] mt-0.5">
                Serial Code: {activeItem.gearItem.modelCode} • Bond Held: ${activeItem.depositPaid}
              </div>
            </div>

            <div className="text-right font-label">
              <span className="text-[10px] text-[#737C75] font-semibold">TARGET DROP-OFF:</span>
              <div className="text-xs font-bold text-[#152A20]">Sapa Ridge Outpost (SP-1604)</div>
            </div>
          </div>

          {/* Custody Time Countdown Meter */}
          <div className="space-y-1.5 font-label">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5C665F] font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D97845]" />
                CUSTODY TIMELINE PROGRESS
              </span>
              <span className="text-[#152A20] font-bold">{activeItem.hoursRemaining} Hours to Deadline</span>
            </div>
            {/* Visual progress bar matching screenshot design with #152A20 & #D97845 */}
            <div className="h-2 w-full bg-[#E5E0D5] rounded-full overflow-hidden border border-[#D8D2C5]">
              <div 
                className="h-full bg-gradient-to-r from-[#152A20] via-[#2E523E] to-[#D97845] rounded-full transition-all duration-500"
                style={{ width: `${percentElapsed}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-[#737C75] pt-0.5">
              <span>Handoff: {activeItem.startDate}</span>
              <span>Deadline: {activeItem.dueDate}</span>
            </div>
          </div>

          {/* Digital Inspection Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-label">
              <h4 className="text-xs text-[#152A20] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#152A20]" />
                FIVE-POINT CONDITION AUDIT CHECKLIST
              </h4>
              <span className="text-[10px] text-[#737C75]">
                Tap items to toggle verification
              </span>
            </div>

            <div className="space-y-2">
              {activeItem.inspectionChecklist.map((chk) => {
                const isChecked = checklistState[chk.id] ?? (chk.status === 'passed');
                return (
                  <div
                    key={chk.id}
                    onClick={() => toggleCheck(chk.id)}
                    className={`p-3 rounded-xs border flex items-center justify-between transition cursor-pointer select-none ${
                      isChecked
                        ? 'bg-[#EAE5DB] border-[#152A20] text-[#152A20]'
                        : 'bg-[#F3EFE6] border-[#D8D2C5] text-[#5C665F]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox square matching screenshot label button style */}
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isChecked
                          ? 'bg-[#152A20] border-[#152A20] text-white font-bold'
                          : 'border-[#CCC6B9] bg-[#F3EFE6]'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-label font-medium">{chk.item}</span>
                    </div>

                    <span className={`text-[10px] font-label font-bold px-2 py-0.5 rounded-md ${
                      isChecked
                        ? 'bg-[#152A20] text-white'
                        : 'bg-[#E5E0D5] text-[#737C75]'
                    }`}>
                      {isChecked ? 'PASSED' : 'PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Photo Inspection Simulator & Notes */}
          <div className="bg-[#EBE6DC] p-4 rounded-xs border border-[#D8D2C5] space-y-3 font-label">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#152A20] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#152A20]" />
                OPTICAL DEPLOYMENT & RETURN LOGGING
              </span>
              <button
                onClick={handleSimulatePhoto}
                className="text-xs font-bold text-[#D97845] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{inspectionPhotoAdded ? 'Retake Photo' : 'Capture Inspection Frame'}</span>
              </button>
            </div>

            {inspectionPhotoAdded ? (
              <div className="flex items-center gap-3 p-2.5 bg-[#F3EFE6] rounded-xs border border-[#D8D2C5]">
                <div className="w-14 h-14 rounded-lg bg-[#E7E2D8] overflow-hidden shrink-0 border border-[#152A20]">
                  <img
                    src={activeItem.gearItem.imageUrl}
                    alt="Inspect frame"
                    className="w-full h-full object-cover filter brightness-105"
                  />
                </div>
                <div className="text-[11px] text-[#152A20]">
                  <span className="text-[#152A20] font-bold">✓ High-Res Macro Frame Attached</span>
                  <p className="text-[#5C665F] text-[10px] mt-0.5 font-body">{inspectionNote}</p>
                </div>
              </div>
            ) : (
              <div 
                onClick={handleSimulatePhoto}
                className="border-2 border-dashed border-[#CCC6B9] hover:border-[#152A20] rounded-xs p-4 text-center cursor-pointer transition bg-[#F3EFE6]/50"
              >
                <Camera className="w-6 h-6 text-[#737C75] mx-auto mb-1" />
                <span className="text-xs text-[#152A20] font-bold block">Click to capture high-resolution gear inspection photo</span>
                <span className="text-[10px] text-[#737C75] block font-body">Records seam condition, pole sleeves & zip tracks</span>
              </div>
            )}
          </div>

          {/* Clearance Button */}
          <div className="pt-3 border-t border-[#D8D2C5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-label">
            <div>
              <div className="text-[10px] text-[#5C665F] font-bold">REFUNDABLE SECURITY BOND:</div>
              <div className="text-lg font-bold text-[#152A20] font-headline">${activeItem.depositPaid}.00 ESCROW</div>
              <div className="text-[10px] text-[#737C75]">Instant credit release upon station check-in scan</div>
            </div>

            <button
              onClick={handleCompleteAudit}
              disabled={auditSuccessToast}
              className="px-6 py-3 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-white font-label font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {auditSuccessToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>DEPOSIT RELEASED & GEAR CLEARED!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Return & Release Bond</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* QR Return Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-label">
          <div className="w-full max-w-sm bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs p-6 space-y-4 text-center shadow-2xl">
            <div className="text-xs text-[#152A20] font-bold uppercase tracking-wider font-headline">
              TERRAPEAK STATION SCAN PASS
            </div>
            <div className="bg-white p-5 rounded-xs mx-auto w-48 h-48 flex items-center justify-center shadow-inner border border-[#D8D2C5]">
              <QrCode className="w-40 h-40 text-[#152A20]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#152A20] font-headline">MANIFEST #{activeItem.orderNumber}</div>
              <div className="text-xs text-[#5C665F] mt-1 font-body">Present this QR at Sapa Ridge Outpost for touchless gear check-in</div>
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-white text-xs font-bold transition cursor-pointer"
            >
              Close Return Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
