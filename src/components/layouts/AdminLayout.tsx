import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Mountain, 
  LayoutDashboard, 
  Package, 
  Layers, 
  MapPin, 
  BarChart3, 
  Users, 
  ArrowLeft, 
  Sparkles, 
  Bell, 
  Search, 
  Globe
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { setUserRole } = useAppStore();

  const adminNav = [
    { path: '/admin/orders', label: 'Equipment Orders', icon: <Package className="w-4 h-4" /> },
    { path: '/admin', label: 'Executive Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/admin/inventory', label: 'Multi-Branch Inventory', icon: <Package className="w-4 h-4" /> },
    { path: '/admin/catalog', label: 'Products & Catalog', icon: <Layers className="w-4 h-4" /> },
    { path: '/admin/fleet', label: 'Fleet & Serial Ledger', icon: <Package className="w-4 h-4" /> },
    { path: '/admin/sanitize', label: 'UV Sanitization Lab', icon: <Sparkles className="w-4 h-4" /> },
    { path: '/admin/transfers', label: 'Shuttle Logistics', icon: <MapPin className="w-4 h-4" /> },
    { path: '/admin/branches', label: 'Branch Network', icon: <MapPin className="w-4 h-4" /> },
    { path: '/admin/reports', label: 'BI & Financial Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { path: '/admin/staff', label: 'Staff Management', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111D16] flex flex-col md:flex-row font-body">
      {/* Dark Green Admin Console Sidebar (240px) */}
      <aside className="w-full md:w-60 lg:w-64 bg-[#111D16] text-[#F3EFE6] flex flex-col shrink-0 border-r border-[#1F3D2B] font-label">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1F3D2B] flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#152A20] border border-[#2B4E3C] flex items-center justify-center text-[#D97845]">
              <Mountain className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-white font-headline block">TERRAPEAK</span>
              <span className="text-[10px] text-[#ADCBBB] tracking-widest font-bold block uppercase">ADMIN CONSOLE</span>
            </div>
          </Link>
        </div>

        {/* System Status Tag */}
        <div className="px-4 py-2.5 bg-[#152A20] border-b border-[#1F3D2B] flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            SYSTEM-WIDE SCOPE
          </span>
          <span className="text-[#ADCBBB] text-[10px]">5 DEPOTS</span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-3 space-y-1 flex-1">
          {adminNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xs text-xs font-bold uppercase tracking-wide transition ${
                  isActive
                    ? 'bg-[#152A20] text-white border-l-2 border-[#D97845]'
                    : 'text-[#ADCBBB] hover:text-white hover:bg-[#1E3A2D]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Switch to Storefront / Staff Portal */}
        <div className="p-4 border-t border-[#1F3D2B] space-y-2 text-xs">
          <Link
            to="/staff"
            className="flex items-center gap-2 text-[#D97845] hover:underline font-bold"
          >
            <span>Open Staff POS & Operations</span>
          </Link>
          <Link
            to="/"
            onClick={() => setUserRole('climber')}
            className="flex items-center gap-2 text-[#ADCBBB] hover:text-white transition font-bold text-[11px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#EBE6DC] border-b border-[#D8D2C5] px-4 sm:px-8 flex items-center justify-between gap-4 font-label">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#152A20] uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#152A20]" />
              NATIONAL OPERATIONS HEADQUARTERS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block text-xs">
              <div className="font-bold text-[#152A20] leading-none">Admin Authority</div>
              <div className="text-[10px] text-[#7A857E] mt-0.5">Executive Level 4</div>
            </div>
            <div className="w-8 h-8 rounded-xs bg-[#111D16] text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
