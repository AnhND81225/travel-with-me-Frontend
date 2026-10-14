import { create } from "zustand";
import {
  UserRole,
  OutpostStation,
  GearItem,
  CartItem,
  ActiveCustodyItem,
  FleetGearUnit,
  FleetCustodyState,
} from "../interfaces";
import {
  OUTPOSTS,
  GEAR_ITEMS,
  MOCK_ACTIVE_CUSTODY,
  MOCK_FLEET_UNITS,
} from "../data/mockData";

interface AppState {
  tourBookings: import("../interfaces").ExpeditionBooking[];
  bookTour: (
    tour: import("../interfaces").GuidedExpedition,
    participants: number,
  ) => import("../interfaces").ExpeditionBooking;

  // Authentication / Role
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Active Station Context
  selectedStation: OutpostStation;
  setSelectedStation: (station: OutpostStation) => void;
  outposts: OutpostStation[];

  // Global Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Cart / Reservation Manifest
  cartItems: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeCartItem: (index: number) => void;
  clearCart: () => void;

  // Selected Gear Modal
  selectedGearModal: GearItem | null;
  setSelectedGearModal: (gear: GearItem | null) => void;

  // Field Custody Items
  custodyItems: ActiveCustodyItem[];
  extendRental: (itemId: string, extraDays: number) => void;
  clearCustody: (itemId: string) => void;
  addCustodyItem: (item: ActiveCustodyItem) => void;

  // Fleet Asset Units
  fleetUnits: FleetGearUnit[];
  setFleetUnits: (units: FleetGearUnit[]) => void;
  updateFleetStatus: (
    serialNumber: string,
    newState: FleetCustodyState,
  ) => void;
  sanitizeUnit: (serialNumber: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  tourBookings: [],
  bookTour: (tour, participants) => {
    const reserved = get()
      .tourBookings.filter((b) => b.expeditionId === tour.id)
      .reduce((total, b) => total + b.climberCount, 0);
    const available = tour.slotsRemaining - reserved;
    if (
      !Number.isInteger(participants) ||
      participants < 1 ||
      participants > available
    )
      throw new Error(
        "Not enough places remain for this group. Please choose fewer participants.",
      );
    const booking: import("../interfaces").ExpeditionBooking = {
      id: `TP-${Date.now().toString(36).toUpperCase()}`,
      expeditionId: tour.id,
      climberCount: Math.max(1, Math.min(participants, tour.slotsRemaining)),
      includeGearBundle: true,
      totalCost:
        tour.pricePerClimber *
        Math.max(1, Math.min(participants, tour.slotsRemaining)),
      bookingDate: new Date().toISOString().split("T")[0],
      departureDate: tour.nextDeparture,
      status: "CONFIRMED",
    };
    set((state) => ({ tourBookings: [booking, ...state.tourBookings] }));
    return booking;
  },
  userRole: "climber",
  setUserRole: (role) => set({ userRole: role }),

  selectedStation: OUTPOSTS.find((station) => station.id === "hcmc-flagship")!,
  setSelectedStation: (station) => set({ selectedStation: station }),
  outposts: OUTPOSTS,

  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  cartItems: [
    {
      gear: GEAR_ITEMS[4], // Hyperlite Mountain Gear Prism 40
      rentalDays: 4,
      pickupStationId: "sapa-base",
      dropoffStationId: "sapa-base",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
      damageProtectionTier: "zero_liability",
      purchaseMode: "rent",
    },
  ],
  isCartOpen: false,
  setCartOpen: (open) => set({ isCartOpen: open }),
  addToCart: (item) =>
    set((state) => ({ cartItems: [...state.cartItems, item] })),
  removeCartItem: (index) =>
    set((state) => ({
      cartItems: state.cartItems.filter((_, idx) => idx !== index),
    })),
  clearCart: () => set({ cartItems: [] }),

  selectedGearModal: null,
  setSelectedGearModal: (gear) => set({ selectedGearModal: gear }),

  custodyItems: MOCK_ACTIVE_CUSTODY,
  extendRental: (itemId, extraDays) =>
    set((state) => ({
      custodyItems: state.custodyItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              hoursRemaining: item.hoursRemaining + extraDays * 24,
              dueDate: `Extended +${extraDays} Days (New Due: 18:00)`,
            }
          : item,
      ),
    })),
  clearCustody: (itemId) =>
    set((state) => ({
      custodyItems: state.custodyItems.filter((item) => item.id !== itemId),
    })),
  addCustodyItem: (item) =>
    set((state) => ({
      custodyItems: [item, ...state.custodyItems],
    })),

  fleetUnits: MOCK_FLEET_UNITS,
  setFleetUnits: (units) => set({ fleetUnits: units }),
  updateFleetStatus: (serialNumber, newState) =>
    set((state) => ({
      fleetUnits: state.fleetUnits.map((unit) =>
        unit.serialNumber === serialNumber
          ? { ...unit, custodyState: newState }
          : unit,
      ),
    })),
  sanitizeUnit: (serialNumber) =>
    set((state) => ({
      fleetUnits: state.fleetUnits.map((unit) =>
        unit.serialNumber === serialNumber
          ? {
              ...unit,
              custodyState: "AVAILABLE_IN_DEPOT",
              conditionScore: Math.min(100, unit.conditionScore + 2),
              lastInspectionDate: new Date().toISOString().split("T")[0],
            }
          : unit,
      ),
    })),
}));
