import React, { useState } from 'react';
import { GEAR_ITEMS } from '../../data/mockData';
import { Card, Button, Badge } from '../../components/ui';
import { Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export const GearBundleBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart, selectedStation } = useAppStore();

  const [selectedGearIds, setSelectedGearIds] = useState<string[]>([
    'gear-01', // Hilleberg Tent
    'gear-03', // Western Mountaineering Sleeping Bag
    'gear-07', // Therm-a-rest Mat
  ]);

  const toggleSelect = (id: string) => {
    setSelectedGearIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedItems = GEAR_ITEMS.filter((g) => selectedGearIds.includes(g.id));
  const combinedDailyRate = selectedItems.reduce((acc, curr) => acc + curr.dailyRentalPrice, 0);
  const discountRate = selectedItems.length >= 3 ? 0.85 : 1; // 15% off for 3+ items
  const discountedDaily = Math.round(combinedDailyRate * discountRate);

  const handleCommitBundle = () => {
    selectedItems.forEach((item) => {
      addToCart({
        gear: item,
        rentalDays: 3,
        pickupStationId: selectedStation.id,
        dropoffStationId: selectedStation.id,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        damageProtectionTier: 'zero_liability',
        purchaseMode: 'rent',
      });
    });
    navigate('/manifest');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <div className="border-b border-[#D8D2C5] pb-4 flex justify-between items-end">
        <div>
          <Badge variant="secondary">BUNDLE & SAVE 15%</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-1">
            Custom Expedition Alpine Kit Builder
          </h1>
          <p className="text-xs text-[#5C665F]">Select 3 or more field units to unlock bundled tier pricing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {GEAR_ITEMS.map((gear) => {
          const isSelected = selectedGearIds.includes(gear.id);
          return (
            <Card
              key={gear.id}
              padding="sm"
              onClick={() => toggleSelect(gear.id)}
              className={`cursor-pointer transition space-y-3 ${
                isSelected ? 'border-[#152A20] ring-1 ring-[#152A20]' : 'hover:border-[#CCC6B9]'
              }`}
            >
              <div className="aspect-4/3 rounded-xs overflow-hidden relative bg-[#E7E2D8] border border-[#D8D2C5]">
                <img src={gear.imageUrl} alt={gear.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <div className={`w-6 h-6 rounded-xs flex items-center justify-center border ${
                    isSelected ? 'bg-[#152A20] text-white border-[#152A20]' : 'bg-[#F8F6F1] border-[#CCC6B9]'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#D97845] font-bold uppercase">{gear.brand}</span>
                <h4 className="text-xs font-bold text-[#152A20] font-headline truncate">{gear.name}</h4>
                <div className="flex justify-between items-baseline mt-1 text-xs">
                  <span className="font-bold text-[#152A20]">{formatCurrency(gear.dailyRentalPrice)}/day</span>
                  <span className="text-[10px] text-[#737C75]">Bond: ${gear.depositAmount}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Floating Bottom Bar */}
      <Card padding="md" className="sticky bottom-20 bg-[#E7E2D8] flex items-center justify-between">
        <div>
          <span className="text-xs text-[#5C665F] font-bold block">
            SELECTED UNITS ({selectedItems.length}): {selectedItems.length >= 3 ? '15% DISCOUNT UNLOCKED' : 'ADD 3 FOR 15% OFF'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#152A20] font-headline">{formatCurrency(discountedDaily)}/day</span>
            {selectedItems.length >= 3 && (
              <span className="text-xs text-[#737C75] line-through">{formatCurrency(combinedDailyRate)}/day</span>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleCommitBundle}
          disabled={selectedItems.length === 0}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Add Complete Bundle to Manifest
        </Button>
      </Card>
    </div>
  );
};
