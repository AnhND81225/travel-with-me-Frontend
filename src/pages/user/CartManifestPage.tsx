import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { ArrowLeft, Trash2, ShieldCheck, QrCode, ArrowRight } from 'lucide-react';
import { formatCurrency, generateOrderNumber } from '../../utils/formatters';

export const CartManifestPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeCartItem, clearCart, outposts } = useAppStore();
  const [pickupWindow, setPickupWindow] = useState('06:00 - 08:00 (Alpine Dawn Prep)');

  let rentalTotal = 0;
  let purchaseTotal = 0;
  let protectionTotal = 0;
  let interBranchTotal = 0;
  let depositBondTotal = 0;

  cartItems.forEach((item) => {
    if (item.purchaseMode === 'buy') {
      purchaseTotal += item.gear.retailPrice;
    } else {
      rentalTotal += item.gear.dailyRentalPrice * item.rentalDays;
      if (item.damageProtectionTier === 'zero_liability') {
        protectionTotal += 6 * item.rentalDays;
      }
      if (item.pickupStationId !== item.dropoffStationId) {
        interBranchTotal += 15;
      }
      depositBondTotal += item.gear.depositAmount;
    }
  });

  const dueNowTotal = rentalTotal + purchaseTotal + protectionTotal + interBranchTotal;

  const handleCheckout = () => {
    clearCart();
    navigate('/confirmation');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Continue Browsing Armoury</span>
      </Link>

      <div className="border-b border-[#D8D2C5] pb-4">
        <Badge variant="primary">EXPEDITION MANIFEST</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-1">
          Review Field Allocation Manifest ({cartItems.length} items)
        </h1>
      </div>

      {cartItems.length === 0 ? (
        <Card padding="lg" className="text-center py-16 space-y-3">
          <ShieldCheck className="w-12 h-12 text-[#A39B8D] mx-auto" />
          <h3 className="text-base font-bold text-[#152A20] font-headline">MANIFEST IS EMPTY</h3>
          <p className="text-xs text-[#5C665F]">Your reservation manifest does not contain any field assets.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Explore Equipment Catalog
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-3">
            {cartItems.map((item, idx) => {
              const pickup = outposts.find((o) => o.id === item.pickupStationId);
              const dropoff = outposts.find((o) => o.id === item.dropoffStationId);

              return (
                <Card key={idx} padding="sm" className="relative space-y-2">
                  <button
                    onClick={() => removeCartItem(idx)}
                    className="absolute top-3 right-3 text-[#737C75] hover:text-[#B91C1C] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex gap-3 pr-6">
                    <img src={item.gear.imageUrl} alt={item.gear.name} className="w-16 h-16 rounded-xs object-cover border border-[#D8D2C5]" />
                    <div>
                      <Badge variant="secondary">{item.purchaseMode === 'rent' ? 'FIELD RENTAL' : 'PURCHASE'}</Badge>
                      <h4 className="font-bold text-[#152A20] text-sm font-headline mt-0.5">{item.gear.name}</h4>
                      <span className="text-xs text-[#5C665F]">
                        {item.purchaseMode === 'rent' ? `${formatCurrency(item.gear.dailyRentalPrice)}/day • ${item.rentalDays} days` : formatCurrency(item.gear.retailPrice)}
                      </span>
                    </div>
                  </div>

                  {item.purchaseMode === 'rent' && (
                    <div className="pt-2 border-t border-[#DDD7CB] text-[11px] text-[#5C665F] flex justify-between">
                      <span>Pickup: {pickup?.name}</span>
                      <span>Return: {dropoff?.name}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="md:col-span-5 space-y-4">
            <Card padding="md" className="space-y-4">
              <h3 className="text-sm font-bold text-[#152A20] uppercase tracking-wider">MANIFEST TARIFF SUMMARY</h3>
              <div className="space-y-2 text-xs text-[#5C665F]">
                <div className="flex justify-between">
                  <span>Equipment Rental:</span>
                  <span className="font-bold text-[#152A20]">{formatCurrency(rentalTotal)}</span>
                </div>
                {purchaseTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Retail Purchase:</span>
                    <span className="font-bold text-[#152A20]">{formatCurrency(purchaseTotal)}</span>
                  </div>
                )}
                {protectionTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Glacier Shield Protection:</span>
                    <span className="font-bold text-[#152A20]">{formatCurrency(protectionTotal)}</span>
                  </div>
                )}
                {interBranchTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Shuttle Courier Fee:</span>
                    <span className="font-bold text-[#152A20]">{formatCurrency(interBranchTotal)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#D8D2C5] flex justify-between text-[#152A20] font-bold">
                  <span>Refundable Security Escrow:</span>
                  <span>{formatCurrency(depositBondTotal)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D8D2C5]">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-xs font-bold text-[#5C665F]">DUE IMMEDIATELY:</span>
                  <span className="text-2xl font-bold text-[#152A20] font-headline">{formatCurrency(dueNowTotal)}</span>
                </div>
                <Button variant="primary" fullWidth size="lg" onClick={handleCheckout}>
                  Confirm Manifest & Reserve
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
