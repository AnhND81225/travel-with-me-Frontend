export type GearCategory = 
  | 'all'
  | 'tents' 
  | 'thermal' 
  | 'packs' 
  | 'hardware' 
  | 'navigation' 
  | 'shells';

export type GearCondition = 'MINT_NEW' | 'FIELD_CERTIFIED' | 'REFURBISHED';
export type ProductCapability = 'BUY_AND_RENT' | 'RENT_ONLY' | 'BUY_ONLY';

export interface GearItem {
  id: string;
  name: string;
  modelCode: string;
  brand: string;
  category: GearCategory;
  capability: ProductCapability;
  dailyRentalPrice: number;
  retailPrice: number;
  depositAmount: number;
  minRentalDays?: number;
  weightGrams: number;
  rating: number;
  reviewCount: number;
  temperatureRating?: string;
  waterproofRating?: string;
  condition: GearCondition;
  imageUrl: string;
  description: string;
  specs: Record<string, string>;
  features: string[];
  stockByOutpost: Record<string, number>;
  bundleSuggestions?: string[];
}
