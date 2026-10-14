import React from 'react';
import { OutpostNetworkView } from '../../components/OutpostNetworkView';
import { OUTPOSTS, GEAR_ITEMS } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';

export const OutpostsPage: React.FC = () => {
  const { selectedStation, setSelectedStation } = useAppStore();

  return (
    <div>
      <OutpostNetworkView
        outposts={OUTPOSTS}
        gearItems={GEAR_ITEMS}
        selectedStation={selectedStation}
        onSelectStation={setSelectedStation}
      />
    </div>
  );
};
