import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { ArrowLeft, Radio, ShieldAlert, PhoneCall, CheckCircle2, Mountain } from 'lucide-react';

export const SafetyProtocolsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Storefront</span>
      </Link>

      <div className="border-b border-[#D8D2C5] pb-4">
        <Badge variant="primary">ALPINE SAFETY SYSTEM</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-1">
          Emergency Beacon & Mountain Rescue Network
        </h1>
        <p className="text-xs text-[#5C665F]">Iridium Global Satellite Telemetry & Search and Rescue Protocols</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="md" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#152A20]">
            <Radio className="w-4 h-4 text-[#152A20]" />
            GARMIN INREACH SOS INTEGRATION
          </div>
          <p className="text-xs text-[#5C665F] font-body leading-relaxed">
            All satellite communicators rented from TerraPeak Outpost are pre-provisioned on the dedicated 406.037 MHz emergency telemetry mesh.
            Triggering the SOS button instantly notifies local ranger outposts and dispatches mountain rescue squads.
          </p>
        </Card>

        <Card padding="md" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#D97845]">
            <ShieldAlert className="w-4 h-4 text-[#D97845]" />
            HIGH-ALTITUDE HYPOTHERMIA PROTOCOL
          </div>
          <p className="text-xs text-[#5C665F] font-body leading-relaxed">
            Ridge winds on Fansipan (3,143m) routinely drop effective temperatures below -5°C with severe riming ice. 
            All climbers are mandated to carry 4-season Kerlon geodesic shelters and -15°C down bags when camping above 2,200m.
          </p>
        </Card>
      </div>
    </div>
  );
};
