import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustodyHubView } from '../../components/CustodyHubView';
import { useAppStore } from '../../store/useAppStore';

export const CustodyHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { custodyItems, userRole, extendRental, clearCustody } = useAppStore();

  return (
    <div>
      <CustodyHubView
        custodyItems={custodyItems}
        userRole={userRole}
        onExtendRental={extendRental}
        onClearCustody={clearCustody}
      />
    </div>
  );
};
