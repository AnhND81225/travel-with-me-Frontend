import { OutpostStation, InterBranchTransferRequest } from '../interfaces';
import { catalogApi, Branch } from '../features/equipment/catalogApi';
import { ApiService, ApiResponse } from './api';

export class OutpostService {
  public static async getOutposts(): Promise<ApiResponse<OutpostStation[]>> {
    try {
      const branches = await catalogApi<Branch[]>('/branches');
      if (branches && branches.length > 0) {
        const stations: OutpostStation[] = branches.map((b) => ({
          id: `branch-${b.id}`,
          name: b.name,
          code: `DEPOT-${b.id}`,
          elevation: '1,500M',
          coordinates: '21.0285° N, 105.8542° E',
          region: b.address || 'Việt Nam',
          address: b.address || 'Chưa cập nhật địa chỉ',
          phone: b.phone || '1900-TERRAPEAK',
          operatingHours: '06:00 - 21:00 Hàng ngày',
          staffCount: 0,
          depotManager: 'Trưởng trạm quản lý',
          status: b.status === 'ACTIVE' ? 'OPTIMAL' : 'ALPINE_WARNING',
          weather: {
            temp: '18°C',
            condition: 'Ổn định',
            wind: '12 km/h',
            visibility: '10 km',
          },
          inventorySummary: {
            tentsAvailable: 0,
            packsAvailable: 0,
            hardwareAvailable: 0,
            totalUnits: 0,
          },
        }));
        return { data: stations, status: 200, timestamp: new Date().toISOString() };
      }
    } catch (err) {
      console.warn("Không thể tải danh sách trạm từ backend /branches:", err);
    }
    return { data: [], status: 200, timestamp: new Date().toISOString() };
  }

  public static async getOutpostById(id: string): Promise<ApiResponse<OutpostStation | undefined>> {
    const listRes = await this.getOutposts();
    const station = listRes.data?.find((s) => s.id === id);
    return { data: station, status: 200, timestamp: new Date().toISOString() };
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
