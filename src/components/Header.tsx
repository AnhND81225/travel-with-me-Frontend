import React, { useState } from 'react';
import { 
  Mountain, 
  Compass, 
  ShieldCheck, 
  MapPin, 
  Layers, 
  UserCheck, 
  ShoppingBag, 
  Menu, 
  X, 
  Wind, 
  Thermometer, 
  Radio, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { ScreenId, UserRole, OutpostStation } from '../types';

interface HeaderProps {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  selectedStation: OutpostStation;
  setSelectedStation: (station: OutpostStation) => void;
  outposts: OutpostStation[];
  cartCount: number;
  openCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  setCurrentScreen,
  userRole,
  setUserRole,
  selectedStation,
  setSelectedStation,
  outposts,
  cartCount,
  openCart
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);

  const navItems: { id: ScreenId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'catalog', label: 'Field Catalog', icon: <Compass className="w-4 h-4" /> },
    { id: 'expeditions', label: 'Expeditions', icon: <Mountain className="w-4 h-4" />, badge: '3 Active' },
    { id: 'custody', label: 'Custody & Return', icon: <ShieldCheck className="w-4 h-4" />, badge: 'Active' },
    { id: 'outposts', label: 'Outpost Network', icon: <MapPin className="w-4 h-4" /> },
    { id: 'fleet', label: 'Fleet Ledger', icon: <Layers className="w-4 h-4" /> },
    { id: 'passport', label: 'Climber ID', icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F3EFE6]/95 backdrop-blur-md border-b border-[#D8D2C5] text-[#152A20]">
      {/* Top Summit Telemetry Bar */}
      <div className="bg-[#E7E2D8] border-b border-[#D8D2C5] px-4 py-1.5 text-xs font-label flex items-center justify-between text-[#5C665F]">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          <span className="flex items-center gap-1.5 text-[#152A20] font-semibold whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#152A20] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#152A20]"></span>
            </span>
            IRIDIUM MESH LIVE
          </span>
          <span className="hidden sm:inline text-[#B5AEA1]">|</span>
          <span className="flex items-center gap-1 text-[#152A20] whitespace-nowrap">
            <Radio className="w-3 h-3 text-[#152A20]" />
            STATION: <span className="font-bold text-[#152A20]">{selectedStation.name}</span> ({selectedStation.elevation})
          </span>
          <span className="hidden md:inline text-[#B5AEA1]">|</span>
          <span className="hidden md:flex items-center gap-1 text-[#D97845] font-semibold whitespace-nowrap">
            <Thermometer className="w-3 h-3" />
            SUMMIT: {selectedStation.weather.temp}
          </span>
          <span className="hidden lg:flex items-center gap-1 text-[#5C665F] whitespace-nowrap">
            <Wind className="w-3 h-3 text-[#879089]" />
            {selectedStation.weather.wind}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Switcher Pill */}
          <div className="flex items-center bg-[#DDD7CB] border border-[#CCC6B9] rounded-lg p-0.5 text-[11px] font-label">
            <button
              onClick={() => setUserRole('climber')}
              className={`px-2.5 py-0.5 rounded-md transition-colors ${
                userRole === 'climber'
                  ? 'bg-[#152A20] text-white font-medium shadow-sm'
                  : 'text-[#5C665F] hover:text-[#152A20]'
              }`}
            >
              Climber
            </button>
            <button
              onClick={() => setUserRole('ranger')}
              className={`px-2.5 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                userRole === 'ranger'
                  ? 'bg-[#D97845] text-white font-medium shadow-sm'
                  : 'text-[#5C665F] hover:text-[#152A20]'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Ranger Staff
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentScreen('catalog')}
            className="flex items-center gap-3 group text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#152A20] flex items-center justify-center text-[#F3EFE6] group-hover:scale-105 transition-transform shadow-sm">
              <Mountain className="w-5 h-5 text-[#F3EFE6]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-wider text-base sm:text-lg text-[#152A20] font-headline">TERRAPEAK</span>
                <span className="text-[10px] tracking-widest px-1.5 py-0.2 rounded bg-[#E4DFC2] text-[#152A20] font-bold font-label border border-[#CCC6B9]">
                  VN
                </span>
              </div>
              <p className="text-[10px] text-[#636C65] tracking-wider font-label font-medium">ALPINE EXPEDITION & RENTALS</p>
            </div>
          </button>

          {/* Station Selector Dropdown (Desktop) */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-xs font-label text-[#152A20] hover:bg-[#E2DDD1] transition cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#152A20]" />
              <span className="font-medium">{selectedStation.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#737C75]" />
            </button>

            {stationDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 rounded-xl bg-[#F3EFE6] border border-[#D8D2C5] shadow-xl py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] font-label text-[#636C65] border-b border-[#E5E0D5]">
                  SELECT BASECAMP OUTPOST:
                </div>
                {outposts.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => {
                      setSelectedStation(station);
                      setStationDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#EBE6DC] transition cursor-pointer font-label ${
                      station.id === selectedStation.id ? 'bg-[#E5E0D5] text-[#152A20] font-bold' : 'text-[#4A524C]'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-[#152A20]">{station.name}</div>
                      <div className="text-[10px] text-[#737C75]">{station.elevation} • {station.code}</div>
                    </div>
                    {station.id === selectedStation.id && (
                      <span className="w-2 h-2 rounded-full bg-[#152A20]"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center space-x-1.5">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-label font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#152A20] text-white shadow-sm'
                    : 'text-[#4A524C] hover:text-[#152A20] hover:bg-[#EBE6DC]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-label font-bold ${
                    isActive ? 'bg-[#D97845] text-white' : 'bg-[#E2DDD1] text-[#152A20]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Cart / Manifest Trigger */}
          <button
            onClick={openCart}
            className="relative px-3.5 py-2 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] hover:bg-[#E2DDD1] text-[#152A20] transition group flex items-center gap-2 cursor-pointer"
            title="Rental Manifest"
          >
            <ShoppingBag className="w-4 h-4 text-[#152A20]" />
            <span className="hidden sm:inline text-xs font-label font-bold">MANIFEST</span>
            {cartCount > 0 && (
              <span className="bg-[#D97845] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow font-label">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile menu toggle button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#EBE6DC] border border-[#D8D2C5] text-[#152A20]"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F3EFE6] border-b border-[#D8D2C5] px-4 pt-2 pb-6 space-y-3">
          <div className="text-[11px] font-label text-[#636C65] px-1 uppercase tracking-wider font-semibold">
            Operational Screens:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentScreen(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                    isActive
                      ? 'bg-[#152A20] border-[#152A20] text-white'
                      : 'bg-[#EBE6DC] border-[#D8D2C5] text-[#152A20]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.icon}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-label font-bold ${
                        isActive ? 'bg-[#D97845] text-white' : 'bg-[#DCD6C9] text-[#152A20]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-label font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Station Picker */}
          <div className="pt-2 border-t border-[#D8D2C5]">
            <div className="text-[11px] font-label text-[#636C65] px-1 mb-2 font-semibold">
              ACTIVE OUTPOST LOCATION:
            </div>
            <select
              value={selectedStation.id}
              onChange={(e) => {
                const found = outposts.find((o) => o.id === e.target.value);
                if (found) setSelectedStation(found);
              }}
              className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xl px-3 py-2 text-xs text-[#152A20] font-label font-medium"
            >
              {outposts.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} ({station.elevation})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
