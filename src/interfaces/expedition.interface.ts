export type ExpeditionDifficulty = 
  | 'Class 2 Trek' 
  | 'Class 3 Alpine' 
  | 'Class 4 Technical' 
  | 'Class 5 Extreme';

export interface GuideProfile {
  name: string;
  certification: string;
  photo: string;
  expeditionsLed: number;
}

export interface ElevationPoint {
  point: string;
  altitude: number;
}

export interface ItineraryStage {
  day: string;
  title: string;
  desc: string;
  campElevation: string;
}

export interface GuidedExpedition {
  id: string;
  title: string;
  subtitle: string;
  region: string;
  elevationGain: string;
  peakAltitude: string;
  duration: string;
  difficulty: ExpeditionDifficulty;
  difficultyColor: string;
  pricePerClimber: number;
  nextDeparture: string;
  slotsRemaining: number;
  totalSlots: number;
  leadGuide: GuideProfile;
  elevationProfile: ElevationPoint[];
  itinerary: ItineraryStage[];
  requiredGear: string[];
  imageUrl: string;
}

export interface ExpeditionBooking {
  id: string;
  expeditionId: string;
  climberCount: number;
  includeGearBundle: boolean;
  totalCost: number;
  bookingDate: string;
  departureDate: string;
  status: 'CONFIRMED' | 'WAITLIST';
}
