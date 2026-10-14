export type StationStatus = 'OPTIMAL' | 'ALPINE_WARNING' | 'HIGH_DEMAND';

export interface OutpostStation {
  id: string;
  name: string;
  code: string;
  elevation: string;
  coordinates: string;
  region: string;
  address: string;
  phone: string;
  operatingHours?: string;
  staffCount?: number;
  depotManager?: string;
  imageUrl?: string;
  associatedTours?: string[];
  status: StationStatus;
  weather: {
    temp: string;
    condition: string;
    wind: string;
    visibility: string;
  };
  inventorySummary: {
    tentsAvailable: number;
    packsAvailable: number;
    hardwareAvailable: number;
    totalUnits: number;
  };
}

export interface InterBranchTransferRequest {
  id: string;
  originStationId: string;
  destStationId: string;
  gearId: string;
  gearName: string;
  quantity: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED';
  dispatchedAt: string;
  estimatedArrivalHours: number;
}
