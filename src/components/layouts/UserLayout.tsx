import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { CartDrawer } from '../CartDrawer';
import { ProductDetailModal } from '../ProductDetailModal';
import { useAppStore } from '../../store/useAppStore';
import { GEAR_ITEMS } from '../../data/mockData';

export const UserLayout: React.FC = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  const { 
    isCartOpen, 
    setCartOpen, 
    cartItems, 
    removeCartItem, 
    clearCart,
    selectedGearModal,
    setSelectedGearModal,
    selectedStation,
    outposts,
    addToCart
  } = useAppStore();

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111D16] flex flex-col selection:bg-[#152A20] selection:text-[#F3EFE6] font-body">
      <Header />

      <main id="main-content" className="flex-1">
        <React.Suspense fallback={<div className="min-h-[60vh] p-8" role="status">Loading page…</div>}>
          <Outlet />
        </React.Suspense>
      </main>

      <Footer />

      {/* Global Product Detail & Rental Builder Modal */}
      {selectedGearModal && (
        <ProductDetailModal
          gear={selectedGearModal}
          allGear={GEAR_ITEMS}
          outposts={outposts}
          selectedStation={selectedStation}
          onClose={() => setSelectedGearModal(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Global Manifest Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
      />
    </div>
  );
};
