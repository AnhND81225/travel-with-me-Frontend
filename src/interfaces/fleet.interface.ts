export type FleetCustodyState = 
  | 'AVAILABLE_IN_DEPOT' 
  | 'DEPLOYED_TO_FIELD' 
  | 'SANITIZATION_HOLD' 
  | 'MAINTENANCE_REQUIRED';

export interface FleetGearUnit {
  serialNumber: string;
  modelCode: string;
  gearId: string;
  gearName: string;
  currentStationId: string;
  custodyState: FleetCustodyState;
  fieldDeploymentsCount: number;
  lastInspectionDate: string;
  conditionScore: number;
  rfidTag: string;
  lastSanitizedDate?: string;
}

export interface SanitizationLogEntry {
  id: string;
  serialNumber: string;
  gearName: string;
  timestamp: string;
  operator: string;
  uvCycleDurationMins: number;
  autoclavePassed: boolean;
  notes: string;
}
