import { GearItem } from './gear.interface';
import { GuidedExpedition } from './expedition.interface';

export type DamageProtectionTier = 'basic' | 'zero_liability';
export type CartItemType = 'purchase' | 'rental' | 'tour';
export type PurchaseMode = 'rent' | 'buy';

export interface RentalCostCalculation {
  rentalDays: number;
  dailyRate: number;
  baseRentalTotal: number;
  protectionTier: DamageProtectionTier;
  protectionTotal: number;
  isInterBranch: boolean;
  courierFee: number;
  totalRentalFee: number;
  depositBond: number;
}

export interface PurchaseCartItem {
  id: string;
  type: 'purchase';
  gear: GearItem;
  quantity: number;
}

export interface RentalCartItem {
  id: string;
  type: 'rental';
  gear: GearItem;
  rentalDays: number;
  pickupStationId: string;
  dropoffStationId: string;
  startDate: string;
  endDate: string;
  damageProtectionTier: DamageProtectionTier;
}

export interface TourCartItem {
  id: string;
  type: 'tour';
  expedition: GuidedExpedition;
  participantCount: number;
  departureDate: string;
  includeGearBundle: boolean;
}

export type UnifiedCartItem = PurchaseCartItem | RentalCartItem | TourCartItem;

// For backwards-compatibility with simple gear-based cart
export interface CartItem {
  gear: GearItem;
  rentalDays: number;
  pickupStationId: string;
  dropoffStationId: string;
  startDate: string;
  endDate: string;
  damageProtectionTier: DamageProtectionTier;
  purchaseMode: 'rent' | 'buy';
}

export interface MultiEntityOrderSummary {
  retailSubtotal: number;
  rentalSubtotal: number;
  tourSubtotal: number;
  protectionSubtotal: number;
  interBranchSubtotal: number;
  discountTotal: number;
  refundableDepositTotal: number; // NOTE: Held at pickup, not due today!
  amountDueToday: number;
}
