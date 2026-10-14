import { ActiveCustodyItem } from '../interfaces';
import { MOCK_ACTIVE_CUSTODY } from '../data/mockData';
import { ApiService, ApiResponse } from './api';

export class CustodyService {
  public static async getActiveCustody(): Promise<ApiResponse<ActiveCustodyItem[]>> {
    return ApiService.get<ActiveCustodyItem[]>('/custody/active', MOCK_ACTIVE_CUSTODY);
  }

  public static async extendRental(itemId: string, extraDays: number): Promise<ApiResponse<{ hoursAdded: number; newDueDate: string }>> {
    return ApiService.post('/custody/extend', { itemId, extraDays }, {
      hoursAdded: extraDays * 24,
      newDueDate: `Extended +${extraDays} Days (New Due: 18:00)`,
    });
  }

  public static async releaseDepositBond(itemId: string): Promise<ApiResponse<{ releasedAmount: number; cleared: boolean }>> {
    return ApiService.post('/custody/clear', { itemId }, {
      releasedAmount: 350,
      cleared: true,
    });
  }
}
