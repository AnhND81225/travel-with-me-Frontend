import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  MapPin, 
  ArrowRight, 
  Sparkles,
  Mountain,
  Compass,
  Tent,
  Zap
} from 'lucide-react';
import { OutpostStation, ScreenId } from '../types';

interface HeroSectionProps {
  station: OutpostStation;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  station,
  searchQuery,
  setSearchQuery,
  onNavigate
}) => {
  return (
    <div className="relative overflow-hidden bg-[#EBE6DC] border-b border-[#D8D2C5]">
      {/* Subtle Dot Grid Canvas Pattern */}
      <div className="absolute inset-0 bg-topo-pattern opacity-60 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        {/* Breadcrumb / Coordinate Tag */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xs bg-[#F3EFE6] border border-[#D8D2C5] text-[11px] font-label text-[#111D16] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#152A20]"></span>
            <span className="font-bold">OUTPOST SECTOR: {station.code}</span>
            <span className="text-[#A39B8D]">•</span>
            <span className="text-[#5C665F] font-medium font-mono-spec">{station.coordinates}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#FDF2EC] border border-[#F1BA9B] text-[11px] font-label text-[#D97845] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FIELD-GRADE 100% INSPECTED CUSTODY</span>
          </div>
        </div>

        {/* Hero Headline & Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111D16] tracking-tight leading-tight font-headline">
              EXPEDITION ARMOURY <br />
              <span className="text-[#D97845]">
                & HIGH-ALTITUDE RENTALS
              </span>
            </h1>

            <p className="text-[#4A524C] text-sm sm:text-base max-w-2xl leading-relaxed font-body">
              Equipping mountaineers, speleologists, and high-plateau expeditions across Vietnam. 
              Rent technical 4-season geodesic shelters, Gore-Tex Pro outer armor, satellite telemetry, and ice hardware — deployed directly from five mountain outposts with zero-liability guarantee.
            </p>

            {/* Action Buttons styled according to palette */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('catalog')}
                className="px-5 py-2.5 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-[#F3EFE6] font-label font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#F3EFE6]" />
                <span>Reserve Field Gear</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('expeditions')}
                className="px-5 py-2.5 rounded-xs bg-[#D97845] hover:bg-[#C66735] text-white font-label font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Mountain className="w-4 h-4" />
                <span>Guided Expeditions</span>
              </button>

              <button
                onClick={() => onNavigate('custody')}
                className="px-4 py-2.5 rounded-xs bg-[#F8F6F1] hover:bg-[#EBE6DC] border border-[#D8D2C5] text-[#111D16] text-xs font-label font-bold transition flex items-center gap-2 cursor-pointer uppercase"
              >
                <Zap className="w-4 h-4 text-[#152A20]" />
                <span>Custody Audit</span>
              </button>
            </div>
          </div>

          {/* Station Status Telemetry Card (Right Panel) */}
          <div className="lg:col-span-5">
            <div className="rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] p-5 shadow-xs relative space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8D2C5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xs bg-[#152A20] flex items-center justify-center text-[#F3EFE6]">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-bold text-[#111D16] font-headline uppercase tracking-wider">
                    {station.name}
                  </span>
                </div>
                <span className="text-[11px] font-label font-bold text-[#111D16] px-2 py-0.5 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5]">
                  {station.elevation}
                </span>
              </div>

              {/* Station metrics grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-label">
                <div className="bg-[#EBE6DC] rounded-xs p-2.5 border border-[#D8D2C5]">
                  <span className="text-[#7A857E] text-[10px] block font-bold uppercase">RIDGE TEMPERATURE</span>
                  <span className="text-[#D97845] font-bold text-sm font-mono-spec">{station.weather.temp}</span>
                </div>
                <div className="bg-[#EBE6DC] rounded-xs p-2.5 border border-[#D8D2C5]">
                  <span className="text-[#7A857E] text-[10px] block font-bold uppercase">GALE VELOCITY</span>
                  <span className="text-[#111D16] font-bold font-mono-spec">{station.weather.wind}</span>
                </div>
                <div className="bg-[#EBE6DC] rounded-xs p-2.5 border border-[#D8D2C5]">
                  <span className="text-[#7A857E] text-[10px] block font-bold uppercase">RADAR CONDITIONS</span>
                  <span className="text-[#111D16] font-bold truncate block">{station.weather.condition}</span>
                </div>
                <div className="bg-[#EBE6DC] rounded-xs p-2.5 border border-[#D8D2C5]">
                  <span className="text-[#7A857E] text-[10px] block font-bold uppercase">ARMOURY READINESS</span>
                  <span className="text-[#152A20] font-bold font-mono-spec">{station.inventorySummary.totalUnits} UNITS READY</span>
                </div>
              </div>

              {/* Search input */}
              <div className="mt-2 relative">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search technical gear, tents, axes, Gore-Tex..."
                    className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs pl-9 pr-14 py-2 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] font-body transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 text-[10px] text-[#7A857E] hover:text-[#111D16] font-label font-bold cursor-pointer"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
