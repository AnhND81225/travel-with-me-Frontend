import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { CheckCircle2, QrCode, ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { generateOrderNumber } from '../../utils/formatters';

export const BookingConfirmationPage: React.FC = () => {
  const orderNumber = generateOrderNumber();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-6 font-label">
      <div className="w-16 h-16 rounded-full bg-[#E0EFE6] border-2 border-[#152A20] flex items-center justify-center text-[#152A20] mx-auto shadow-sm">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <Badge variant="primary">RESERVATION ALLOCATED</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-2">
          Manifest #{orderNumber} Confirmed
        </h1>
        <p className="text-xs text-[#5C665F] mt-1 font-body max-w-md mx-auto">
          Your alpine equipment reservation has been transmitted to Sapa Ridge Outpost (SP-1604). Our armorers have prepared and tested your kit.
        </p>
      </div>

      <Card padding="md" className="space-y-4 max-w-md mx-auto">
        <div className="bg-white p-6 rounded-xs inline-block border border-[#D8D2C5] shadow-xs">
          <QrCode className="w-40 h-40 text-[#152A20]" />
        </div>
        <div className="text-xs text-[#5C665F] space-y-1">
          <div className="font-bold text-[#152A20]">STATION TOUCHLESS PICKUP PASS</div>
          <p>Scan this QR at the armory counter during your allocated departure window.</p>
        </div>
      </Card>

      <div className="flex justify-center gap-3">
        <Link to="/custody">
          <Button variant="secondary" size="md">
            View Custody Ledger
          </Button>
        </Link>
        <Link to="/">
          <Button variant="primary" size="md" icon={<Compass className="w-4 h-4" />}>
            Return to Armoury
          </Button>
        </Link>
      </div>
    </div>
  );
};
