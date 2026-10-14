import React from 'react';
import { UserProfileView } from '../../components/UserProfileView';
import { useAppStore } from '../../store/useAppStore';

export const ClimberPassportPage: React.FC = () => {
  const { custodyItems } = useAppStore();

  return (
    <div>
      <UserProfileView custodyItems={custodyItems} />
    </div>
  );
};
