import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { ArrowLeft, FileText, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const WaiverAgreementPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      <Link to="/passport" className="inline-flex items-center gap-1.5 text-xs text-[#5C665F] hover:text-[#152A20] font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Climber Passport</span>
      </Link>

      <div className="border-b border-[#D8D2C5] pb-4 flex justify-between items-end">
        <div>
          <Badge variant="primary">LEGAL ACCORD</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#152A20] font-headline mt-1">
            Master Custody & Equipment Liability Waiver
          </h1>
          <p className="text-xs text-[#5C665F]">TerraPeak Outpost Operations • Document ID: #WVR-VN-2026-A</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={() => alert('Waiver downloaded as PDF')}
        >
          Download PDF
        </Button>
      </div>

      <Card padding="lg" className="space-y-4 text-xs font-body leading-relaxed text-[#4A524C]">
        <h4 className="text-sm font-bold text-[#152A20] font-headline">SECTION 1: EQUIPMENT CUSTODY & DEPLOYMENT BOND</h4>
        <p>
          The renter ("Climber") acknowledges receipt of high-altitude alpine equipment tested and verified in field-grade operational condition. 
          A security deposit bond is held in digital escrow throughout the deployment period and released automatically upon successful 5-point optical audit at any outpost branch.
        </p>

        <h4 className="text-sm font-bold text-[#152A20] font-headline">SECTION 2: GLACIER SHIELD ZERO-LIABILITY CLAUSE</h4>
        <p>
          Renting units covered under Glacier Shield Protection ($6/day) incur zero deductible on accidental fabric tears, zipper blowouts, or structural pole bend resulting from adverse weather conditions (gales exceeding 50km/h or sub-zero freezing). 
          Intentional neglect or loss of serialized assets remains subject to standard replacement tariffs.
        </p>

        <h4 className="text-sm font-bold text-[#152A20] font-headline">SECTION 3: CROSS-BRANCH LOGISTICS & RETURNS</h4>
        <p>
          Cross-branch returns between Sapa, Da Lat, Ha Giang, Phong Nha, and Hanoi are permitted without prior authorization. Equipment returned to an alternative outpost incurs an automated $15 internal shuttle courier surcharge.
        </p>
      </Card>
    </div>
  );
};
