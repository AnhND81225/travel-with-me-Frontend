import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../../components/HeroSection';
import { CatalogView } from '../../components/CatalogView';
import { useAppStore } from '../../store/useAppStore';
import { GEAR_ITEMS } from '../../data/mockData';
import { GearItem } from '../../interfaces';

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    selectedStation, 
    searchQuery, 
    setSearchQuery, 
    setSelectedGearModal 
  } = useAppStore();

  const handleSelectGear = (gear: GearItem) => {
    setSelectedGearModal(gear);
  };

  const handleQuickRent = (gear: GearItem) => {
    setSelectedGearModal(gear);
  };

  return (
    <div>
      <HeroSection
        station={selectedStation}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNavigate={(screen) => {
          if (screen === 'expeditions') navigate('/expeditions');
          else if (screen === 'custody') navigate('/custody');
          else if (screen === 'outposts') navigate('/outposts');
          else if (screen === 'passport') navigate('/passport');
        }}
      />
      <CatalogView
        gearItems={GEAR_ITEMS}
        selectedStation={selectedStation}
        searchQuery={searchQuery}
        onSelectGear={handleSelectGear}
        onQuickRent={handleQuickRent}
      />
    </div>
  );
};
