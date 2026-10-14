import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button, Badge } from '../../components/ui';
import { ArrowLeft, QrCode, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

export const StationReturnPassPage: React.FC = () => {
  const { custodyItems, selectedStation } = useAppStore();
  const activeItem = custodyItems[0];

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10 space-y-6 text-center font-label">
      <Link to="/custody" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Custody Hub</span>
      </Link>

      <div>
        <Badge variant="primary">TOUCHLESS CHECK-IN</Badge>
        <h1 className="text-2xl font-bold text-[#152A20] font-headline mt-1">
          Station Return QR Pass
        </h1>
        <p className="text-xs text-[#5C665F]">Present at {selectedStation.name} Counter</p>
      </div>

      <Card padding="md" className="space-y-4">
        <div className="bg-white p-6 rounded-xs inline-block border border-[#D8D2C5] shadow-xs">
          <QrCode className="w-48 h-48 text-[#152A20]" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-[#152A20] font-headline text-sm">
            MANIFEST #{activeItem?.orderNumber || 'TK-84920'}
          </div>
          <p className="text-[#5C665F] font-body">Scan to commence automatic optical condition audit and deposit bond release.</p>
        </div>
      </Card>
    </div>
  );
};
