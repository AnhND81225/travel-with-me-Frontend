import { OutpostStation, InterBranchTransferRequest } from '../interfaces';
import { OUTPOSTS } from '../data/mockData';
import { ApiService, ApiResponse } from './api';

export class OutpostService {
  public static async getOutposts(): Promise<ApiResponse<OutpostStation[]>> {
    return ApiService.get<OutpostStation[]>('/outposts', OUTPOSTS);
  }

  public static async getOutpostById(id: string): Promise<ApiResponse<OutpostStation | undefined>> {
    const station = OUTPOSTS.find((s) => s.id === id);
    return ApiService.get<OutpostStation | undefined>(`/outposts/${id}`, station);
  }

  public static async dispatchTransfer(
    originId: string,
    destId: string,
    gearId: string,
    quantity: number
  ): Promise<ApiResponse<InterBranchTransferRequest>> {
    const transfer: InterBranchTransferRequest = {
      id: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
      originStationId: originId,
      destStationId: destId,
      gearId,
      gearName: 'Alpine Equipment Asset',
      quantity,
      status: 'IN_TRANSIT',
      dispatchedAt: new Date().toISOString(),
      estimatedArrivalHours: 14.5,
    };
    return ApiService.post<InterBranchTransferRequest>('/outposts/transfers', { originId, destId, gearId, quantity }, transfer);
  }
}
