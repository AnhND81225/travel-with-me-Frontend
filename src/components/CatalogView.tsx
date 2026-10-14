import React, { useState } from 'react';
import { 
  GearItem, 
  GearCategory, 
  OutpostStation 
} from '../types';
import { 
  Tent, 
  Sparkles, 
  Flame, 
  Briefcase, 
  ShieldAlert, 
  Radio, 
  Wind, 
  CheckCircle2, 
  Info,
  Layers,
  Star,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface CatalogViewProps {
  gearItems: GearItem[];
  selectedStation: OutpostStation;
  searchQuery: string;
  onSelectGear: (gear: GearItem) => void;
  onQuickRent: (gear: GearItem) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  gearItems,
  selectedStation,
  searchQuery,
  onSelectGear,
  onQuickRent
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GearCategory>('all');
  const [priceMode, setPriceMode] = useState<'rent' | 'buy'>('rent');
  const [onlyInStockAtStation, setOnlyInStockAtStation] = useState(false);

  const categories: { id: GearCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Equipment', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'tents', label: 'Tents & Shelters', icon: <Tent className="w-3.5 h-3.5" /> },
    { id: 'shells', label: 'Weather Shells', icon: <Wind className="w-3.5 h-3.5" /> },
    { id: 'thermal', label: 'Thermal & Sleep', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'hardware', label: 'Ice & Hardware', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: 'packs', label: 'Alpine Haul Packs', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'navigation', label: 'Satellite & Comm', icon: <Radio className="w-3.5 h-3.5" /> },
  ];

  const filteredGear = gearItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchModel = item.modelCode.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchDesc && !matchModel) {
        return false;
      }
    }
    if (onlyInStockAtStation) {
      const stock = item.stockByOutpost[selectedStation.id] || 0;
      if (stock <= 0) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      {/* Category Selection & Control Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D8D2C5] pb-5">
        {/* Category Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#152A20] text-[#F3EFE6] shadow-xs'
                  : 'bg-[#EBE6DC] text-[#5C665F] hover:text-[#111D16] hover:bg-[#DDD7CB] border border-[#D8D2C5]'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Pricing Mode Toggle & Filters */}
        <div className="flex items-center gap-3">
          {/* Station In-Stock Checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-[#5C665F] cursor-pointer select-none font-bold uppercase">
            <input
              type="checkbox"
              checked={onlyInStockAtStation}
              onChange={(e) => setOnlyInStockAtStation(e.target.checked)}
              className="rounded-xs bg-[#F8F6F1] border-[#D8D2C5] text-[#152A20] focus:ring-0 cursor-pointer"
            />
            <span>At {selectedStation.code} Only</span>
          </label>

          {/* Rent vs Acquire Toggle */}
          <div className="bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs p-0.5 flex items-center text-xs font-bold uppercase">
            <button
              onClick={() => setPriceMode('rent')}
              className={`px-2.5 py-1 rounded-xs transition cursor-pointer ${
                priceMode === 'rent'
                  ? 'bg-[#152A20] text-white shadow-xs'
                  : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
            >
              Rent ($/Day)
            </button>
            <button
              onClick={() => setPriceMode('buy')}
              className={`px-2.5 py-1 rounded-xs transition cursor-pointer ${
                priceMode === 'buy'
                  ? 'bg-[#D97845] text-white shadow-xs'
                  : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
            >
              Acquire ($ MSRP)
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#5C665F]">
        <div>
          SHOWING <span className="text-[#111D16] font-bold font-mono-spec">{filteredGear.length}</span> EXPEDITION SPECIMENS
          {searchQuery && <span> MATCHING "{searchQuery}"</span>}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-[#152A20] uppercase">
          <span className="w-2 h-2 rounded-full bg-[#152A20]"></span>
          <span>AUTOCLAVE & OPTICAL INSPECTION CERTIFIED</span>
        </div>
      </div>

      {/* Gear Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGear.map((item) => {
          const stationStock = item.stockByOutpost[selectedStation.id] || 0;
          const isAvailableAtStation = stationStock > 0;

          return (
            <div
              key={item.id}
              className="group bg-[#F8F6F1] hover:bg-white border border-[#D8D2C5] hover:border-[#152A20] rounded-xs overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-xs"
            >
              <div>
                {/* Image Banner */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-[#E7E2D8]">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Condition Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#152A20] text-white font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3 text-[#D7ECE1]" />
                      {item.condition.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Weight Tag */}
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#F8F6F1]/95 text-[#111D16] border border-[#D8D2C5] font-bold font-mono-spec">
                      {(item.weightGrams / 1000).toFixed(2)} KG
                    </span>
                  </div>

                  {/* Station Stock Status */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px]">
                    <span className={`px-2 py-0.5 rounded-xs border font-bold uppercase ${
                      isAvailableAtStation 
                        ? 'bg-[#F8F6F1]/95 text-[#152A20] border-[#D8D2C5]' 
                        : 'bg-[#FDF2EC]/95 text-[#D97845] border-[#F1BA9B]'
                    }`}>
                      {isAvailableAtStation 
                        ? `${stationStock} AT ${selectedStation.code}` 
                        : `TRANSFER REQ`}
                    </span>
                    <span className="flex items-center gap-1 text-[#111D16] font-bold bg-[#F8F6F1]/95 px-1.5 py-0.5 rounded-xs border border-[#D8D2C5] font-mono-spec">
                      <Star className="w-3 h-3 fill-[#D97845] text-[#D97845]" />
                      {item.rating}
                    </span>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-4 space-y-2">
                  <div>
                    <div className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">
                      {item.brand}
                    </div>
                    <h3 
                      onClick={() => onSelectGear(item)}
                      className="font-bold text-[#111D16] text-sm leading-snug group-hover:text-[#D97845] transition cursor-pointer font-headline truncate"
                    >
                      {item.name}
                    </h3>
                    <div className="text-[10px] text-[#7A857E] mt-0.5 font-mono-spec">
                      SKU: {item.modelCode}
                    </div>
                  </div>

                  <p className="text-xs text-[#5C665F] line-clamp-2 leading-relaxed font-body">
                    {item.description}
                  </p>

                  {/* Performance Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.temperatureRating && (
                      <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#EBE6DC] text-[#111D16] font-bold border border-[#D8D2C5]">
                        {item.temperatureRating}
                      </span>
                    )}
                    {item.waterproofRating && (
                      <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#EBE6DC] text-[#5C665F] font-bold border border-[#D8D2C5] truncate max-w-full">
                        {item.waterproofRating}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Action Footer */}
              <div className="p-4 pt-3 border-t border-[#D8D2C5] bg-[#EBE6DC]/50 space-y-3">
                <div className="flex items-baseline justify-between">
                  {priceMode === 'rent' ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-[#152A20] font-headline font-mono-spec">${item.dailyRentalPrice}</span>
                        <span className="text-xs text-[#5C665F]">/day</span>
                      </div>
                      <div className="text-[10px] text-[#7A857E] font-mono-spec">
                        Bond: ${item.depositAmount} (Refundable)
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-[#D97845] font-headline font-mono-spec">${item.retailPrice}</span>
                        <span className="text-xs text-[#5C665F]">MSRP</span>
                      </div>
                      <div className="text-[10px] text-[#152A20] font-bold">
                        Full Manufacturer Warranty
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectGear(item)}
                    className="text-xs font-bold text-[#111D16] hover:text-[#D97845] flex items-center gap-1 cursor-pointer uppercase"
                  >
                    <span>Specs</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectGear(item)}
                    className="w-full py-2 px-2.5 rounded-xs bg-[#F8F6F1] hover:bg-[#EBE6DC] text-[#111D16] border border-[#D8D2C5] text-xs font-bold uppercase transition cursor-pointer text-center"
                  >
                    Configure
                  </button>

                  <button
                    onClick={() => onQuickRent(item)}
                    className={`w-full py-2 px-2.5 rounded-xs text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center shadow-xs ${
                      priceMode === 'rent' ? 'bg-[#152A20] hover:bg-[#1E3A2D]' : 'bg-[#D97845] hover:bg-[#C66735]'
                    }`}
                  >
                    {priceMode === 'rent' ? 'Rent' : 'Acquire'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGear.length === 0 && (
        <div className="text-center py-16 bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-8 space-y-3 font-label">
          <Info className="w-8 h-8 text-[#7A857E] mx-auto" />
          <h4 className="text-base font-bold text-[#111D16] font-headline uppercase">No gear matching filter criteria</h4>
          <p className="text-xs text-[#5C665F] max-w-md mx-auto font-body">
            Try adjusting your search terms, removing station-only filters, or selecting "All Equipment".
          </p>
        </div>
      )}
    </div>
  );
};
