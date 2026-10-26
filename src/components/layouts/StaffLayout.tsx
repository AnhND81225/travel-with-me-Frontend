import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Mountain, 
  PlusCircle, 
  LayoutDashboard, 
  ShoppingBag, 
  ShieldCheck, 
  Calendar, 
  Package, 
  Headphones, 
  ArrowLeft, 
  Bell, 
  Search, 
  MapPin, 
  User,
  ChevronDown
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { ForceChangePasswordModal } from '../auth/ForceChangePasswordModal';
import { doesAccountRequirePasswordChange } from '../../utils/firstLoginUtils';
import { OutpostService } from '../../services/outpostService';
import { catalogApi } from '../../features/equipment/catalogApi';

export const StaffLayout: React.FC = () => {
  const location = useLocation();
  const { selectedStation, setSelectedStation, outposts, setOutposts, setUserRole } = useAppStore();
  const { account, logout } = useAuth();
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  const requiresPasswordChange = account?.email ? doesAccountRequirePasswordChange(account.email) : false;

  // Load outposts from backend if not already loaded
  React.useEffect(() => {
    if (outposts.length === 0) {
      OutpostService.getOutposts().then((res) => {
        if (res.data && res.data.length > 0) {
          setOutposts(res.data);
        }
      });
    }
  }, [outposts.length, setOutposts]);

  // If logged-in user is STAFF, detect and auto-select their assigned branch
  React.useEffect(() => {
    if (account?.role === 'STAFF' && account.id) {
      catalogApi<Array<{ userId: number; branchId: number; branchName: string }>>('/staff')
        .then((staffList) => {
          if (!Array.isArray(staffList)) return;
          const myStaff = staffList.find((s) => s.userId === account.id);
          if (myStaff && myStaff.branchId) {
            const matched = outposts.find((o) => o.id === `branch-${myStaff.branchId}`);
            if (matched) {
              setSelectedStation(matched);
            }
          }
        })
        .catch(() => {});
    }
  }, [account, outposts, setSelectedStation]);

  const staffNav = [
    { path: '/staff', label: 'Staff Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/staff/orders', label: 'Branch Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { path: '/staff/rentals', label: 'Rental Operations', icon: <ShieldCheck className="w-4 h-4" /> },
    { path: '/staff/schedules', label: 'Schedules & Participants', icon: <Calendar className="w-4 h-4" /> },
    { path: '/staff/schedule-payment-reviews', label: 'Tour Payment Reviews', icon: <Calendar className="w-4 h-4" /> },
    { path: '/staff/inventory', label: 'Branch Inventory', icon: <Package className="w-4 h-4" /> },
    { path: '/staff/support', label: 'Customer Service', icon: <Headphones className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111D16] flex flex-col md:flex-row font-body">
      {/* Dark Forest Green Sidebar (~240px) */}
      <aside className="w-full md:w-60 lg:w-64 bg-[#152A20] text-[#F3EFE6] flex flex-col shrink-0 border-r border-[#1F3D2B] font-label">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1F3D2B] flex items-center justify-between">
          <Link to="/staff" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#D97845] flex items-center justify-center text-white">
              <Mountain className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-white font-headline block">TERRAPEAK</span>
              <span className="text-[10px] text-[#D97845] tracking-widest font-bold block uppercase">STAFF OPERATIONS</span>
            </div>
          </Link>
        </div>

        {/* Prominent New POS Order Action Button */}
        <div className="p-4 border-b border-[#1F3D2B]">
          <Link
            to="/staff/pos"
            className="w-full py-2.5 px-3 rounded-xs bg-[#D97845] hover:bg-[#C66735] text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New POS Order</span>
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-3 space-y-1 flex-1">
          {staffNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xs text-xs font-bold uppercase tracking-wide transition ${
                  isActive
                    ? 'bg-[#1F3D2B] text-white border-l-2 border-[#D97845]'
                    : 'text-[#ADCBBB] hover:text-white hover:bg-[#1E3A2D]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Return to Storefront & Admin link */}
        <div className="p-4 border-t border-[#1F3D2B] space-y-2 text-xs">
          <Link
            to="/"
            onClick={() => setUserRole('climber')}
            className="flex items-center gap-2 text-[#ADCBBB] hover:text-white transition font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </Link>
          {account?.role === 'ADMIN' && <Link
            to="/admin"
            className="flex items-center gap-2 text-[#D97845] hover:underline font-bold text-[11px]"
          >
            <span>Switch to Admin Console</span>
          </Link>}
        </div>
      </aside>

      {/* Main Staff Container with Top Bar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar: Current Branch, Search, Notifications, Staff Profile */}
        <header className="h-16 bg-[#EBE6DC] border-b border-[#D8D2C5] px-4 sm:px-8 flex items-center justify-between gap-4 font-label">
          <div className="flex items-center gap-4">
            {/* Branch Selector */}
            <div className="relative">
              <button
                onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] text-xs text-[#152A20] font-bold"
              >
                <MapPin className="w-3.5 h-3.5 text-[#152A20]" />
                <span>BRANCH: {selectedStation.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5C665F]" />
              </button>

              {stationDropdownOpen && (
                <div className="absolute left-0 mt-1 w-64 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] shadow-xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] text-[#7A857E] font-bold uppercase border-b border-[#EBE6DC]">
                    SWITCH BRANCH CONSOLE:
                  </div>
                  {outposts.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => {
                        setSelectedStation(station);
                        setStationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#EBE6DC] ${
                        station.id === selectedStation.id ? 'bg-[#EBE6DC] text-[#152A20] font-bold' : 'text-[#4A524C]'
                      }`}
                    >
                      <span>{station.name}</span>
                      <span className="text-[10px] text-[#7A857E]">{station.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-xs text-[#5C665F] hidden md:inline">
              Elevation: <strong className="text-[#152A20]">{selectedStation.elevation}</strong> • Temp: {selectedStation.weather.temp}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative p-2 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] text-[#152A20] cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D97845] rounded-full"></span>
            </div>

            {/* Staff Profile Badge */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#D8D2C5]">
              <div className="w-7 h-7 rounded-xs bg-[#152A20] flex items-center justify-center text-white font-bold text-xs uppercase">
                {account?.fullName ? account.fullName.trim().charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-bold text-[#152A20] leading-none">
                  {account?.fullName || 'Cán bộ trạm'}
                </div>
                <div className="text-[10px] text-[#7A857E] mt-0.5">
                  {account?.role === 'GUIDE' ? 'Hướng dẫn viên (Guide)' : 'Cán bộ chi nhánh (Staff)'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto animate-fade-in" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      {requiresPasswordChange && account?.email && (
        <ForceChangePasswordModal
          isOpen={true}
          userEmail={account.email}
          onCancel={logout}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};
