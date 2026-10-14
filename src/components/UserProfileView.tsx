import React from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  Award, 
  MapPin, 
  FileText, 
  Download, 
  CheckCircle2, 
  Radio, 
  AlertCircle 
} from 'lucide-react';
import { ActiveCustodyItem } from '../types';

interface UserProfileViewProps {
  custodyItems: ActiveCustodyItem[];
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  custodyItems
}) => {
  const climberProfile = {
    callSign: 'EXP-VN-0824',
    name: 'Alexandre Mercer',
    email: 'ducanh.nguyenkl@gmail.com',
    tier: 'Tier 3 Silver Alpine Custodian',
    integrityScore: '99.4%',
    inspectionsPassed: 18,
    activeBondHeld: 600,
    emergencyBeacon: 'Garmin Iridium ID: #8819-01 (ACTIVE SYNC)',
    bloodType: 'O+ Positive (High-Altitude Tolerance Checked)',
    completedExpeditions: [
      { name: 'Fansipan West Ridge Technical Ascent', year: 'Nov 2025', guide: 'Vang A Sinh', badge: 'Summit Cleared' },
      { name: 'Dong Van Karst Plateau Traverse', year: 'Apr 2025', guide: 'Nguyen Tuan Kiet', badge: 'Karst Nav Cleared' },
      { name: 'Bidoup Primeval Moss Cloud Trail', year: 'Jan 2025', guide: 'Ka Lien', badge: 'Ridge Master' }
    ]
  };

  const downloadAgreement = () => {
    alert('TerraPeak Outpost Digital Custody Agreement #TK-84920 downloaded as signed PDF.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-label">
      {/* Header */}
      <div className="border-b border-[#D8D2C5] pb-5">
        <div className="flex items-center gap-2 text-xs font-label text-[#152A20] font-bold mb-1">
          <UserCheck className="w-4 h-4 text-[#152A20]" />
          <span>OUTPOST EXPEDITION PASSPORT • CLIMBER DOSSIER</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#152A20] tracking-tight font-headline">
          ALPINE CUSTODIAN CREDENTIALS
        </h2>
        <p className="text-xs sm:text-sm text-[#4A524C] mt-1 max-w-3xl font-body">
          Verified gear custody history, equipment deposit escrow status, and certified expedition credentials valid across all 5 national stations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Digital Tactical Passport Card */}
        <div className="lg:col-span-5 space-y-4">
          {/* Passport Card styled with Deep Forest Pine #152A20 */}
          <div className="rounded-xs bg-[#152A20] text-white p-6 shadow-xl relative overflow-hidden font-label space-y-5">
            {/* Top Security Line */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2C4938]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D7ECE1] animate-pulse"></span>
                <span className="text-xs font-bold tracking-wider">TERRAPEAK CLIMBER PASSPORT</span>
              </div>
              <span className="text-[10px] text-[#D7ECE1] px-2 py-0.5 rounded-md bg-[#254231] font-bold">
                {climberProfile.callSign}
              </span>
            </div>

            {/* User identification */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xs bg-[#254231] border-2 border-[#ADCBBB] overflow-hidden shrink-0 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                  alt="Climber photo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-headline">{climberProfile.name}</h3>
                <div className="text-xs text-[#ADCBBB] font-body">{climberProfile.email}</div>
                <div className="text-xs text-[#D97845] font-bold mt-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#D97845]" />
                  {climberProfile.tier}
                </div>
              </div>
            </div>

            {/* Custody Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#1C362A] p-3.5 rounded-xs border border-[#2B4E3C]">
              <div>
                <span className="text-[10px] text-[#ADCBBB] block font-semibold">INTEGRITY INDEX</span>
                <span className="text-white font-bold text-sm font-headline">{climberProfile.integrityScore}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#ADCBBB] block font-semibold">PASSED AUDITS</span>
                <span className="text-white font-bold text-sm font-headline">{climberProfile.inspectionsPassed} DEPLOYMENTS</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-[#2B4E3C]">
                <span className="text-[10px] text-[#ADCBBB] block font-semibold">SATELLITE SOS TRANSPONDER</span>
                <span className="text-[#D7ECE1] text-[11px] font-medium">{climberProfile.emergencyBeacon}</span>
              </div>
            </div>

            {/* Bond Escrow Banner */}
            <div className="p-3.5 rounded-xs bg-[#1C362A] border border-[#2B4E3C] text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#ADCBBB] block font-semibold">CURRENT ESCROW BOND:</span>
                <span className="text-base font-bold text-white font-headline">${climberProfile.activeBondHeld}.00 USD</span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-[#D97845] text-white font-bold">
                100% REFUNDABLE
              </span>
            </div>
          </div>

          {/* Quick Document Downloads */}
          <div className="bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs p-4 space-y-2 font-label text-xs">
            <div className="text-[#5C665F] text-[10px] font-bold uppercase tracking-wider mb-2">
              EXPEDITION AGREEMENTS & WAIVERS:
            </div>
            <button
              onClick={downloadAgreement}
              className="w-full p-3 rounded-xs bg-[#EBE6DC] hover:bg-[#E2DDD1] border border-[#D8D2C5] text-[#152A20] font-bold flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#152A20]" />
                <span>Signed Master Custody Waiver (PDF)</span>
              </div>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Historical Expeditions */}
        <div className="lg:col-span-7 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#D8D2C5] font-label">
            <h3 className="text-base font-bold text-[#152A20] uppercase tracking-wider flex items-center gap-2 font-headline">
              <Award className="w-4 h-4 text-[#D97845]" />
              VERIFIED EXPEDITION BADGES & FIELD HISTORY
            </h3>
            <span className="text-xs text-[#5C665F] font-semibold">3 VERIFIED LOGS</span>
          </div>

          <div className="space-y-4">
            {climberProfile.completedExpeditions.map((exp, idx) => (
              <div key={idx} className="p-4 rounded-xs bg-[#EBE6DC] border border-[#DDD7CB] space-y-2 font-label">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#152A20] font-headline">{exp.name}</h4>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-[#152A20] text-white font-bold">
                    {exp.badge}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5C665F] pt-1 border-t border-[#D8D2C5]">
                  <span>Departure: {exp.year}</span>
                  <span>Lead Guide: {exp.guide}</span>
                  <span className="text-[#152A20] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#152A20]" />
                    Zero Gear Damage
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Custody Mini Summary */}
          <div className="pt-4 border-t border-[#D8D2C5] space-y-3 font-label">
            <div className="text-xs text-[#5C665F] font-bold uppercase tracking-wider">
              CURRENT GEAR UNDER YOUR CUSTODY:
            </div>
            {custodyItems.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xs bg-[#EBE6DC] border border-[#DDD7CB] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#152A20] font-headline">{item.gearItem.name}</div>
                  <div className="text-[11px] text-[#737C75]">Due: {item.dueDate}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FDF2EC] text-[#D97845] font-bold border border-[#F1BA9B] text-[10px]">
                  {item.hoursRemaining}H LEFT
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
