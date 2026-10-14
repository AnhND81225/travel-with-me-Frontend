import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GEAR_ITEMS, OUTPOSTS } from '../../data/mockData';
import { Card, Button, Badge, Input } from '../../components/ui';
import { 
  Search, 
  Plus, 
  Trash2, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  User, 
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PosLineItem {
  gear: typeof GEAR_ITEMS[0];
  mode: 'rent' | 'buy';
  days: number;
  qty: number;
}

export const StaffPosPage: React.FC = () => {
  const { selectedStation } = useAppStore();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<PosLineItem[]>([]);
  const [customerName, setCustomerName] = useState('Alex Rivers (Expedition Squad A)');
  const [paymentDone, setPaymentDone] = useState<string | null>(null);

  const filteredGear = GEAR_ITEMS.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.brand.toLowerCase().includes(q) || g.modelCode.toLowerCase().includes(q);
  });

  const addToPos = (gear: typeof GEAR_ITEMS[0], mode: 'rent' | 'buy') => {
    setCart((prev) => {
      const existing = prev.find((item) => item.gear.id === gear.id && item.mode === mode);
      if (existing) {
        return prev.map((item) => item === existing ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { gear, mode, days: 3, qty: 1 }];
    });
  };

  const removeFromPos = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  let subtotal = 0;
  let depositBonds = 0;

  cart.forEach((item) => {
    if (item.mode === 'buy') {
      subtotal += item.gear.retailPrice * item.qty;
    } else {
      subtotal += item.gear.dailyRentalPrice * item.days * item.qty;
      depositBonds += item.gear.depositAmount * item.qty;
    }
  });

  const handleCheckout = () => {
    const receiptNum = `POS-${Math.floor(100000 + Math.random() * 900000)}`;
    setPaymentDone(receiptNum);
  };

  const resetPos = () => {
    setCart([]);
    setPaymentDone(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">COUNTER TERMINAL</Badge>
            <span className="text-xs text-[#5C665F]">STATION: {selectedStation.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            Storefront Point of Sale & Gear Handoff
          </h1>
          <p className="text-xs text-[#5C665F]">Quick retail checkout and walk-in technical gear rental issuance.</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[#7A857E] font-bold uppercase block">ARMOURER TERMINAL OPERATOR</span>
          <span className="text-xs font-bold text-[#152A20]">Ranger Tran • Register #01</span>
        </div>
      </div>

      {paymentDone ? (
        <Card padding="lg" className="max-w-md mx-auto text-center space-y-4 py-10">
          <div className="w-16 h-16 rounded-xs bg-[#E0EFE6] border border-[#152A20] flex items-center justify-center text-[#152A20] mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#111D16] font-headline uppercase">TRANSACTION COMPLETE</h3>
          <p className="text-xs text-[#5C665F] font-body">
            Receipt and equipment custody receipt generated. Escrow bond pre-authorized.
          </p>

          <div className="bg-[#EBE6DC] p-3 rounded-xs text-xs text-left space-y-1.5 border border-[#D8D2C5]">
            <div className="flex justify-between">
              <span className="text-[#5C665F] font-bold">RECEIPT #:</span>
              <span className="font-bold text-[#111D16] font-mono-spec">{paymentDone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C665F] font-bold">CLIMBER:</span>
              <span className="font-semibold text-[#111D16]">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C665F] font-bold">TOTAL BILLED:</span>
              <span className="font-bold text-[#152A20] font-mono-spec">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C665F] font-bold">ESCROW BOND HELD:</span>
              <span className="font-bold text-[#D97845] font-mono-spec">{formatCurrency(depositBonds)}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xs inline-block border border-[#D8D2C5]">
            <QrCode className="w-32 h-32 text-[#152A20]" />
          </div>

          <Button variant="primary" size="md" fullWidth onClick={resetPos}>
            Start New POS Transaction
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Product Picker (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan barcode or search by name, brand, SKU..."
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs pl-9 pr-4 py-2 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] font-body"
              />
              <Search className="w-4 h-4 text-[#7A857E] absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredGear.map((g) => (
                <Card key={g.id} padding="sm" className="flex flex-col justify-between space-y-2">
                  <div className="flex gap-2.5">
                    <img src={g.imageUrl} alt={g.name} className="w-14 h-14 rounded-xs object-cover bg-[#E7E2D8] border border-[#D8D2C5] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-[#D97845] font-bold uppercase">{g.brand}</span>
                      <h4 className="font-bold text-xs text-[#111D16] truncate font-headline">{g.name}</h4>
                      <div className="text-[10px] text-[#7A857E] font-mono-spec">SKU: {g.modelCode}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#D8D2C5] flex items-center justify-between text-xs">
                    <div>
                      {g.capability !== 'BUY_ONLY' && (
                        <div className="font-bold text-[#152A20] font-mono-spec">
                          {formatCurrency(g.dailyRentalPrice)}<span className="text-[10px] text-[#5C665F]">/day</span>
                        </div>
                      )}
                      {g.capability !== 'RENT_ONLY' && (
                        <div className="text-[10px] text-[#7A857E] font-mono-spec">
                          MSRP {formatCurrency(g.retailPrice)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1.5">
                      {g.capability !== 'BUY_ONLY' && (
                        <Button variant="secondary" size="sm" onClick={() => addToPos(g, 'rent')}>
                          +Rent
                        </Button>
                      )}
                      {g.capability !== 'RENT_ONLY' && (
                        <Button variant="primary" size="sm" onClick={() => addToPos(g, 'buy')}>
                          +Buy
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right: POS Order Manifest & Payment (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card padding="md" className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#D8D2C5]">
                <h3 className="font-bold text-sm text-[#111D16] uppercase flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#152A20]" />
                  CURRENT POS REGISTER TICKET
                </h3>
                <Badge variant="primary">{cart.length} ITEMS</Badge>
              </div>

              {/* Customer Selector */}
              <div>
                <label className="text-[10px] text-[#5C665F] font-bold block mb-1 uppercase">ASSIGN CLIMBER ACCOUNT / GUEST:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="flex-1 bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs px-2.5 py-1.5 text-xs font-semibold text-[#111D16]"
                  />
                </div>
              </div>

              {/* Ticket Item List */}
              <div className="space-y-2 max-h-64 overflow-y-auto divide-y divide-[#D8D2C5]">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#7A857E]">
                    Scan items or click +Rent / +Buy on the catalog list.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-1 rounded-xs font-bold uppercase ${
                            item.mode === 'rent' ? 'bg-[#152A20] text-white' : 'bg-[#D97845] text-white'
                          }`}>
                            {item.mode}
                          </span>
                          <span className="font-bold text-[#111D16] truncate">{item.gear.name}</span>
                        </div>
                        <div className="text-[10px] text-[#5C665F] mt-0.5 font-mono-spec">
                          {item.mode === 'rent' 
                            ? `${formatCurrency(item.gear.dailyRentalPrice)}/d × ${item.days} days = ${formatCurrency(item.gear.dailyRentalPrice * item.days * item.qty)}`
                            : `${formatCurrency(item.gear.retailPrice)} × ${item.qty}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.mode === 'rent' && (
                          <div className="flex items-center gap-1 bg-[#EBE6DC] rounded-xs px-1 text-[10px] font-bold">
                            <span>{item.days}d</span>
                          </div>
                        )}
                        <button
                          onClick={() => removeFromPos(idx)}
                          className="text-[#7A857E] hover:text-[#B91C1C] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-3 border-t border-[#D8D2C5] space-y-1.5 text-xs text-[#5C665F]">
                <div className="flex justify-between">
                  <span>Register Subtotal:</span>
                  <span className="font-bold text-[#111D16] font-mono-spec">{formatCurrency(subtotal)}</span>
                </div>
                {depositBonds > 0 && (
                  <div className="flex justify-between text-[#152A20]">
                    <span>Refundable Escrow Bond:</span>
                    <span className="font-bold font-mono-spec">{formatCurrency(depositBonds)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#D8D2C5] text-sm text-[#111D16] font-bold">
                  <span>DUE NOW AT COUNTER:</span>
                  <span className="text-lg text-[#152A20] font-headline font-mono-spec">{formatCurrency(subtotal + depositBonds)}</span>
                </div>
              </div>

              {/* Payment Action */}
              <Button
                variant="accent"
                size="lg"
                fullWidth
                disabled={cart.length === 0}
                onClick={handleCheckout}
                icon={<CreditCard className="w-4 h-4" />}
              >
                Charge & Authorize Handoff
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
