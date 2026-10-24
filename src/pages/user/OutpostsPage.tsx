import React from 'react';
import { OutpostNetworkView } from '../../components/OutpostNetworkView';
import { GEAR_ITEMS } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';

export const OutpostsPage: React.FC = () => {
  const { outposts, selectedStation, setSelectedStation } = useAppStore();

  return (
    <div>
      <OutpostNetworkView
        outposts={outposts}
        gearItems={GEAR_ITEMS}
        selectedStation={selectedStation}
        onSelectStation={setSelectedStation}
      />
    </div>
  );
};
