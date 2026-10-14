import { GearItem } from './gear.interface';

export type CustodyStatus = 
  | 'ACTIVE_IN_FIELD' 
  | 'OVERDUE' 
  | 'AWAITING_INSPECTION' 
  | 'RETURNED_CLEARED';

export interface InspectionCheckItem {
  id: string;
  item: string;
  status: 'passed' | 'warning' | 'pending';
  note?: string;
}

export interface ConditionAuditLog {
  timestamp: string;
  inspector: string;
  notes: string;
  photoUrl?: string;
}

export interface ActiveCustodyItem {
  id: string;
  orderNumber: string;
  gearItem: GearItem;
  pickupOutpostId: string;
  returnOutpostId: string;
  startDate: string;
  dueDate: string;
  hoursRemaining: number;
  depositPaid: number;
  dailyRate: number;
  status: CustodyStatus;
  userName?: string;
  dropoffStation?: string;
  inspectionChecklist: InspectionCheckItem[];
  conditionLog?: ConditionAuditLog[];
}
