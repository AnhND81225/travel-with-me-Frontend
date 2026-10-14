import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Thermometer, Wind, Sparkles, User, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const TelemetryBanner: React.FC = () => {
  const { selectedStation, userRole, setUserRole } = useAppStore();

  return (
    <div className="bg-[#EBE6DC] border-b border-[#D8D2C5] px-4 sm:px-8 py-1.5 text-xs font-label flex items-center justify-between text-[#5C665F]">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
        <span className="flex items-center gap-1.5 text-[#152A20] font-bold whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#152A20] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#152A20]"></span>
          </span>
          IRIDIUM MESH LIVE
        </span>
        <span className="hidden sm:inline text-[#C4BCAC]">|</span>
        <span className="flex items-center gap-1 text-[#111D16] whitespace-nowrap">
          <Radio className="w-3.5 h-3.5 text-[#152A20]" />
          DEPOT: <span className="font-bold text-[#152A20]">{selectedStation.name}</span> ({selectedStation.elevation})
        </span>
        <span className="hidden md:inline text-[#C4BCAC]">|</span>
        <span className="hidden md:flex items-center gap-1 text-[#D97845] font-bold whitespace-nowrap">
          <Thermometer className="w-3.5 h-3.5" />
          SUMMIT: {selectedStation.weather.temp}
        </span>
        <span className="hidden lg:flex items-center gap-1 text-[#5C665F] whitespace-nowrap">
          <Wind className="w-3.5 h-3.5 text-[#7A857E]" />
          {selectedStation.weather.wind}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Role Switcher Pill */}
        <div className="flex items-center bg-[#D8D2C5]/80 rounded-xs p-0.5 text-[11px] font-label font-bold">
          <button
            onClick={() => setUserRole('climber')}
            className={`px-2 py-0.5 rounded-xs transition cursor-pointer ${
              userRole === 'climber'
                ? 'bg-[#152A20] text-white shadow-xs'
                : 'text-[#5C665F] hover:text-[#111D16]'
            }`}
          >
            Storefront
          </button>
          <Link
            to="/staff"
            onClick={() => setUserRole('ranger')}
            className="px-2 py-0.5 rounded-xs text-[#5C665F] hover:text-[#111D16] hover:bg-[#EBE6DC] transition"
          >
            Staff POS
          </Link>
          <Link
            to="/admin"
            className="px-2 py-0.5 rounded-xs text-[#5C665F] hover:text-[#111D16] hover:bg-[#EBE6DC] transition"
          >
            Admin HQ
          </Link>
        </div>
      </div>
    </div>
  );
};
