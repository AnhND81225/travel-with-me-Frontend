import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { GEAR_ITEMS, OUTPOSTS } from "../../data/mockData";
import { useAppStore } from "../../store/useAppStore";
import { useRentalCalculator } from "../../hooks/useRentalCalculator";
import { Card, Button, Badge } from "../../components/ui";
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Star,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatWeight } from "../../utils/formatters";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedStation, addToCart } = useAppStore();

  const gear = GEAR_ITEMS.find((g) => g.id === id) || GEAR_ITEMS[0];
  const {
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
  } = useRentalCalculator(gear, selectedStation.id);

  const [addedToast, setAddedToast] = useState(false);

  const handleCommit = () => {
    addToCart({
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
      navigate("/cart");
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      {/* Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#111D16] font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Expedition Catalog</span>
        </Link>
        <span className="text-xs text-[#7A857E] font-mono-spec">
          SKU: {gear.modelCode}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Visual Gallery */}
        <div className="md:col-span-5 space-y-4">
          <Card
            padding="none"
            className="aspect-4/3 relative overflow-hidden bg-[#E7E2D8]"
          >
            <img
              src={gear.imageUrl}
              alt={gear.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <Badge variant="primary">
                {gear.condition.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              <Badge variant="neutral">{formatWeight(gear.weightGrams)}</Badge>
            </div>
          </Card>

          {/* Outpost Availability */}
          <Card padding="sm" className="space-y-2">
            <span className="text-[10px] text-[#7A857E] font-bold uppercase tracking-wider block">
              OUTPOST STATION DEPOT INVENTORY:
            </span>
            <div className="space-y-1.5 text-xs">
              {OUTPOSTS.map((st) => {
                const stock = gear.stockByOutpost[st.id] || 0;
                return (
                  <div
                    key={st.id}
                    className="flex justify-between items-center text-[11px]"
                  >
                    <span className="text-[#111D16] font-medium">
                      {st.name}
                    </span>
                    <Badge variant={stock > 0 ? "success" : "neutral"}>
                      {stock > 0 ? `${stock} Ready` : "0 in depot"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Configurator */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <span className="text-xs font-bold text-[#D97845] uppercase tracking-wider">
              {gear.brand}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-0.5">
              {gear.name}
            </h1>
            <p className="text-xs text-[#4A524C] mt-2 leading-relaxed font-body">
              {gear.description}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="bg-[#EBE6DC] p-0.5 rounded-xs border border-[#D8D2C5] grid grid-cols-2 text-center text-xs font-bold uppercase">
            <button
              onClick={() => setPurchaseMode("rent")}
              className={`py-2 rounded-xs transition cursor-pointer ${
                purchaseMode === "rent"
                  ? "bg-[#152A20] text-white shadow-xs"
                  : "text-[#5C665F]"
              }`}
            >
              FIELD RENTAL ({formatCurrency(gear.dailyRentalPrice)}/Day)
            </button>
            <button
              onClick={() => setPurchaseMode("buy")}
              className={`py-2 rounded-xs transition cursor-pointer ${
                purchaseMode === "buy"
                  ? "bg-[#D97845] text-white shadow-xs"
                  : "text-[#5C665F]"
              }`}
            >
              PURCHASE ({formatCurrency(gear.retailPrice)})
            </button>
          </div>

          {purchaseMode === "rent" ? (
            <Card padding="md" className="space-y-4 bg-[#EBE6DC]">
              {/* Duration Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 text-[#111D16]">
                  <span className="flex items-center gap-1.5 text-[#5C665F] uppercase">
                    <Clock className="w-3.5 h-3.5 text-[#152A20]" />
                    EXPEDITION DURATION:
                  </span>
                  <span className="bg-[#F8F6F1] px-2.5 py-0.5 rounded-xs border border-[#D8D2C5] font-mono-spec">
                    {rentalDays} DAYS
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRentalDays(Math.max(1, rentalDays - 1))}
                    className="p-1.5 rounded-xs bg-[#F8F6F1] text-[#111D16] border border-[#D8D2C5]"
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
                    onClick={() => setRentalDays(Math.min(21, rentalDays + 1))}
                    className="p-1.5 rounded-xs bg-[#F8F6F1] text-[#111D16] border border-[#D8D2C5]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stations */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#D8D2C5]">
                <div>
                  <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">
                    PICKUP DEPOT:
                  </label>
                  <select
                    value={pickupStationId}
                    onChange={(e) => setPickupStationId(e.target.value)}
                    className="w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-2 text-xs font-semibold text-[#111D16]"
                  >
                    {OUTPOSTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">
                    RETURN DEPOT:
                  </label>
                  <select
                    value={dropoffStationId}
                    onChange={(e) => setDropoffStationId(e.target.value)}
                    className="w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-2 text-xs font-semibold text-[#111D16]"
                  >
                    {OUTPOSTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Protection Tier */}
              <div className="pt-2 border-t border-[#D8D2C5] space-y-2">
                <label className="text-[10px] text-[#5C665F] font-bold block uppercase">
                  DAMAGE PROTECTION PLAN:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setProtectionTier("zero_liability")}
                    className={`p-3 rounded-xs border text-left cursor-pointer transition ${
                      protectionTier === "zero_liability"
                        ? "bg-[#F8F6F1] border-[#152A20] ring-1 ring-[#152A20]"
                        : "bg-[#F8F6F1] border-[#D8D2C5]"
                    }`}
                  >
                    <div className="flex justify-between font-bold text-[#111D16]">
                      <span>Glacier Shield</span>
                      <span className="text-[#D97845] font-mono-spec">
                        +150,000 ₫/day
                      </span>
                    </div>
                    <p className="text-[10px] text-[#5C665F] mt-1 font-body">
                      0 ₫ deductible. Accidental wear covered.
                    </p>
                  </button>
                  <button
                    onClick={() => setProtectionTier("basic")}
                    className={`p-3 rounded-xs border text-left cursor-pointer transition ${
                      protectionTier === "basic"
                        ? "bg-[#F8F6F1] border-[#152A20] ring-1 ring-[#152A20]"
                        : "bg-[#F8F6F1] border-[#D8D2C5]"
                    }`}
                  >
                    <div className="flex justify-between font-bold text-[#111D16]">
                      <span>Standard</span>
                      <span className="font-mono-spec">0 ₫</span>
                    </div>
                    <p className="text-[10px] text-[#5C665F] mt-1 font-body">
                      Damage deducted from security bond.
                    </p>
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <Card padding="md" className="space-y-2 bg-[#EBE6DC]">
              <div className="text-xl font-bold text-[#D97845] font-headline font-mono-spec">
                {formatCurrency(gear.retailPrice)}
              </div>
              <p className="text-xs text-[#5C665F] font-body">
                Factory sealed brand new unit ready for immediate delivery or
                station pickup.
              </p>
            </Card>
          )}

          {/* Pricing Summary & Action */}
          <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#5C665F] font-bold block uppercase">
                {purchaseMode === "rent"
                  ? `RENTAL TOTAL (${rentalDays} DAYS):`
                  : "PURCHASE MSRP:"}
              </span>
              <span className="text-2xl font-bold text-[#152A20] font-headline font-mono-spec">
                {purchaseMode === "rent"
                  ? formatCurrency(calculation.totalRentalFee)
                  : formatCurrency(gear.retailPrice)}
              </span>
              {purchaseMode === "rent" && (
                <div className="text-[10px] text-[#7A857E] font-mono-spec">
                  + {formatCurrency(gear.depositAmount)} refundable security
                  bond
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCommit}
              disabled={addedToast}
            >
              {addedToast
                ? "Committed!"
                : purchaseMode === "rent"
                  ? "Add To Manifest"
                  : "Acquire"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
