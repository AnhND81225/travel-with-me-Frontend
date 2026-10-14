import React, { useState } from "react";
import { CartItem, OutpostStation } from "../types";
import {
  X,
  Trash2,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  QrCode,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "../utils/formatters";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  outposts: OutpostStation[];
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  outposts,
  onRemoveItem,
  onClearCart,
}) => {
  const [pickupWindow, setPickupWindow] = useState(
    "06:00 - 08:00 (Alpine Dawn Prep)",
  );
  const [confirmedOrder, setConfirmedOrder] = useState<string | null>(null);

  if (!isOpen) return null;

  let rentalTotal = 0;
  let purchaseTotal = 0;
  let protectionTotal = 0;
  let interBranchTotal = 0;
  let depositBondTotal = 0;

  cartItems.forEach((item) => {
    if (item.purchaseMode === "buy") {
      purchaseTotal += item.gear.retailPrice;
    } else {
      rentalTotal += item.gear.dailyRentalPrice * item.rentalDays;
      if (item.damageProtectionTier === "zero_liability") {
        protectionTotal += 6 * item.rentalDays;
      }
      if (item.pickupStationId !== item.dropoffStationId) {
        interBranchTotal += 15;
      }
      depositBondTotal += item.gear.depositAmount;
    }
  });

  const dueNowTotal =
    rentalTotal + purchaseTotal + protectionTotal + interBranchTotal;

  const handleAuthorize = () => {
    const orderNum = `TK-${Math.floor(10000 + Math.random() * 90000)}`;
    setConfirmedOrder(orderNum);
  };

  const handleFinish = () => {
    onClearCart();
    setConfirmedOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end font-label">
      <div
        className="w-full max-w-lg bg-[#F3EFE6] border-l border-[#D8D2C5] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#D8D2C5] bg-[#EBE6DC] flex items-center justify-between font-label">
          <div>
            <div className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">
              EQUIPMENT DISPATCH MANIFEST
            </div>
            <h3 className="text-base font-bold text-[#111D16] font-headline">
              RESERVATION CART ({cartItems.length} ITEMS)
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xs bg-[#F8F6F1] text-[#5C665F] hover:text-[#111D16] hover:bg-[#EBE6DC] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        {confirmedOrder ? (
          /* Confirmation Success Screen */
          <div className="flex-1 p-6 flex flex-col justify-between items-center text-center font-label space-y-6">
            <div className="my-auto space-y-4">
              <div className="w-14 h-14 rounded-xs bg-[#E0EFE6] border border-[#152A20] flex items-center justify-center text-[#152A20] mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#111D16] font-headline uppercase">
                MANIFEST AUTHORIZED
              </h3>
              <p className="text-xs text-[#5C665F] max-w-sm font-body">
                Your expedition equipment reservation has been allocated at the
                specified outpost depot.
              </p>

              <div className="bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-4 space-y-2 text-left font-label">
                <div className="flex justify-between text-xs">
                  <span className="text-[#5C665F] font-bold uppercase">
                    MANIFEST ORDER:
                  </span>
                  <span className="text-[#111D16] font-bold font-mono-spec">
                    #{confirmedOrder}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#5C665F] font-bold uppercase">
                    PICKUP WINDOW:
                  </span>
                  <span className="text-[#111D16] font-semibold">
                    {pickupWindow}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#5C665F] font-bold uppercase">
                    REFUNDABLE BOND:
                  </span>
                  <span className="text-[#152A20] font-bold font-mono-spec">
                    {formatCurrency(depositBondTotal)} HELD
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xs inline-block shadow-xs border border-[#D8D2C5]">
                <QrCode className="w-32 h-32 text-[#152A20]" />
              </div>
              <p className="text-[11px] text-[#7A857E] font-body">
                Present this reservation QR pass upon arrival at the outpost
                depot counter.
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs"
            >
              Done & Return to Basecamp
            </button>
          </div>
        ) : (
          /* Cart List */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-24 space-y-3 font-label">
                <ShieldCheck className="w-10 h-10 text-[#7A857E] mx-auto" />
                <h4 className="text-sm font-bold text-[#111D16] font-headline uppercase">
                  MANIFEST IS EMPTY
                </h4>
                <p className="text-xs text-[#5C665F] font-body max-w-xs mx-auto">
                  Select alpine shelters, shells, or hardware from the catalog
                  to build your gear manifest.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item, index) => {
                  const pickup = outposts.find(
                    (o) => o.id === item.pickupStationId,
                  );
                  const dropoff = outposts.find(
                    (o) => o.id === item.dropoffStationId,
                  );

                  return (
                    <div
                      key={index}
                      className="p-3.5 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] space-y-2 font-label text-xs relative"
                    >
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="absolute top-3 right-3 text-[#7A857E] hover:text-[#B91C1C] transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 pr-6">
                        <img
                          src={item.gear.imageUrl}
                          alt={item.gear.name}
                          className="w-14 h-14 rounded-xs object-cover bg-[#E7E2D8] shrink-0 border border-[#D8D2C5]"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">
                            {item.purchaseMode === "rent"
                              ? "FIELD RENTAL"
                              : "PURCHASE"}
                          </span>
                          <h4 className="font-bold text-[#111D16] text-sm truncate font-headline">
                            {item.gear.name}
                          </h4>
                          <div className="text-[11px] text-[#5C665F] font-mono-spec">
                            {item.purchaseMode === "rent" ? (
                              <span>
                                {formatCurrency(item.gear.dailyRentalPrice)}/day
                                • {item.rentalDays} days
                              </span>
                            ) : (
                              <span>
                                MSRP {formatCurrency(item.gear.retailPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {item.purchaseMode === "rent" && (
                        <div className="pt-2 border-t border-[#D8D2C5] text-[11px] space-y-1 text-[#5C665F]">
                          <div className="flex justify-between">
                            <span>Pickup: {pickup?.name}</span>
                            <span>Return: {dropoff?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>
                              Protection:{" "}
                              {item.damageProtectionTier === "zero_liability"
                                ? "Glacier Shield (0 ₫ Ded)"
                                : "Standard"}
                            </span>
                            <span className="text-[#152A20] font-bold font-mono-spec">
                              Bond: {formatCurrency(item.gear.depositAmount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pickup Window Selector */}
                <div className="bg-[#EBE6DC] p-3.5 rounded-xs border border-[#D8D2C5] space-y-2 font-label text-xs">
                  <label className="text-[#5C665F] font-bold block text-[10px] uppercase">
                    EXPEDITION DEPARTURE WINDOW:
                  </label>
                  <select
                    value={pickupWindow}
                    onChange={(e) => setPickupWindow(e.target.value)}
                    className="w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-2 text-[#111D16] font-semibold text-xs"
                  >
                    <option value="06:00 - 08:00 (Alpine Dawn Prep)">
                      06:00 - 08:00 (Alpine Dawn Prep)
                    </option>
                    <option value="12:00 - 14:00 (Midday Basecamp Check)">
                      12:00 - 14:00 (Midday Basecamp Check)
                    </option>
                    <option value="17:00 - 19:00 (Evening Bivouac Brief)">
                      17:00 - 19:00 (Evening Bivouac Brief)
                    </option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price Summary */}
        {!confirmedOrder && cartItems.length > 0 && (
          <div className="p-5 border-t border-[#D8D2C5] bg-[#EBE6DC] space-y-3 font-label text-xs">
            <div className="space-y-1.5 text-[#5C665F] text-[11px]">
              {rentalTotal > 0 && (
                <div className="flex justify-between">
                  <span>Equipment Rental:</span>
                  <span className="text-[#111D16] font-bold font-mono-spec">
                    {formatCurrency(rentalTotal)}
                  </span>
                </div>
              )}
              {purchaseTotal > 0 && (
                <div className="flex justify-between">
                  <span>Retail Equipment:</span>
                  <span className="text-[#111D16] font-bold font-mono-spec">
                    {formatCurrency(purchaseTotal)}
                  </span>
                </div>
              )}
              {protectionTotal > 0 && (
                <div className="flex justify-between">
                  <span>Glacier Shield Protection:</span>
                  <span className="text-[#111D16] font-bold font-mono-spec">
                    {formatCurrency(protectionTotal)}
                  </span>
                </div>
              )}
              {interBranchTotal > 0 && (
                <div className="flex justify-between">
                  <span>Cross-Branch Courier Fee:</span>
                  <span className="text-[#111D16] font-bold font-mono-spec">
                    {formatCurrency(interBranchTotal)}
                  </span>
                </div>
              )}
              {depositBondTotal > 0 && (
                <div className="flex justify-between text-[#152A20] font-bold pt-1 border-t border-[#D8D2C5]">
                  <span>Refundable Security Escrow:</span>
                  <span className="font-mono-spec">
                    {formatCurrency(depositBondTotal)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#D8D2C5] flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-[#5C665F] font-bold block uppercase">
                  DUE IMMEDIATELY:
                </span>
                <span className="text-2xl font-bold text-[#152A20] font-headline font-mono-spec">
                  {formatCurrency(dueNowTotal)}
                </span>
              </div>
              <div className="text-right text-[10px] text-[#7A857E]">
                Bond released at dropoff
              </div>
            </div>

            <button
              onClick={handleAuthorize}
              className="w-full py-3 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-white font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Authorize Manifest & Reserve</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
