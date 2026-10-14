import React from 'react';
import { FleetOperationsView } from '../../components/FleetOperationsView';
import { useAppStore } from '../../store/useAppStore';

export const FleetLedgerPage: React.FC = () => {
  const { fleetUnits, outposts } = useAppStore();

  return (
    <div>
      <FleetOperationsView fleetUnits={fleetUnits} outposts={outposts} />
    </div>
  );
};
