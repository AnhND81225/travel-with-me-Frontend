import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Mountain, 
  MapPin, 
  ShoppingBag, 
  User, 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  ShieldCheck, 
  Radio, 
  Compass, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { CartDrawer } from '../CartDrawer';
import { ProductDetailModal } from '../ProductDetailModal';
import { GEAR_ITEMS, OUTPOSTS } from '../../data/mockData';

export const StorefrontLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const { 
    selectedStation, 
    setSelectedStation, 
    outposts, 
    cartItems, 
    isCartOpen, 
    setCartOpen, 
    removeCartItem, 
    clearCart,
    selectedGearModal,
    setSelectedGearModal,
    addToCart,
    userRole,
    setUserRole,
    setSearchQuery
  } = useAppStore();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop / Buy Gear' },
    { path: '/rent', label: 'Rent Gear' },
    { path: '/tours', label: 'Tours & Events' },
    { path: '/orders', label: 'My Orders' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchVal);
    if (location.pathname !== '/shop' && location.pathname !== '/rent') {
      navigate('/shop');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111D16] flex flex-col font-body">
      {/* Top Summit Telemetry Strip */}
      <div className="bg-[#EBE6DC] border-b border-[#D8D2C5] px-4 sm:px-8 py-1.5 text-xs font-label flex items-center justify-between text-[#5C665F]">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          <span className="flex items-center gap-1.5 text-[#152A20] font-bold whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#152A20] animate-pulse"></span>
            IRIDIUM MESH ONLINE
          </span>
          <span className="hidden sm:inline text-[#C4BCAC]">|</span>
          <span className="hidden sm:flex items-center gap-1 text-[#152A20] whitespace-nowrap">
            <Radio className="w-3 h-3 text-[#152A20]" />
            ACTIVE OUTPOST: <span className="font-bold">{selectedStation.name}</span> ({selectedStation.elevation})
          </span>
          <span className="hidden md:inline text-[#C4BCAC]">|</span>
          <span className="hidden md:flex items-center gap-1 text-[#D97845] font-bold whitespace-nowrap">
            SUMMIT: {selectedStation.weather.temp}
          </span>
        </div>

        {/* Demo Role Switcher (Compact, secondary) */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#7A857E] uppercase font-bold hidden sm:inline">Role:</span>
          <div className="flex bg-[#D8D2C5]/70 rounded-xs p-0.5 text-[11px] font-label font-bold">
            <button
              onClick={() => setUserRole('climber')}
              className={`px-2 py-0.5 rounded-xs transition ${
                userRole === 'climber' ? 'bg-[#152A20] text-white shadow-xs' : 'text-[#5C665F] hover:text-[#152A20]'
              }`}
            >
              Customer
            </button>
            <Link
              to="/staff"
              onClick={() => setUserRole('ranger')}
              className="px-2 py-0.5 rounded-xs text-[#5C665F] hover:text-[#152A20] hover:bg-[#EBE6DC] transition"
            >
              Staff POS
            </Link>
            <Link
              to="/admin"
              className="px-2 py-0.5 rounded-xs text-[#5C665F] hover:text-[#152A20] hover:bg-[#EBE6DC] transition"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Storefront Horizontal Header */}
      <header className="sticky top-0 z-40 bg-[#F3EFE6]/98 backdrop-blur-md border-b border-[#D8D2C5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand Wordmark */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
              <div className="w-9 h-9 rounded-xs bg-[#152A20] flex items-center justify-center text-[#F3EFE6] shadow-xs">
                <Mountain className="w-5 h-5 text-[#F3EFE6]" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-wider text-[#152A20] font-headline block leading-none">
                  TERRAPEAK
                </span>
                <span className="text-[10px] font-label font-bold tracking-widest text-[#5C665F] uppercase block mt-0.5">
                  OUTPOST • VIETNAM
                </span>
              </div>
            </Link>

            {/* Branch Selector Dropdown */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] text-xs font-label text-[#152A20] hover:border-[#152A20] transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#152A20]" />
                <span className="font-bold">{selectedStation.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5C665F]" />
              </button>

              {branchDropdownOpen && (
                <div className="absolute left-0 mt-1 w-64 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] shadow-xl py-1 z-50 font-label">
                  <div className="px-3 py-1.5 text-[10px] text-[#7A857E] font-bold uppercase tracking-wider border-b border-[#EBE6DC]">
                    SELECT DEPOT BRANCH:
                  </div>
                  {outposts.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => {
                        setSelectedStation(station);
                        setBranchDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#EBE6DC] transition cursor-pointer ${
                        station.id === selectedStation.id ? 'bg-[#EBE6DC] font-bold text-[#152A20]' : 'text-[#4A524C]'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{station.name}</div>
                        <div className="text-[10px] text-[#7A857E]">{station.region} • {station.code}</div>
                      </div>
                      {station.id === selectedStation.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#152A20]"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-xs text-xs font-label font-bold tracking-wide uppercase transition ${
                    isActive
                      ? 'text-[#152A20] border-b-2 border-[#152A20]'
                      : 'text-[#5C665F] hover:text-[#152A20]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Search, Cart, Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input (desktop) */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-44 lg:w-56">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search gear..."
                className="w-full bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs pl-8 pr-3 py-1.5 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] font-body"
              />
              <Search className="w-3.5 h-3.5 text-[#5C665F] absolute left-2.5 top-2.5 pointer-events-none" />
            </form>

            {/* Cart Trigger */}
            <Link
              to="/cart"
              className="relative px-3 py-2 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-[#F3EFE6] transition flex items-center gap-1.5 font-label text-xs font-bold"
              title="Cart & Manifest"
            >
              <ShoppingBag className="w-4 h-4 text-[#F3EFE6]" />
              <span className="hidden sm:inline">CART</span>
              {cartItems.length > 0 && (
                <span className="bg-[#D97845] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-xs">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* Account Link */}
            <Link
              to="/passport"
              className="p-2 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] hover:border-[#152A20] text-[#152A20] transition cursor-pointer"
              title="Customer Account & Dossier"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xs bg-[#EBE6DC] border border-[#D8D2C5] text-[#152A20]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#EBE6DC] border-b border-[#D8D2C5] px-4 py-4 space-y-3 font-label">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-bold uppercase text-[#152A20] hover:bg-[#F3EFE6] rounded-xs"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-[#D8D2C5]">
              <label className="text-[10px] text-[#7A857E] font-bold block mb-1 uppercase">Select Station Branch:</label>
              <select
                value={selectedStation.id}
                onChange={(e) => {
                  const found = outposts.find((s) => s.id === e.target.value);
                  if (found) setSelectedStation(found);
                }}
                className="w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-2 text-xs font-bold text-[#152A20]"
              >
                {outposts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Dark Forest Green Storefront Footer */}
      <footer className="bg-[#152A20] text-[#F3EFE6] border-t border-[#1F3D2B] py-14 font-label">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Brand & Mission */}
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xs bg-[#D97845] flex items-center justify-center text-white">
                  <Mountain className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-wider font-headline text-white">TERRAPEAK OUTPOST</span>
              </div>
              <p className="text-xs text-[#ADCBBB] font-body leading-relaxed max-w-sm">
                Alpine-grade field equipment acquisition, technical rentals, and guided wilderness expeditions across Vietnam. 
                Deploying four-season shelters, Gore-Tex Pro shells, and satellite telemetry from five branch depots.
              </p>
              <div className="text-[11px] text-[#ADCBBB] font-mono-spec">
                IRIDIUM EMERGENCY FREQ: 406.037 MHz • RESCUE LINK ACTIVE
              </div>
            </div>

            {/* Branch Locations */}
            <div className="md:col-span-3 space-y-2 text-xs">
              <div className="text-xs font-bold text-[#D97845] uppercase tracking-wider">BRANCH DEPOTS</div>
              <ul className="space-y-1.5 text-[#ADCBBB]">
                <li><span className="text-white font-bold">Sapa Ridge Outpost</span> (Elev 1,604M)</li>
                <li><span className="text-white font-bold">Da Lat Highland Depot</span> (Elev 1,500M)</li>
                <li><span className="text-white font-bold">Da Nang Coastal Pass</span> (Elev 450M)</li>
                <li><span className="text-white font-bold">Ho Chi Minh Flagship</span> (District 1)</li>
                <li><span className="text-white font-bold">Hanoi Central Armoury</span> (Hoan Kiem)</li>
              </ul>
            </div>

            {/* Policies & Expeditions */}
            <div className="md:col-span-2 space-y-2 text-xs">
              <div className="text-xs font-bold text-[#D97845] uppercase tracking-wider">POLICIES & AUDIT</div>
              <ul className="space-y-1.5 text-[#ADCBBB]">
                <li><Link to="/waiver" className="hover:text-white transition">Master Custody Waiver</Link></li>
                <li><Link to="/safety" className="hover:text-white transition">Safety Protocols</Link></li>
                <li><Link to="/rent" className="hover:text-white transition">Rental Guarantee</Link></li>
                <li><Link to="/tours" className="hover:text-white transition">Tour Regulations</Link></li>
                <li><Link to="/staff" className="text-[#D97845] hover:underline font-bold">Staff Operations</Link></li>
              </ul>
            </div>

            {/* Dispatch / Newsletter Subscription */}
            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-bold text-[#D97845] uppercase tracking-wider">FIELD DISPATCH SUBSCRIPTION</div>
              <p className="text-xs text-[#ADCBBB] font-body">
                Receive regional meteorological summit reports, avalanche forecasts, and priority expedition departure slots.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed to TerraPeak Field Dispatch.'); }} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="alpinist@domain.com"
                  className="bg-[#1F3D2B] border border-[#2B4E3C] rounded-xs px-3 py-2 text-xs text-white placeholder-[#7A857E] focus:outline-none focus:border-[#D97845] flex-1 font-body"
                />
                <button
                  type="submit"
                  className="bg-[#D97845] hover:bg-[#C66735] text-white px-3 py-2 rounded-xs font-label text-xs font-bold uppercase transition"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          <div className="pt-6 border-t border-[#1F3D2B] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7A857E]">
            <div>© 2026 TerraPeak Operations Co., Ltd. All rights reserved. ISO 9001:2015 Alpine Rigging Certified.</div>
            <div className="flex gap-4">
              <Link to="/waiver" className="hover:text-white">Terms of Custody</Link>
              <Link to="/safety" className="hover:text-white">Emergency Protocols</Link>
              <Link to="/admin" className="text-[#D97845] hover:underline">Admin Console</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Product Detail & Rental Builder Modal */}
      {selectedGearModal && (
        <ProductDetailModal
          gear={selectedGearModal}
          allGear={GEAR_ITEMS}
          outposts={OUTPOSTS}
          selectedStation={selectedStation}
          onClose={() => setSelectedGearModal(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Global Manifest Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        outposts={OUTPOSTS}
        onRemoveItem={removeCartItem}
        onClearCart={clearCart}
      />
    </div>
  );
};
