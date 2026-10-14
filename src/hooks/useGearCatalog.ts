import { useState, useMemo } from 'react';
import { GearItem, GearCategory, OutpostStation } from '../interfaces';
import { GEAR_ITEMS } from '../data/mockData';

export function useGearCatalog(selectedStation: OutpostStation, initialSearch = '') {
  const [selectedCategory, setSelectedCategory] = useState<GearCategory>('all');
  const [priceMode, setPriceMode] = useState<'rent' | 'buy'>('rent');
  const [onlyInStockAtStation, setOnlyInStockAtStation] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const filteredGear = useMemo(() => {
    return GEAR_ITEMS.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search filter
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
      // In-stock at station filter
      if (onlyInStockAtStation) {
        const stock = item.stockByOutpost[selectedStation.id] || 0;
        if (stock <= 0) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery, onlyInStockAtStation, selectedStation.id]);

  return {
    gearItems: filteredGear,
    totalCount: filteredGear.length,
    selectedCategory,
    setSelectedCategory,
    priceMode,
    setPriceMode,
    onlyInStockAtStation,
    setOnlyInStockAtStation,
    searchQuery,
    setSearchQuery,
  };
}
