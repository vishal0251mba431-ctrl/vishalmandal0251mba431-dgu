/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LogIn, LogOut, X } from 'lucide-react';
import { CartDrawer } from './components/CartDrawer';
import { Header } from './components/Header';
import { OrderTrackerView } from './components/OrderTrackerView';
import { StorefrontView } from './components/StorefrontView';
import { VenturePlanView } from './components/VenturePlanView';
import { useFirebase } from './context/FirebaseContext';
import { CATALOG_ITEMS } from './data/campusData';
import { AppSection, CartEntry, CatalogItem } from './types';

export default function App() {
  const {
    user,
    authReady,
    authBusy,
    authError,
    signInWithGoogle,
    signOutUser,
  } = useFirebase();

  const [activeSection, setActiveSection] = useState<AppSection>('menu');
  const [showPromoBanner, setShowPromoBanner] = useState<boolean>(true);
  const [isMidnightWindow, setIsMidnightWindow] = useState<boolean>(true);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);

  const bagCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const bagSubtotal = cart.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  const handleNavigate = (section: AppSection) => {
    if (section === 'how-it-works') {
      setActiveSection('menu');
      setTimeout(() => {
        document.getElementById('how-it-works')?.scrollIntoView({
          behavior: 'smooth',
        });
      }, 60);
      return;
    }
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (item: CatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((e) => e.item.id === item.id);
      if (existing) {
        return prev.map((e) =>
          e.item.id === item.id ? { ...e, quantity: e.quantity + 1 } : e
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((entry) =>
          entry.item.id === itemId
            ? { ...entry, quantity: entry.quantity + delta }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((entry) => entry.item.id !== itemId));
  };

  const handleOrderPlaced = () => {
    setCart([]);
    setIsBagOpen(false);
    setActiveSection('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAddBundle = () => {
    setCart([
      { item: CATALOG_ITEMS[0], quantity: 1 },
      { item: CATALOG_ITEMS[6], quantity: 2 },
      { item: CATALOG_ITEMS[10], quantity: 1 },
    ]);
    setIsBagOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-slate-100">
      {/* Slim Utility & Promo Strip (<= 40px, non-sticky) */}
      <div className="bg-[#141A24] border-b border-slate-800 px-4 h-9 flex items-center text-xs text-slate-300">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
          {showPromoBanner ? (
            <div className="flex items-center gap-2 min-w-0">
              <p className="truncate">
                <span className="font-mono font-semibold text-amber-400">CAMPUSFIRST</span>
                {' '}for ₹50 off first order · Free energy drink over ₹200 (11 PM–2 AM)
              </p>
              <button
                type="button"
                onClick={handleQuickAddBundle}
                className="hidden md:inline text-amber-400 hover:underline font-medium whitespace-nowrap shrink-0"
              >
                Load Exam Bundle
              </button>
              <button
                type="button"
                onClick={() => setShowPromoBanner(false)}
                aria-label="Dismiss promotional banner"
                className="p-0.5 text-slate-500 hover:text-slate-200 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-slate-400 truncate">
              Operating 10:00 PM – 3:00 AM · Hostel Cluster A &amp; B
            </span>
          )}

          {/* Google Sign-In Account Control */}
          <div className="flex items-center gap-3 shrink-0">
            {!authReady ? (
              <span className="text-slate-500 font-mono">Checking session...</span>
            ) : user ? (
              <div className="flex items-center gap-2.5">
                <span className="hidden sm:inline text-slate-300 truncate max-w-[180px]">
                  {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void signOutUser()}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-100 transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-1.5 font-medium text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                {authBusy ? 'Signing in...' : 'Sign in with Google'}
              </button>
            )}
          </div>
        </div>
      </div>

      {authError && (
        <div
          role="alert"
          className="bg-rose-950/50 border-b border-rose-800/60 px-4 py-2 text-xs text-rose-200 text-center"
        >
          Google Sign-In error: {authError}
        </div>
      )}

      {/* 3-Zone Top Bar Header */}
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        bagCount={bagCount}
        bagTotal={bagSubtotal}
        onOpenBag={() => setIsBagOpen(true)}
      />

      {/* Primary View Router */}
      <main className="flex-1">
        {activeSection === 'menu' && (
          <StorefrontView
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQty={handleUpdateQty}
            isMidnightWindow={isMidnightWindow}
            onToggleMidnightWindow={setIsMidnightWindow}
            onNavigate={handleNavigate}
          />
        )}

        {activeSection === 'track' && (
          <OrderTrackerView onNavigate={handleNavigate} />
        )}

        {activeSection === 'venture' && <VenturePlanView />}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold text-slate-200">
              Campus Cravings
            </p>
            <p>
              Operating 10:00 PM – 3:00 AM · Hostel Cluster A &amp; B · Central Library
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => handleNavigate('menu')}
              className="hover:text-slate-100 transition-colors"
            >
              Late-Night Menu
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('track')}
              className="hover:text-slate-100 transition-colors"
            >
              Track Delivery
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('venture')}
              className="hover:text-slate-100 transition-colors"
            >
              DGU Venture Plan
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-Over Bag & Direct UPI / WhatsApp Checkout Drawer */}
      <CartDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        isMidnightWindow={isMidnightWindow}
        onOrderPlaced={handleOrderPlaced}
      />
    </div>
  );
}
