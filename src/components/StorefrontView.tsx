import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock,
  Minus,
  Plus,
  Search,
  Zap,
  Check,
} from 'lucide-react';
import {
  CATALOG_ITEMS,
  FLAT_DELIVERY_FEE,
  IMAGES,
  MIDNIGHT_BUNDLE_THRESHOLD,
} from '../data/campusData';
import { AppSection, CartEntry, CatalogItem, CategoryId } from '../types';
import { ResilientImage } from './ResilientImage';

interface StorefrontViewProps {
  cart: CartEntry[];
  onAddToCart: (item: CatalogItem) => void;
  onUpdateQty: (itemId: string, delta: number) => void;
  isMidnightWindow: boolean;
  onToggleMidnightWindow: (val: boolean) => void;
  onNavigate: (section: AppSection) => void;
  showHowItWorksSection?: boolean;
}

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'snacks', label: 'Snacks & Chips' },
  { id: 'beverages', label: 'Drinks & Energy' },
  { id: 'comfort', label: 'Instant Comfort' },
  { id: 'study', label: 'Study Essentials' },
];

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  cart,
  onAddToCart,
  onUpdateQty,
  isMidnightWindow,
  onToggleMidnightWindow,
  onNavigate,
  showHowItWorksSection = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return CATALOG_ITEMS.filter((item) => {
      const matchesCat =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.categoryLabel.toLowerCase().includes(query);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const getCartQuantity = (itemId: string): number => {
    return cart.find((entry) => entry.item.id === itemId)?.quantity ?? 0;
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Section 1: Hero Showcase + 4-Column Service Pillars */}
      <section className="pt-8 sm:pt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Hero Left Column */}
            <div className="lg:col-span-6 flex flex-col justify-between py-2 space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-medium tracking-wide text-amber-400">
                  10:00 PM – 3:00 AM · Direct-to-Dorm & Library Desk
                </p>
                <h1
                  className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-50 leading-[1.08]"
                  style={{ textWrap: 'balance' }}
                >
                  Late-night study fuel, delivered inside campus gates in under 20 minutes.
                </h1>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                  Skip the ₹150+ delivery app fees and unsafe off-campus walks. Student couriers on e-scooters bring snacks, cold drinks, and study essentials straight to your hostel room or library desk for a flat ₹{FLAT_DELIVERY_FEE} fee.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#catalog"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  Order Late-Night Fuel
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => onNavigate('venture')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-200 border border-slate-700 hover:border-slate-500 hover:text-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  View Venture Blueprint
                </button>
              </div>
            </div>

            {/* Hero Right Column */}
            <div className="lg:col-span-6 min-h-[280px] sm:min-h-[340px]">
              <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-[#141820]">
                <ResilientImage
                  src={IMAGES.hero}
                  alt="College student studying late at night at a university library desk with a warm lamp, snack bag, and cold beverage"
                  className="w-full h-full object-cover lg:h-full"
                  fallbackTitle="Late-Night Library Study Fuel"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/85 via-[#0B0E14]/20 to-transparent"
                />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
                  <span>Hostel Cluster A & B · Central Library</span>
                  <span className="font-mono tabular-nums text-amber-300">
                    Flat ₹{FLAT_DELIVERY_FEE} Drop · No Minimum Order
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Service Pillars Strip below Hero */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-800/80 pt-8">
            <div className="p-4 rounded-xl bg-[#131720] border border-slate-800/80">
              <p className="font-mono text-sm font-semibold text-amber-400 tabular-nums">
                Flat ₹{FLAT_DELIVERY_FEE} Fee
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                Zero Small-Order Penalties
              </p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                No surge pricing or ₹150 platform markups on a ₹60 snack basket.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#131720] border border-slate-800/80">
              <p className="font-mono text-sm font-semibold text-amber-400 tabular-nums">
                &lt; 20 Mins
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                Student E-Scooter Couriers
              </p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Campus-native riders with active ID badges navigate footpaths directly.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#131720] border border-slate-800/80">
              <p className="font-mono text-sm font-semibold text-amber-400 tabular-nums">
                Hostel &amp; Library
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                Exact Room or Desk Drop
              </p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Never walk to outer security gates at 1:30 AM to meet a car driver.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#131720] border border-slate-800/80">
              <p className="font-mono text-sm font-semibold text-amber-400 tabular-nums">
                UPI QR &amp; WhatsApp
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                Zero App Download Friction
              </p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Checkout directly via UPI QR scan or formatted WhatsApp order bot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Late-Night Hostel Micro-Stock Catalog */}
      <section id="catalog" className="scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
                Hostel Micro-Stock Menu
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Pre-packaged FMCG snacks, chilled drinks, instant comfort, and study supplies stocked inside Hostel Block A &amp; B.
              </p>
            </div>

            {/* Midnight Fuel Bundle Window Switch */}
            <div className="flex items-center gap-3 self-start lg:self-auto bg-[#131720] border border-slate-800 rounded-lg px-3.5 py-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              <div className="text-xs">
                <span className="text-slate-300 font-medium">Shift Window: </span>
                <span className="font-mono text-amber-300 tabular-nums">
                  {isMidnightWindow ? '11:30 PM (Midnight Fuel Active)' : '10:15 PM (Standard Night)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onToggleMidnightWindow(!isMidnightWindow)}
                className="ml-2 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                {isMidnightWindow ? 'Switch to 10 PM' : 'Simulate 11:30 PM'}
              </button>
            </div>
          </div>

          {/* Midnight Fuel Bundle Notice */}
          {isMidnightWindow && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[#141A24] border border-amber-500/30 text-sm">
              <div className="flex items-center gap-2.5 text-slate-200">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-amber-300">Midnight Fuel Bundle Active (11 PM – 2 AM):</strong>{' '}
                  Orders over ₹{MIDNIGHT_BUNDLE_THRESHOLD} automatically include a free Volt Berry Energy Can.
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400 whitespace-nowrap shrink-0">
                Promo: CAMPUSFIRST (₹50 off)
              </span>
            </div>
          )}

          {/* Filter Tabs + Search Input */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div
              role="tablist"
              aria-label="Product categories"
              className="flex items-center gap-1 p-1 bg-[#131720] border border-slate-800 rounded-lg overflow-x-auto"
            >
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-amber-400 text-[#0B0E14] font-semibold'
                        : 'text-slate-300 hover:text-slate-50 hover:bg-slate-800/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chips, noodles, highlighters..."
                aria-label="Search late-night menu"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#131720] border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* 3-Column Product Grid */}
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-slate-800 bg-[#131720]">
              <p className="text-base font-medium text-slate-200">
                No late-night items match “{searchQuery}”.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-3 px-4 py-2 text-xs font-semibold text-[#0B0E14] bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors"
              >
                Reset Menu Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const qty = getCartQuantity(item.id);
                return (
                  <article
                    key={item.id}
                    className="group flex flex-col justify-between rounded-xl bg-[#141821] border border-slate-800/90 overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-700"
                  >
                    <div>
                      <div className="aspect-[4/3] w-full overflow-hidden bg-[#181C26]">
                        <ResilientImage
                          src={item.image}
                          alt={item.name}
                          objectPosition={item.imagePosition}
                          fallbackTitle={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="p-5 space-y-2">
                        {/* Unboxed clean metadata with typographic separator */}
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                          <span className="uppercase tracking-wider font-medium text-slate-400 truncate">
                            {item.categoryLabel}
                          </span>
                          <span className="font-mono tabular-nums text-slate-500 shrink-0">
                            {item.packSize}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between gap-3 pt-0.5">
                          <h3 className="text-base font-semibold text-slate-50 leading-snug">
                            {item.name}
                          </h3>
                          <span className="font-mono text-base font-semibold text-amber-400 tabular-nums shrink-0">
                            ₹{item.price}
                          </span>
                        </div>

                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 border-t border-slate-800/60 mt-auto">
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        {item.tag ? `${item.tag} · ` : ''}
                        {item.stockCount} in dorm stock
                      </span>

                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => onAddToCart(item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          Add to Bag
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2 bg-[#0B0E14] border border-slate-700 rounded-lg p-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, -1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-200 hover:bg-slate-800 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-xs font-semibold text-amber-400 w-5 text-center tabular-nums">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-200 hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Section 3: How It Works & Why Students Switch */}
      {showHowItWorksSection && (
        <section id="how-it-works" className="scroll-mt-20 border-t border-slate-800/80 pt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
                How Campus Cravings Beats Mainstream Delivery
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
                Traditional cars stop at outer security gates and double the price of a snack. Our campus-native micro-mobility model solves both cost and access.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-2">
                <span className="font-mono text-xs text-amber-400">01. Hostel Micro-Stock</span>
                <h3 className="text-lg font-semibold text-slate-50">
                  Stored Inside Target Dorms
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  High-demand FMCG snacks, drinks, and stationery are sourced wholesale at 20–25% margin and stocked in partner hostel storage cabinets—zero kitchen wait time.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-2">
                <span className="font-mono text-xs text-amber-400">02. Zero-Friction Checkout</span>
                <h3 className="text-lg font-semibold text-slate-50">
                  Direct UPI QR &amp; WhatsApp Bot
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  92% of surveyed students avoid downloading another app for ₹200 purchases. Place orders directly on this web catalog or via WhatsApp with direct UPI QR payment.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-2">
                <span className="font-mono text-xs text-amber-400">03. Sub-20-Min Door Drop</span>
                <h3 className="text-lg font-semibold text-slate-50">
                  Student E-Scooter Dispatch
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Fellow student couriers carrying active campus ID badges ride footpaths on e-scooters and bikes straight through hostel gates to your room or library desk.
                </p>
              </div>
            </div>

            {/* Clean Comparison Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#131720]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-medium text-slate-400">
                    <th className="py-3.5 px-5">Late-Night Option</th>
                    <th className="py-3.5 px-5">Typical Extra Fee / Cost</th>
                    <th className="py-3.5 px-5">Fulfillment Speed</th>
                    <th className="py-3.5 px-5">Drop-Off Access</th>
                    <th className="py-3.5 px-5">Study Supplies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  <tr className="bg-amber-400/[0.04]">
                    <td className="py-3.5 px-5 font-semibold text-amber-300">
                      Campus Cravings
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-slate-100">
                      Flat ₹35 fee
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-slate-100">
                      &lt; 20 mins
                    </td>
                    <td className="py-3.5 px-5 text-slate-200 inline-flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                      Dorm room / Library desk
                    </td>
                    <td className="py-3.5 px-5 text-slate-200">
                      Pens, index cards, highlighters
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-medium text-slate-200">
                      DoorDash / UberEats
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-slate-400">
                      ₹150–₹300+ fees
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-slate-400">
                      35–55 mins
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      Outer campus gate only
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      Rare / high markup
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-medium text-slate-200">
                      Campus Vending Machines
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-slate-400">
                      ₹0 fee (limited stock)
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-slate-400">
                      2–5 mins (if working)
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      Lobby only (often empty)
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      None
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-medium text-slate-200">
                      Off-Campus 24/7 Walk
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-slate-400">
                      ₹0 fee (high time cost)
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-slate-400">
                      30–45 mins round-trip
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      Must leave campus alone
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      Basic only
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
