import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Trash2,
  MapPin,
  ArrowRight,
  Package,
  Plus,
  Minus,
  ShoppingBag,
} from "lucide-react";
import { catalogApi, Product, Branch, vnd } from "../features/equipment/catalogApi";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCart?: () => void;
}

type CartLine = {
  branchId: number;
  productId: number;
  itemType: "SALE" | "RENTAL";
  quantity: number;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
};

const CART_KEY = "treektour.order.cart";

function getRentalDays(start: string | null, end: string | null): number {
  if (!start || !end) return 1;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return 1;
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [productsMap, setProductsMap] = useState<Record<number, Product>>({});
  const [branchesMap, setBranchesMap] = useState<Record<number, Branch>>({});

  // Load real cart lines whenever drawer is opened
  const loadCart = () => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
      setLines(Array.isArray(stored) ? stored : []);
    } catch {
      setLines([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  // Load real product & branch information from backend
  useEffect(() => {
    if (!isOpen || lines.length === 0) return;

    let alive = true;
    const productIds = Array.from(new Set(lines.map((l) => l.productId)));
    Promise.allSettled(productIds.map((id) => catalogApi<Product>(`/products/${id}`))).then(
      (results) => {
        if (!alive) return;
        const map: Record<number, Product> = {};
        results.forEach((res) => {
          if (res.status === "fulfilled" && res.value) {
            map[res.value.id] = res.value;
          }
        });
        setProductsMap(map);
      }
    );

    catalogApi<Branch[]>("/branches")
      .then((branches) => {
        if (alive && Array.isArray(branches)) {
          const bMap: Record<number, Branch> = {};
          branches.forEach((b) => (bMap[b.id] = b));
          setBranchesMap(bMap);
        }
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [isOpen, lines]);

  // Update item quantity
  const handleUpdateQty = (index: number, delta: number) => {
    const target = lines[index];
    if (!target) return;

    const newQty = target.quantity + delta;
    let next: CartLine[];
    if (newQty <= 0) {
      next = lines.filter((_, i) => i !== index);
    } else {
      next = [...lines];
      next[index] = { ...target, quantity: newQty };
    }

    setLines(next);
    if (next.length > 0) {
      sessionStorage.setItem(CART_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(CART_KEY);
    }
    window.dispatchEvent(new Event("cart_updated"));
  };

  // Remove single line
  const handleRemoveLine = (index: number) => {
    const next = lines.filter((_, i) => i !== index);
    setLines(next);
    if (next.length > 0) {
      sessionStorage.setItem(CART_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(CART_KEY);
    }
    window.dispatchEvent(new Event("cart_updated"));
  };

  // Total quantity of items in cart
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);

  // Total amount in VND
  const totalAmount = useMemo(() => {
    return lines.reduce((sum, line) => {
      const prod = productsMap[line.productId];
      if (line.itemType === "SALE") {
        return sum + (prod?.salePrice ?? 0) * line.quantity;
      } else {
        const days = getRentalDays(line.rentalStartDate, line.rentalEndDate);
        return sum + (prod?.rentalPricePerDay ?? 0) * days * line.quantity;
      }
    }, 0);
  }, [lines, productsMap]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end font-label animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#F3EFE6] border-l border-[#D8D2C5] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#D8D2C5] bg-[#EBE6DC] flex items-center justify-between font-label">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#152A20] text-[#D97845] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">
                EXPEDITION DISPATCH
              </div>
              <h3 className="text-sm font-bold text-[#111D16] font-headline">
                Equipment Cart ({totalQuantity} Items)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xs bg-[#F8F6F1] text-[#5C665F] hover:text-[#111D16] hover:bg-[#DDD7CB] transition cursor-pointer border border-[#D8D2C5]"
            title="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {lines.length === 0 ? (
            <div className="text-center py-24 space-y-3 font-label">
              <div className="w-12 h-12 rounded-full bg-[#EBE6DC] border border-[#D8D2C5] flex items-center justify-center mx-auto text-[#7A857E]">
                <Package className="w-6 h-6 stroke-1" />
              </div>
              <h4 className="text-sm font-bold text-[#111D16] font-headline uppercase">
                Your Cart Is Empty
              </h4>
              <p className="text-xs text-[#5C665F] font-body max-w-xs mx-auto">
                Your cart does not contain any equipment yet.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/rent");
                  }}
                  className="px-3 py-1.5 bg-[#D97845] hover:bg-[#C66735] text-white text-xs font-bold uppercase rounded-xs transition cursor-pointer"
                >
                  Rent Equipment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/shop");
                  }}
                  className="px-3 py-1.5 bg-[#152A20] hover:bg-[#1E3A2D] text-white text-xs font-bold uppercase rounded-xs transition cursor-pointer"
                >
                  Buy Equipment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line, index) => {
                const prod = productsMap[line.productId];
                const branch = branchesMap[line.branchId];
                const isRental = line.itemType === "RENTAL";
                const days = isRental
                  ? getRentalDays(line.rentalStartDate, line.rentalEndDate)
                  : 1;
                const unitPrice = isRental
                  ? (prod?.rentalPricePerDay ?? 0)
                  : (prod?.salePrice ?? 0);
                const lineTotal = unitPrice * line.quantity * (isRental ? days : 1);

                return (
                  <div
                    key={`${line.productId}-${index}`}
                    className="p-3 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs space-y-2.5 font-label text-xs relative"
                  >
                    <button
                      onClick={() => handleRemoveLine(index)}
                      className="absolute top-2.5 right-2.5 text-[#7A857E] hover:text-[#B91C1C] transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-start gap-2.5 pr-6">
                      <div className="w-10 h-10 rounded-xs bg-[#152A20] text-[#D97845] flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#111D16] text-xs truncate font-headline">
                            {prod?.name || `Product #${line.productId}`}
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded-xs font-bold uppercase ${
                              isRental
                                ? "bg-[#FFF8F3] text-[#D97845] border border-[#F1BA9B]"
                                : "bg-[#EBE6DC] text-[#152A20] border border-[#D8D2C5]"
                            }`}
                          >
                            {isRental ? "Rental" : "Purchase"}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#5C665F] mt-0.5">
                          {isRental ? (
                            <span>
                              {vnd(unitPrice)}/day • {days} days ({line.rentalStartDate} →{" "}
                              {line.rentalEndDate})
                            </span>
                          ) : (
                            <span>Unit price: {vnd(unitPrice)}</span>
                          )}
                        </div>

                        {branch && (
                          <div className="text-[10px] text-[#737C75] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#152A20]" />
                            <span>{branch.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls and line total */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#D8D2C5] text-xs">
                      <div className="flex items-center border border-[#D8D2C5] rounded-xs bg-white">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(index, -1)}
                          className="px-2 py-0.5 text-[#5C665F] hover:bg-[#EBE6DC] hover:text-[#111D16] transition cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-0.5 font-bold font-mono-spec text-xs">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(index, 1)}
                          className="px-2 py-0.5 text-[#5C665F] hover:bg-[#EBE6DC] hover:text-[#111D16] transition cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-bold text-[#152A20] font-headline text-xs">
                        {vnd(lineTotal)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {lines.length > 0 && (
          <div className="p-4 border-t border-[#D8D2C5] bg-[#EBE6DC] space-y-3 font-label text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-[#111D16] uppercase">
                ORDER TOTAL:
              </span>
              <span className="text-xl font-bold text-[#D97845] font-headline">
                {vnd(totalAmount)}
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/cart");
                }}
                className="w-full py-2.5 rounded-xs bg-[#D97845] hover:bg-[#C66735] text-white font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Cart & Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-xs bg-[#F8F6F1] hover:bg-[#EBE6DC] text-[#152A20] font-bold text-xs uppercase tracking-wider transition border border-[#D8D2C5] cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
