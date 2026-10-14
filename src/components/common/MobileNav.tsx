import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Tent, Mountain, ShieldCheck, ShoppingBag, UserCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const { cartItems, setCartOpen } = useAppStore();

  const navItems = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { path: '/shop', label: 'Shop', icon: <Package className="w-4 h-4" /> },
    { path: '/rent', label: 'Rent', icon: <Tent className="w-4 h-4" /> },
    { path: '/expeditions', label: 'Tours', icon: <Mountain className="w-4 h-4" /> },
    { path: '/custody', label: 'Custody', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-30 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-[#F8F6F1]/95 backdrop-blur-md border border-[#D8D2C5] rounded-xs p-1 shadow-lg flex items-center justify-around pointer-events-auto font-label">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`p-2 rounded-xs transition flex flex-col items-center gap-0.5 cursor-pointer ${
                isActive
                  ? 'bg-[#152A20] text-white'
                  : 'text-[#5C665F] hover:text-[#111D16]'
              }`}
              title={item.label}
            >
              {item.icon}
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}

        {/* Quick Cart Trigger */}
        <button
          onClick={() => setCartOpen(true)}
          className="p-2 rounded-xs text-[#5C665F] hover:text-[#111D16] flex flex-col items-center gap-0.5 relative cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Cart</span>
          {cartItems.length > 0 && (
            <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-[#D97845] text-white text-[8px] font-bold flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
