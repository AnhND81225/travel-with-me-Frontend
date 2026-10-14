import { formatCurrency } from "../utils/formatters";
import React, { useState } from "react";
import { GearItem, OutpostStation, CartItem } from "../types";
import {
  X,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";

interface ProductDetailModalProps {
  gear: GearItem;
  allGear: GearItem[];
  outposts: OutpostStation[];
  selectedStation: OutpostStation;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  gear,
  allGear,
  outposts,
  selectedStation,
  onClose,
  onAddToCart,
}) => {
  const [purchaseMode, setPurchaseMode] = useState<"rent" | "buy">("rent");
  const [rentalDays, setRentalDays] = useState(3);
  const [pickupStationId, setPickupStationId] = useState(selectedStation.id);
  const [dropoffStationId, setDropoffStationId] = useState(selectedStation.id);
  const [protectionTier, setProtectionTier] = useState<
    "basic" | "zero_liability"
  >("zero_liability");
  const [addedToast, setAddedToast] = useState(false);

  const today = new Date();
  const startDateStr = today.toISOString().split("T")[0];
  const returnDate = new Date(today);
  returnDate.setDate(today.getDate() + rentalDays);
  const returnDateStr = returnDate.toISOString().split("T")[0];

  const dailyRate = gear.dailyRentalPrice;
  const rentalBaseTotal = dailyRate * rentalDays;
  const protectionDailyFee = protectionTier === "zero_liability" ? 6 : 0;
  const protectionTotal = protectionDailyFee * rentalDays;
  const isInterBranch = pickupStationId !== dropoffStationId;
  const interBranchCourierFee = isInterBranch ? 15 : 0;

  const totalRentalFee =
    rentalBaseTotal + protectionTotal + interBranchCourierFee;
  const depositBond = gear.depositAmount;

  const bundledGear = (gear.bundleSuggestions || [])
    .map((id) => allGear.find((g) => g.id === id))
    .filter(Boolean) as GearItem[];

  const handleAddCurrent = () => {
    onAddToCart({
      gear,
      rentalDays,
      pickupStationId,
      dropoffStationId,
      startDate: startDateStr,
      endDate: returnDateStr,
      damageProtectionTier: protectionTier,
      purchaseMode,
    });
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs font-label">
      <div
        className="relative w-full max-w-4xl bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8D2C5] bg-[#EBE6DC]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-xs bg-[#152A20] text-white font-bold uppercase tracking-wider">
              SPEC SHEET & RENTAL ENGINE
            </span>
            <span className="text-xs font-mono-spec font-bold text-[#5C665F]">
              SKU: {gear.modelCode}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xs bg-[#F8F6F1] text-[#5C665F] hover:text-[#111D16] hover:bg-[#EBE6DC] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Main Grid: Visuals + Info */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Media Viewport */}
            <div className="md:col-span-5 space-y-3">
              <div className="aspect-4/3 w-full rounded-xs overflow-hidden bg-[#E7E2D8] border border-[#D8D2C5] relative">
                <img
                  src={gear.imageUrl}
                  alt={gear.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#152A20] text-white font-bold uppercase tracking-wider shadow-xs">
                    {gear.condition.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#F8F6F1]/95 text-[#111D16] border border-[#D8D2C5] font-bold font-mono-spec">
                    Weight: {(gear.weightGrams / 1000).toFixed(2)}kg
                  </span>
                </div>
              </div>

              {/* Station Inventory Matrix */}
              <div className="bg-[#EBE6DC] rounded-xs p-3.5 border border-[#D8D2C5] space-y-2 text-xs font-label">
                <div className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider">
                  DEPOT STOCK AVAILABILITY:
                </div>
                <div className="space-y-1.5">
                  {outposts.map((station) => {
                    const count = gear.stockByOutpost[station.id] || 0;
                    return (
                      <div
                        key={station.id}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-[#4A524C] font-semibold">
                          {station.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-xs font-bold font-mono-spec ${
                            count > 0
                              ? "bg-[#152A20] text-white"
                              : "bg-[#DDD7CB] text-[#7A857E]"
                          }`}
                        >
                          {count > 0 ? `${count} Ready` : "0 in depot"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Information & Mode Switcher */}
            <div className="md:col-span-7 space-y-5">
              <div>
                <div className="text-xs text-[#D97845] font-bold tracking-wider uppercase">
                  {gear.brand}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#111D16] leading-tight font-headline">
                  {gear.name}
                </h2>
                <p className="text-xs text-[#4A524C] mt-2 leading-relaxed font-body">
                  {gear.description}
                </p>
              </div>

              {/* Mode Toggle: Rent vs Buy */}
              <div className="bg-[#EBE6DC] p-0.5 rounded-xs border border-[#D8D2C5] grid grid-cols-2 text-center text-xs font-bold uppercase">
                <button
                  onClick={() => setPurchaseMode("rent")}
                  className={`py-2 rounded-xs transition cursor-pointer ${
                    purchaseMode === "rent"
                      ? "bg-[#152A20] text-white shadow-xs"
                      : "text-[#5C665F] hover:text-[#111D16]"
                  }`}
                >
                  FIELD RENTAL ({formatCurrency(gear.dailyRentalPrice)}/Day)
                </button>
                <button
                  onClick={() => setPurchaseMode("buy")}
                  className={`py-2 rounded-xs transition cursor-pointer ${
                    purchaseMode === "buy"
                      ? "bg-[#D97845] text-white shadow-xs"
                      : "text-[#5C665F] hover:text-[#111D16]"
                  }`}
                >
                  PURCHASE OUTRIGHT ({formatCurrency(gear.retailPrice)})
                </button>
              </div>

              {purchaseMode === "rent" ? (
                /* Rental Configuration Controls */
                <div className="space-y-4 bg-[#EBE6DC] p-4 rounded-xs border border-[#D8D2C5]">
                  {/* Duration Slider & Days */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[#5C665F] font-bold uppercase flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#152A20]" />
                        EXPEDITION DURATION:
                      </span>
                      <span className="text-[#111D16] font-bold text-sm bg-[#F8F6F1] px-2 py-0.5 rounded-xs border border-[#D8D2C5] font-mono-spec">
                        {rentalDays} {rentalDays === 1 ? "DAY" : "DAYS"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setRentalDays(Math.max(1, rentalDays - 1))
                        }
                        className="p-1.5 rounded-xs bg-[#F8F6F1] hover:bg-[#DDD7CB] text-[#111D16] border border-[#D8D2C5] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="range"
                        min="1"
                        max="21"
                        value={rentalDays}
                        onChange={(e) => setRentalDays(Number(e.target.value))}
                        className="flex-1 accent-[#152A20] cursor-pointer"
                      />
                      <button
                        onClick={() =>
                          setRentalDays(Math.min(21, rentalDays + 1))
                        }
                        className="p-1.5 rounded-xs bg-[#F8F6F1] hover:bg-[#DDD7CB] text-[#111D16] border border-[#D8D2C5] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#7A857E] mt-1.5 font-mono-spec">
                      <span>Depart: {startDateStr}</span>
                      <span>Return Due: {returnDateStr} (18:00)</span>
                    </div>
                  </div>

                  {/* Pickup & Dropoff Stations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#D8D2C5]">
                    <div>
                      <label className="text-[10px] font-bold text-[#5C665F] block mb-1 uppercase">
                        PICKUP OUTPOST:
                      </label>
                      <select
                        value={pickupStationId}
                        onChange={(e) => setPickupStationId(e.target.value)}
                        className="w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] font-semibold"
                      >
                        {outposts.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.code} - {station.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#5C665F] block mb-1 uppercase">
                        RETURN OUTPOST:
                      </label>
                      <select
                        value={dropoffStationId}
                        onChange={(e) => setDropoffStationId(e.target.value)}
                        className="w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] font-semibold"
                      >
                        {outposts.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.code} - {station.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isInterBranch && (
                    <div className="bg-[#FDF2EC] border border-[#F1BA9B] rounded-xs p-2.5 text-[11px] text-[#D97845] font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Cross-branch return selected. +375,000 ₫ logistics
                        shuttle fee applied.
                      </span>
                    </div>
                  )}

                  {/* Damage Protection Waiver Tier */}
                  <div className="pt-2 border-t border-[#D8D2C5] space-y-2">
                    <label className="text-[10px] font-bold text-[#5C665F] block uppercase">
                      ALPINE DAMAGE PROTECTION PLAN:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setProtectionTier("zero_liability")}
                        className={`p-3 rounded-xs border text-left transition cursor-pointer ${
                          protectionTier === "zero_liability"
                            ? "bg-[#F8F6F1] border-[#152A20] text-[#111D16] ring-1 ring-[#152A20]"
                            : "bg-[#F8F6F1] border-[#D8D2C5] text-[#5C665F]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[#111D16]">
                          <span>Glacier Shield</span>
                          <span className="text-[#D97845] font-mono-spec">
                            +150,000 ₫/day
                          </span>
                        </div>
                        <p className="text-[10px] text-[#5C665F] mt-1 font-body">
                          0 ₫ deductible. Covers accidental fabric rips, zipper
                          blown teeth, pole cracks.
                        </p>
                      </button>

                      <button
                        onClick={() => setProtectionTier("basic")}
                        className={`p-3 rounded-xs border text-left transition cursor-pointer ${
                          protectionTier === "basic"
                            ? "bg-[#F8F6F1] border-[#152A20] text-[#111D16] ring-1 ring-[#152A20]"
                            : "bg-[#F8F6F1] border-[#D8D2C5] text-[#5C665F]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Standard Bond</span>
                          <span className="font-mono-spec">0 ₫</span>
                        </div>
                        <p className="text-[10px] text-[#5C665F] mt-1 font-body">
                          Full deposit deduction if gear returned damaged or
                          torn.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Outright Purchase Details */
                <div className="bg-[#EBE6DC] p-4 rounded-xs border border-[#D8D2C5] space-y-3 text-xs">
                  <div className="flex items-center justify-between text-[#111D16] font-bold text-sm">
                    <span className="uppercase">MSRP PURCHASE</span>
                    <span className="text-[#D97845] text-base font-headline font-mono-spec">
                      {formatCurrency(gear.retailPrice)}
                    </span>
                  </div>
                  <p className="text-[#5C665F] text-xs font-body">
                    Factory sealed unit ready for collection at any outpost or
                    dispatched via express mountain courier.
                  </p>
                  <div className="bg-[#F8F6F1] p-3 rounded-xs text-[11px] text-[#111D16] font-semibold border border-[#D8D2C5] space-y-1">
                    <div>✓ Global Brand Lifetime Limited Warranty included</div>
                    <div>
                      ✓ Free initial summit inspection & tuning by outpost
                      armorers
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Specs */}
          <div className="border-t border-[#D8D2C5] pt-5 space-y-3">
            <h3 className="text-xs font-bold text-[#111D16] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#152A20]" />
              LAB SPECIFICATIONS & FIELD ENGINEERING
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              {Object.entries(gear.specs).map(([label, val]) => (
                <div
                  key={label}
                  className="bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5]"
                >
                  <span className="text-[10px] text-[#7A857E] block uppercase font-bold">
                    {label}
                  </span>
                  <span className="text-[#111D16] font-bold">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Bundles */}
          {bundledGear.length > 0 && (
            <div className="border-t border-[#D8D2C5] pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#D97845] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  RECOMMENDED EXPEDITION BUNDLE
                </span>
                <span className="text-[10px] text-[#152A20] font-bold bg-[#EBE6DC] px-2 py-0.5 rounded-xs border border-[#D8D2C5] uppercase">
                  15% OFF COMBINED RENTAL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bundledGear.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-[#EBE6DC] rounded-xs border border-[#D8D2C5]"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xs bg-[#DDD7CB]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#111D16] truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-[#7A857E] font-mono-spec">
                        +{formatCurrency(item.dailyRentalPrice)}/day
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Checkout Bar */}
        <div className="p-4 sm:p-5 border-t border-[#D8D2C5] bg-[#EBE6DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-label">
          {purchaseMode === "rent" ? (
            <div>
              <div className="text-[11px] text-[#5C665F] font-bold uppercase">
                RENTAL TOTAL ({rentalDays} DAYS):
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#152A20] font-headline font-mono-spec">
                  {formatCurrency(totalRentalFee)}
                </span>
                <span className="text-xs text-[#7A857E] font-mono-spec">
                  + {formatCurrency(depositBond)} refundable bond
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[11px] text-[#5C665F] font-bold uppercase">
                PURCHASE PRICE:
              </div>
              <div className="text-2xl font-bold text-[#D97845] font-headline font-mono-spec">
                {formatCurrency(gear.retailPrice)}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xs bg-[#F8F6F1] hover:bg-[#EBE6DC] text-[#111D16] border border-[#D8D2C5] text-xs font-bold uppercase transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleAddCurrent}
              disabled={addedToast}
              className="px-6 py-2 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-white text-xs font-bold uppercase tracking-wider transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {addedToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>COMMITTED TO MANIFEST!</span>
                </>
              ) : (
                <>
                  <span>
                    {purchaseMode === "rent"
                      ? "Add To Rental Manifest"
                      : "Add To Purchase"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
