import { GearItem, GearCategory } from '../interfaces';
import { GEAR_ITEMS } from '../data/mockData';
import { ApiService, ApiResponse } from './api';

export class GearService {
  public static async getAllGear(): Promise<ApiResponse<GearItem[]>> {
    return ApiService.get<GearItem[]>('/gear', GEAR_ITEMS);
  }

  public static async getGearById(id: string): Promise<ApiResponse<GearItem | undefined>> {
    const item = GEAR_ITEMS.find((g) => g.id === id);
    return ApiService.get<GearItem | undefined>(`/gear/${id}`, item);
  }

  public static async getGearByCategory(category: GearCategory): Promise<ApiResponse<GearItem[]>> {
    const filtered = category === 'all' 
      ? GEAR_ITEMS 
      : GEAR_ITEMS.filter((g) => g.category === category);
    return ApiService.get<GearItem[]>(`/gear?category=${category}`, filtered);
  }
}
