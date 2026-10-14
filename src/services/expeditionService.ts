import { GuidedExpedition, ExpeditionBooking } from '../interfaces';
import { GUIDED_EXPEDITIONS } from '../data/mockData';
import { ApiService, ApiResponse } from './api';

export class ExpeditionService {
  public static async getExpeditions(): Promise<ApiResponse<GuidedExpedition[]>> {
    return ApiService.get<GuidedExpedition[]>('/expeditions', GUIDED_EXPEDITIONS);
  }

  public static async getExpeditionById(id: string): Promise<ApiResponse<GuidedExpedition | undefined>> {
    const exp = GUIDED_EXPEDITIONS.find((e) => e.id === id);
    return ApiService.get<GuidedExpedition | undefined>(`/expeditions/${id}`, exp);
  }

  public static async bookExpedition(
    expeditionId: string,
    climberCount: number,
    includeGearBundle: boolean,
    totalCost: number
  ): Promise<ApiResponse<ExpeditionBooking>> {
    const booking: ExpeditionBooking = {
      id: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      expeditionId,
      climberCount,
      includeGearBundle,
      totalCost,
      bookingDate: new Date().toISOString(),
      departureDate: 'Scheduled Launch',
      status: 'CONFIRMED',
    };
    return ApiService.post<ExpeditionBooking>('/expeditions/bookings', booking, booking);
  }
}
