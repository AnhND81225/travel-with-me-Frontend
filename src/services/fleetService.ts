import { FleetGearUnit, FleetCustodyState } from '../interfaces';
import { MOCK_FLEET_UNITS } from '../data/mockData';
import { ApiService, ApiResponse } from './api';

export class FleetService {
  public static async getFleetUnits(): Promise<ApiResponse<FleetGearUnit[]>> {
    return ApiService.get<FleetGearUnit[]>('/fleet', MOCK_FLEET_UNITS);
  }

  public static async updateUnitCustody(
    serialNumber: string,
    custodyState: FleetCustodyState
  ): Promise<ApiResponse<{ serialNumber: string; custodyState: FleetCustodyState }>> {
    return ApiService.post('/fleet/status', { serialNumber, custodyState }, { serialNumber, custodyState });
  }

  public static async completeSanitization(
    serialNumber: string
  ): Promise<ApiResponse<{ serialNumber: string; conditionScore: number }>> {
    return ApiService.post('/fleet/sanitize', { serialNumber }, {
      serialNumber,
      conditionScore: 98,
    });
  }
}
