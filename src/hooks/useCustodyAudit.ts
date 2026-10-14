import { useState } from 'react';
import { ActiveCustodyItem } from '../interfaces';

export function useCustodyAudit(initialChecklist: { id: string; status: 'passed' | 'warning' | 'pending' }[]) {
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    initialChecklist.forEach((chk) => {
      initial[chk.id] = chk.status === 'passed';
    });
    return initial;
  });

  const [inspectionPhotoAdded, setInspectionPhotoAdded] = useState(false);
  const [inspectionNote, setInspectionNote] = useState('');
  const [isAuditSubmitting, setIsAuditSubmitting] = useState(false);

  const toggleCheck = (checkId: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [checkId]: !prev[checkId],
    }));
  };

  const simulatePhotoCapture = () => {
    setInspectionPhotoAdded(true);
    setInspectionNote('Macro optic scan verified. Hydro-seal intact. No seam tape degradation or ferrule hairline cracks detected.');
  };

  const allPassed = Object.values(checklistState).every(Boolean);

  return {
    checklistState,
    toggleCheck,
    inspectionPhotoAdded,
    inspectionNote,
    simulatePhotoCapture,
    isAuditSubmitting,
    setIsAuditSubmitting,
    allPassed,
  };
}
