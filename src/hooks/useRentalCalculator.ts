import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  GearItem,
  DamageProtectionTier,
  PurchaseMode,
  RentalCostCalculation,
} from "../interfaces";

export function useRentalCalculator(gear: GearItem, defaultPickupId: string) {
  const [params] = useSearchParams();
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>(
    gear.capability === "BUY_ONLY" ||
      (gear.capability === "BUY_AND_RENT" && params.get("mode") === "buy")
      ? "buy"
      : "rent",
  );
  const [rentalDays, setRentalDays] = useState(3);
  const [pickupStationId, setPickupStationId] = useState(defaultPickupId);
  const [dropoffStationId, setDropoffStationId] = useState(defaultPickupId);
  const [protectionTier, setProtectionTier] =
    useState<DamageProtectionTier>("zero_liability");

  // Dates
  const requestedStart = params.get("start");
  const today = useMemo(() => {
    const parsed =
      requestedStart && /^\d{4}-\d{2}-\d{2}$/.test(requestedStart)
        ? new Date(requestedStart + "T12:00:00")
        : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [requestedStart]);
  const startDateStr = today.toISOString().split("T")[0];
  const returnDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + rentalDays);
    return d;
  }, [today, rentalDays]);
  const returnDateStr = returnDate.toISOString().split("T")[0];

  const calculation = useMemo<RentalCostCalculation>(() => {
    const dailyRate = gear.dailyRentalPrice;
    const baseRentalTotal = dailyRate * rentalDays;
    const protectionDailyFee = protectionTier === "zero_liability" ? 6 : 0;
    const protectionTotal = protectionDailyFee * rentalDays;
    const isInterBranch = pickupStationId !== dropoffStationId;
    const courierFee = isInterBranch ? 15 : 0;
    const totalRentalFee = baseRentalTotal + protectionTotal + courierFee;
    const depositBond = gear.depositAmount;

    return {
      rentalDays,
      dailyRate,
      baseRentalTotal,
      protectionTier,
      protectionTotal,
      isInterBranch,
      courierFee,
      totalRentalFee,
      depositBond,
    };
  }, [gear, rentalDays, protectionTier, pickupStationId, dropoffStationId]);

  return {
    purchaseMode,
    setPurchaseMode,
    rentalDays,
    setRentalDays,
    pickupStationId,
    setPickupStationId,
    dropoffStationId,
    setDropoffStationId,
    protectionTier,
    setProtectionTier,
    startDateStr,
    returnDateStr,
    calculation,
  };
}
