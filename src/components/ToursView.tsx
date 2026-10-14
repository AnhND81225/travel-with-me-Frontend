import React, { useState } from 'react';
import { GuidedExpedition } from '../types';
import { 
  Mountain, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle, 
  ChevronRight, 
  ChevronDown, 
  ShieldCheck, 
  TrendingUp, 
  Calendar,
  Sparkles,
  ArrowRight,
  PackageCheck
} from 'lucide-react';

interface ToursViewProps {
  expeditions: GuidedExpedition[];
  onBookExpedition: (expedition: GuidedExpedition, climbers: number, includeGearBundle: boolean) => void;
}

export const ToursView: React.FC<ToursViewProps> = ({
  expeditions,
  onBookExpedition
}) => {
  const [selectedExpedition, setSelectedExpedition] = useState<GuidedExpedition>(expeditions[0]);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'gear' | 'guide'>('itinerary');
  const [climberCount, setClimberCount] = useState(1);
  const [includeGearRental, setIncludeGearRental] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const gearBundleAddonPrice = 95;
  const baseCost = selectedExpedition.pricePerClimber * climberCount;
  const gearAddonTotal = includeGearRental ? gearBundleAddonPrice * climberCount : 0;
  const totalTourCost = baseCost + gearAddonTotal;

  const handleBooking = () => {
    onBookExpedition(selectedExpedition, climberCount, includeGearRental);
    setBookingConfirmed(true);
    setTimeout(() => setBookingConfirmed(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-label">
      {/* Page Header */}
      <div className="border-b border-[#D8D2C5] pb-5">
        <div className="flex items-center gap-2 text-xs font-label text-[#152A20] font-bold mb-1">
          <Mountain className="w-4 h-4 text-[#152A20]" />
          <span>EXPEDITION PROGRAMMING • 2026 FIELD SEASON</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#152A20] tracking-tight font-headline">
          GUIDED HIGH-ALTITUDE & WILDERNESS TRAVERSES
        </h2>
        <p className="text-xs sm:text-sm text-[#4A524C] mt-1 max-w-3xl font-body">
          Led exclusively by UIAGM mountain guides, local indigenous trackers, and certified alpine instructors. 
          All expeditions include emergency satellite telemetry link to regional rescue outposts.
        </p>
      </div>

      {/* Main Tour Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tour Selection Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-label text-[#5C665F] font-bold uppercase tracking-wider">
            AVAILABLE EXPEDITIONS ({expeditions.length})
          </div>

          <div className="space-y-4">
            {expeditions.map((exp) => {
              const isSelected = exp.id === selectedExpedition.id;
              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpedition(exp)}
                  className={`p-4 rounded-xs border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#F3EFE6] border-[#152A20] shadow-sm ring-1 ring-[#152A20]'
                      : 'bg-[#F3EFE6]/70 border-[#D8D2C5] hover:border-[#CCC6B9] hover:bg-[#F3EFE6]'
                  }`}
                >
                  {/* Subtle active indicator bar */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#152A20]"></div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-label font-bold px-2 py-0.5 rounded-md bg-[#EAE5DB] text-[#152A20] border border-[#D8D2C5]">
                          {exp.difficulty}
                        </span>
                        <span className="text-[10px] font-label text-[#737C75]">
                          {exp.duration}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#152A20] text-base leading-snug font-headline">
                        {exp.title}
                      </h3>
                      <p className="text-xs text-[#5C665F] font-body">
                        {exp.subtitle}
                      </p>
                    </div>

                    <div className="text-right shrink-0 font-label">
                      <div className="text-base font-bold text-[#D97845] font-headline">${exp.pricePerClimber}</div>
                      <div className="text-[10px] text-[#737C75]">per climber</div>
                    </div>
                  </div>

                  {/* Badges strip */}
                  <div className="mt-3 pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-[11px] font-label text-[#5C665F]">
                    <span className="flex items-center gap-1 font-semibold text-[#152A20]">
                      <TrendingUp className="w-3.5 h-3.5 text-[#152A20]" />
                      {exp.elevationGain}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#737C75]" />
                      {exp.region}
                    </span>
                    <span className="text-[#152A20] font-bold">
                      {exp.slotsRemaining} SLOTS LEFT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Expedition Dossier & Booking Module */}
        <div className="lg:col-span-7 bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs p-6 shadow-sm space-y-6">
          {/* Header Banner */}
          <div className="relative rounded-xs overflow-hidden aspect-21/9 bg-[#E7E2D8] border border-[#D8D2C5]">
            <img
              src={selectedExpedition.imageUrl}
              alt={selectedExpedition.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-label font-bold px-2.5 py-0.5 rounded-md bg-[#152A20] text-white">
                  {selectedExpedition.peakAltitude}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1 font-headline">
                  {selectedExpedition.title}
                </h3>
              </div>
              <div className="hidden sm:block text-right font-label bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xs border border-[#D8D2C5]">
                <div className="text-[10px] text-[#5C665F]">NEXT LAUNCH</div>
                <div className="text-xs font-bold text-[#152A20]">{selectedExpedition.nextDeparture}</div>
              </div>
            </div>
          </div>

          {/* Dossier Tabs: Itinerary, Gear, Guide */}
          <div className="flex border-b border-[#D8D2C5] text-xs font-label">
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`pb-3 px-4 font-bold transition border-b-2 cursor-pointer ${
                activeTab === 'itinerary'
                  ? 'border-[#152A20] text-[#152A20]'
                  : 'border-transparent text-[#737C75] hover:text-[#152A20]'
              }`}
            >
              DAY-BY-DAY ITINERARY
            </button>
            <button
              onClick={() => setActiveTab('gear')}
              className={`pb-3 px-4 font-bold transition border-b-2 cursor-pointer ${
                activeTab === 'gear'
                  ? 'border-[#152A20] text-[#152A20]'
                  : 'border-transparent text-[#737C75] hover:text-[#152A20]'
              }`}
            >
              REQUIRED FIELD GEAR
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-3 px-4 font-bold transition border-b-2 cursor-pointer ${
                activeTab === 'guide'
                  ? 'border-[#152A20] text-[#152A20]'
                  : 'border-transparent text-[#737C75] hover:text-[#152A20]'
              }`}
            >
              LEAD RANGER DOSSIER
            </button>
          </div>

          {/* Tab 1: Itinerary & Elevation Profile */}
          {activeTab === 'itinerary' && (
            <div className="space-y-4">
              {/* Elevation Profile Waypoints */}
              <div className="bg-[#EBE6DC] p-4 rounded-xs border border-[#D8D2C5] space-y-2.5">
                <div className="text-[10px] font-label font-bold text-[#5C665F] flex items-center justify-between">
                  <span>ALTITUDE PROFILE (METERS ABOVE SEA LEVEL):</span>
                  <span className="text-[#152A20]">PEAK: {selectedExpedition.peakAltitude}</span>
                </div>
                {/* Visual bar graph representation */}
                <div className="grid grid-cols-5 gap-2 text-center font-label">
                  {selectedExpedition.elevationProfile.map((pt, idx) => (
                    <div key={idx} className="bg-[#F3EFE6] p-2.5 rounded-xs border border-[#D8D2C5]">
                      <div className="text-[#152A20] text-xs font-bold font-headline">{pt.altitude}M</div>
                      <div className="text-[9px] text-[#737C75] truncate mt-0.5">{pt.point.split(' ')[0]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Stages */}
              <div className="space-y-3">
                {selectedExpedition.itinerary.map((stage, idx) => (
                  <div key={idx} className="p-3.5 rounded-xs bg-[#EBE6DC] border border-[#DDD7CB] space-y-1">
                    <div className="flex items-center justify-between text-xs font-label">
                      <span className="text-[#152A20] font-bold">{stage.day} • {stage.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F3EFE6] text-[#5C665F] font-semibold border border-[#D8D2C5]">
                        {stage.campElevation}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A524C] leading-relaxed pt-1 font-body">
                      {stage.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Required Gear */}
          {activeTab === 'gear' && (
            <div className="space-y-4">
              <div className="bg-[#EAE5DB] border border-[#D8D2C5] rounded-xs p-4 text-xs font-label text-[#152A20] flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#152A20] shrink-0" />
                <span className="font-medium">
                  Climbers must present mandatory gear at Basecamp Check-in. You may bring your own or select our Outpost Armoured Bundle below.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-label">
                {selectedExpedition.requiredGear.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-xs bg-[#EBE6DC] border border-[#DDD7CB] text-[#152A20]">
                    <CheckCircle className="w-4 h-4 text-[#152A20] shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Lead Guide */}
          {activeTab === 'guide' && (
            <div className="p-4 rounded-xs bg-[#EBE6DC] border border-[#DDD7CB] space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedExpedition.leadGuide.photo}
                  alt={selectedExpedition.leadGuide.name}
                  className="w-16 h-16 rounded-xs object-cover border-2 border-[#152A20]"
                />
                <div>
                  <h4 className="text-base font-bold text-[#152A20] font-headline">
                    {selectedExpedition.leadGuide.name}
                  </h4>
                  <p className="text-xs text-[#D97845] font-label font-bold mt-0.5">
                    {selectedExpedition.leadGuide.certification}
                  </p>
                  <div className="text-[11px] text-[#5C665F] font-label mt-1">
                    Verified Outpost Expeditions Led: <span className="text-[#152A20] font-bold">{selectedExpedition.leadGuide.expeditionsLed}+</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Booking & Roster Bar */}
          <div className="pt-4 border-t border-[#D8D2C5] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Climber Seats */}
              <div>
                <label className="text-[11px] font-label font-bold text-[#5C665F] block mb-1">
                  CLIMBERS IN SQUAD:
                </label>
                <div className="flex items-center gap-3 bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5] font-label">
                  <Users className="w-4 h-4 text-[#152A20]" />
                  <select
                    value={climberCount}
                    onChange={(e) => setClimberCount(Number(e.target.value))}
                    className="bg-transparent text-[#152A20] text-xs font-bold w-full focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n} className="bg-[#F3EFE6] text-[#152A20]">
                        {n} Climber{n > 1 ? 's' : ''} ({selectedExpedition.slotsRemaining >= n ? 'Confirmed Slots' : 'Waitlist'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gear Bundle Addon Option */}
              <div>
                <label className="text-[11px] font-label font-bold text-[#5C665F] block mb-1">
                  ARMOURY GEAR RENTAL BUNDLE:
                </label>
                <button
                  onClick={() => setIncludeGearRental(!includeGearRental)}
                  className={`w-full p-2.5 rounded-xs border text-left font-label text-xs flex items-center justify-between transition cursor-pointer ${
                    includeGearRental
                      ? 'bg-[#152A20] border-[#152A20] text-white'
                      : 'bg-[#EBE6DC] border-[#D8D2C5] text-[#5C665F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4" />
                    <span>All-Inclusive Gear (+${gearBundleAddonPrice})</span>
                  </div>
                  <span className="font-bold">{includeGearRental ? 'INCLUDED' : 'BRING OWN'}</span>
                </button>
              </div>
            </div>

            {/* Total & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="font-label">
                <div className="text-[10px] text-[#5C665F] font-bold">TOTAL EXPEDITION TARIFF:</div>
                <div className="text-2xl font-bold text-[#D97845] font-headline">
                  ${totalTourCost}
                </div>
                <div className="text-[10px] text-[#737C75]">
                  Includes permits, mountain insurance, guide fee {includeGearRental ? '+ expedition gear package' : ''}
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingConfirmed}
                className="px-6 py-3 rounded-xs bg-[#D97845] hover:bg-[#C66735] text-white font-label font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {bookingConfirmed ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span>EXPEDITION ROSTER BOOKED!</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Expedition Booking</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
