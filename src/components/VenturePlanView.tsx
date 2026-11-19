import React, { useEffect, useState } from 'react';
import { Check, Cloud, LogIn } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import {
  COMPETITORS,
  FINANCIAL_SCENARIOS,
  GTM_EXPERIMENTS,
  MARKET_SIZING,
  MVP_EXCLUDED_FEATURES,
  TOP_ASSUMPTIONS,
} from '../data/campusData';
import { CompetitorPoint, GtmStatus } from '../types';

type VentureTab = 'economics' | 'battlefield' | 'market' | 'gtm';

const TABS: { id: VentureTab; label: string }[] = [
  { id: 'economics', label: '01. Unit Economics' },
  { id: 'battlefield', label: '02. Competitor Matrix' },
  { id: 'market', label: '03. Market & MVP Scope' },
  { id: 'gtm', label: '04. 30-Day GTM & Risks' },
];

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const VenturePlanView: React.FC = () => {
  const { user, authBusy, venturePlan, signInWithGoogle, saveVenturePlan } =
    useFirebase();

  const [activeTab, setActiveTab] = useState<VentureTab>('economics');

  const [selectedScenarioId, setSelectedScenarioId] = useState<
    'conservative' | 'base' | 'ambitious' | 'custom'
  >('base');
  const [sellingPrice, setSellingPrice] = useState<number>(200);
  const [variableCost, setVariableCost] = useState<number>(140);
  const [customers, setCustomers] = useState<number>(500);
  const [purchasesPerCustomer, setPurchasesPerCustomer] = useState<number>(3);
  const [monthlyFixedCost, setMonthlyFixedCost] = useState<number>(15000);

  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorPoint>(
    COMPETITORS[3]
  );

  const [gtmStatuses, setGtmStatuses] = useState<Record<string, GtmStatus>>({
    'Week 1': 'Validated',
    'Week 2': 'Active',
    'Week 3': 'Planned',
    'Week 4': 'Planned',
  });

  const [savingCloud, setSavingCloud] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Hydrate from Firestore venture_plans/{uid} when loaded
  useEffect(() => {
    if (!venturePlan) return;
    setSelectedScenarioId(venturePlan.selectedScenarioId);
    setSellingPrice(venturePlan.sellingPrice);
    setVariableCost(venturePlan.variableCost);
    setCustomers(venturePlan.customers);
    setPurchasesPerCustomer(venturePlan.purchasesPerCustomer);
    setMonthlyFixedCost(venturePlan.monthlyFixedCost);
    setGtmStatuses(venturePlan.gtmStatuses);
  }, [venturePlan]);

  const applyScenarioPreset = (scenarioId: string) => {
    const preset = FINANCIAL_SCENARIOS.find((s) => s.id === scenarioId);
    if (!preset) return;
    setSelectedScenarioId(preset.id);
    setSellingPrice(preset.sellingPrice);
    setVariableCost(preset.variableCost);
    setCustomers(preset.customers);
    setPurchasesPerCustomer(preset.purchasesPerCustomer);
    setMonthlyFixedCost(preset.monthlyFixedCost);
    setSavedNotice(false);
  };

  const handleSaveToCloud = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    setSavingCloud(true);
    try {
      await saveVenturePlan({
        selectedScenarioId,
        sellingPrice,
        variableCost,
        customers,
        purchasesPerCustomer,
        monthlyFixedCost,
        gtmStatuses,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } finally {
      setSavingCloud(false);
    }
  };

  const contributionPerSale = sellingPrice - variableCost;
  const contributionMarginPct =
    sellingPrice > 0 ? Math.round((contributionPerSale / sellingPrice) * 100) : 0;
  const totalMonthlyTx = customers * purchasesPerCustomer;
  const monthlyRevenue = totalMonthlyTx * sellingPrice;
  const totalVariableCost = totalMonthlyTx * variableCost;
  const operatingSurplus =
    totalMonthlyTx * contributionPerSale - monthlyFixedCost;
  const breakEvenOrders =
    contributionPerSale > 0
      ? Math.ceil(monthlyFixedCost / contributionPerSale)
      : 0;

  const cycleGtmStatus = (week: string) => {
    const order: GtmStatus[] = ['Planned', 'Active', 'Validated'];
    const current = gtmStatuses[week] ?? 'Planned';
    const next = order[(order.indexOf(current) + 1) % order.length];
    setGtmStatuses((prev) => ({ ...prev, [week]: next }));
    setSavedNotice(false);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-amber-400">
            DGU Venture Quest · Entrepreneurship &amp; Innovation · DBS Global University
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
            Campus Cravings — Venture Blueprint &amp; Unit Economics
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Interactive model of Missions 0–12: simulate pricing scenarios, inspect the 2×2 competitor matrix, review TAM/SAM/SOM sizing, and sync your 30-day pilot progress to Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              disabled={savingCloud}
              onClick={() => void handleSaveToCloud()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
            >
              {savedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Saved to Firestore
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
                  {savingCloud ? 'Saving...' : 'Save Blueprint to Cloud'}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-100 bg-[#131720] border border-slate-700 hover:border-amber-400 rounded-lg transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              {authBusy ? 'Signing in...' : 'Sign in with Google to Sync'}
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Venture blueprint sections"
        className="flex items-center gap-1 p-1 bg-[#131720] border border-slate-800 rounded-lg overflow-x-auto"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-amber-400 text-[#0B0E14] font-semibold'
                  : 'text-slate-300 hover:text-slate-50 hover:bg-slate-800/70'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: UNIT ECONOMICS & SCENARIOS */}
      {activeTab === 'economics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FINANCIAL_SCENARIOS.map((sc) => {
              const active = selectedScenarioId === sc.id;
              const tx = sc.customers * sc.purchasesPerCustomer;
              const rev = tx * sc.sellingPrice;
              const surplus =
                tx * (sc.sellingPrice - sc.variableCost) - sc.monthlyFixedCost;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => applyScenarioPreset(sc.id)}
                  className={`text-left p-5 rounded-xl border transition-colors ${
                    active
                      ? 'bg-[#181E2B] border-amber-400'
                      : 'bg-[#131720] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-50">
                      {sc.label}
                    </span>
                    <span className="font-mono text-xs text-amber-400 tabular-nums">
                      {tx.toLocaleString('en-IN')} tx/mo
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{sc.subtitle}</p>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-400">Rev: {formatInr(rev)}</span>
                    <span
                      className={
                        surplus >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400'
                      }
                    >
                      Surplus: {formatInr(surplus)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-50">
                  Interactive Unit Economics Model
                </h2>
                <button
                  type="button"
                  onClick={() => applyScenarioPreset('base')}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Reset to Base Case
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <label htmlFor="sl-price" className="text-slate-300">
                      Average Basket Selling Price
                    </label>
                    <span className="font-mono font-semibold text-amber-400 tabular-nums">
                      ₹{sellingPrice}
                    </span>
                  </div>
                  <input
                    id="sl-price"
                    type="range"
                    min={120}
                    max={350}
                    step={5}
                    value={sellingPrice}
                    onChange={(e) => {
                      setSelectedScenarioId('custom');
                      setSellingPrice(Number(e.target.value));
                      setSavedNotice(false);
                    }}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <label htmlFor="sl-var" className="text-slate-300">
                      Variable Cost (Wholesale FMCG + ₹25 Courier Drop)
                    </label>
                    <span className="font-mono font-semibold text-slate-100 tabular-nums">
                      ₹{variableCost}
                    </span>
                  </div>
                  <input
                    id="sl-var"
                    type="range"
                    min={90}
                    max={250}
                    step={5}
                    value={variableCost}
                    onChange={(e) => {
                      setSelectedScenarioId('custom');
                      setVariableCost(Number(e.target.value));
                      setSavedNotice(false);
                    }}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <label htmlFor="sl-cust" className="text-slate-300">
                      Active Monthly Hostel Customers
                    </label>
                    <span className="font-mono font-semibold text-slate-100 tabular-nums">
                      {customers.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    id="sl-cust"
                    type="range"
                    min={100}
                    max={1500}
                    step={50}
                    value={customers}
                    onChange={(e) => {
                      setSelectedScenarioId('custom');
                      setCustomers(Number(e.target.value));
                      setSavedNotice(false);
                    }}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <label htmlFor="sl-freq" className="text-slate-300">
                      Purchases Per Customer / Month
                    </label>
                    <span className="font-mono font-semibold text-slate-100 tabular-nums">
                      {purchasesPerCustomer}×
                    </span>
                  </div>
                  <input
                    id="sl-freq"
                    type="range"
                    min={1}
                    max={6}
                    step={1}
                    value={purchasesPerCustomer}
                    onChange={(e) => {
                      setSelectedScenarioId('custom');
                      setPurchasesPerCustomer(Number(e.target.value));
                      setSavedNotice(false);
                    }}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <label htmlFor="sl-fixed" className="text-slate-300">
                      Monthly Fixed Platform &amp; Cabinet Cost
                    </label>
                    <span className="font-mono font-semibold text-slate-100 tabular-nums">
                      {formatInr(monthlyFixedCost)}
                    </span>
                  </div>
                  <input
                    id="sl-fixed"
                    type="range"
                    min={5000}
                    max={40000}
                    step={1000}
                    value={monthlyFixedCost}
                    onChange={(e) => {
                      setSelectedScenarioId('custom');
                      setMonthlyFixedCost(Number(e.target.value));
                      setSavedNotice(false);
                    }}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#131720] border border-slate-800">
                  <span className="text-xs text-slate-400">Contribution per Sale</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-amber-400 tabular-nums">
                    {formatInr(contributionPerSale)}
                  </p>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {contributionMarginPct}% gross margin
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-[#131720] border border-slate-800">
                  <span className="text-xs text-slate-400">Monthly Operating Surplus</span>
                  <p
                    className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                      operatingSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatInr(operatingSurplus)}
                  </p>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Break-even: {breakEvenOrders} orders/mo
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-3 text-sm">
                <h3 className="font-semibold text-slate-100 pb-2 border-b border-slate-800">
                  Monthly P&amp;L Statement
                </h3>
                <div className="flex justify-between text-slate-300">
                  <span>Total Monthly Transactions</span>
                  <span className="font-mono tabular-nums">
                    {totalMonthlyTx.toLocaleString('en-IN')} orders
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Gross Monthly Revenue</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-100">
                    {formatInr(monthlyRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Less: Variable COGS &amp; Courier Drops</span>
                  <span className="font-mono tabular-nums">
                    -{formatInr(totalVariableCost)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Less: Monthly Fixed Overhead</span>
                  <span className="font-mono tabular-nums">
                    -{formatInr(monthlyFixedCost)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-800 font-semibold">
                  <span className="text-slate-100">Net Operating Surplus</span>
                  <span
                    className={`font-mono tabular-nums ${
                      operatingSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatInr(operatingSurplus)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#131720] border border-slate-800 text-xs text-slate-400 leading-relaxed space-y-1">
                <p>
                  <strong className="text-slate-200">Cost Evidence:</strong> Wholesale FMCG pricing from local cash-and-carry distributors (D-Mart / Metro) yields a 20–25% product margin, plus ₹25 per-drop student courier wage.
                </p>
                <p>
                  <strong className="text-slate-200">Price Evidence:</strong> Primary campus surveys show ₹150–₹250 late-night snack spending and willingness to pay a flat ₹30–₹40 delivery fee.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPETITOR BATTLEFIELD MATRIX */}
      {activeTab === 'battlefield' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-50">
                  Mission 5 — Competitor Battlefield (Click Any Point)
                </h2>
                <span className="text-xs text-slate-400">
                  Top-Right = High Convenience &amp; Ultra-Affordable
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 520 380"
                  className="w-full h-auto max-w-full bg-[#0B0E14] rounded-lg border border-slate-800"
                  role="img"
                  aria-label="2 by 2 Competitor Battlefield Chart plotting Affordability against Direct-to-Dorm Convenience"
                >
                  <line x1="60" y1="180" x2="490" y2="180" stroke="#1E293B" strokeDasharray="4 4" />
                  <line x1="275" y1="30" x2="275" y2="330" stroke="#1E293B" strokeDasharray="4 4" />

                  <rect
                    x="275"
                    y="30"
                    width="215"
                    height="150"
                    fill="#F59E0B"
                    fillOpacity="0.06"
                  />
                  <text
                    x="482"
                    y="46"
                    textAnchor="end"
                    fill="#FBBF24"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    TARGET QUADRANT
                  </text>

                  <line x1="60" y1="330" x2="490" y2="330" stroke="#475569" strokeWidth="1.5" />
                  <line x1="60" y1="30" x2="60" y2="330" stroke="#475569" strokeWidth="1.5" />

                  <text
                    x="275"
                    y="362"
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="11"
                  >
                    Affordability for Students (1 = High Fees, 10 = Ultra Low-Cost)
                  </text>
                  <text
                    x="20"
                    y="180"
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="11"
                    transform="rotate(-90 20 180)"
                  >
                    Direct-to-Dorm Convenience &amp; Speed (1–10)
                  </text>

                  {COMPETITORS.map((comp) => {
                    const cx = 60 + ((comp.axisX - 1) / 9) * 410;
                    const cy = 330 - ((comp.axisY - 1) / 9) * 280;
                    const isSelected = selectedCompetitor.id === comp.id;

                    return (
                      <g
                        key={comp.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedCompetitor(comp)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 16 : 12}
                          fill={comp.isSelf ? '#F59E0B' : '#334155'}
                          stroke={isSelected ? '#FDE68A' : '#94A3B8'}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />
                        <text
                          x={cx}
                          y={cy + 3.5}
                          textAnchor="middle"
                          fill={comp.isSelf ? '#0B0E14' : '#F8FAFC'}
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {comp.axisX},{comp.axisY}
                        </text>
                        <text
                          x={cx}
                          y={cy - 18}
                          textAnchor="middle"
                          fill={comp.isSelf ? '#FBBF24' : '#E2E8F0'}
                          fontSize="11"
                          fontWeight={comp.isSelf ? 'bold' : 'normal'}
                        >
                          {comp.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono text-amber-400">
                      {selectedCompetitor.type} · Evidence: {selectedCompetitor.evidenceStrength}
                    </span>
                    <h3 className="mt-1 font-display text-xl font-bold text-slate-50">
                      {selectedCompetitor.name}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-slate-300 tabular-nums">
                    X:{selectedCompetitor.axisX} / Y:{selectedCompetitor.axisY}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">
                      Price &amp; Fee Structure
                    </span>
                    <p className="text-slate-200">{selectedCompetitor.priceCost}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">
                      Main Offer
                    </span>
                    <p className="text-slate-300">{selectedCompetitor.mainOffer}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">
                      Main Strength
                    </span>
                    <p className="text-slate-300">{selectedCompetitor.mainStrength}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">
                      Main Weakness
                    </span>
                    <p className="text-slate-300">{selectedCompetitor.mainWeakness}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                    Evidence Source: {selectedCompetitor.evidenceSource}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#141A24] border border-amber-500/30 space-y-2">
                <span className="text-xs font-mono text-amber-400">
                  Mission 6 — Positioning Statement
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  For late-night college students who need quick, budget-friendly food and study fuel, Campus Cravings is a hyper-local campus delivery service that provides sub-20-minute, direct-to-dorm delivery for a flat ₹35 fee—unlike major delivery apps that charge steep extra fees and force you to walk to outer campus gates to pick up your food.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MARKET SIZE & MVP SCOPE */}
      {activeTab === 'market' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MARKET_SIZING.map((m) => (
              <div
                key={m.tier}
                className="p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-amber-400">
                    {m.tier}
                  </span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {m.students}
                  </span>
                </div>
                <p className="font-mono text-2xl font-bold text-slate-50 tabular-nums">
                  {m.shortValue}
                </p>
                <p className="font-mono text-xs text-slate-400 tabular-nums">
                  {m.valueInr} / yr
                </p>
                <h3 className="text-sm font-semibold text-slate-200 pt-1">
                  {m.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {m.evidence}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-4">
              <div>
                <span className="font-mono text-xs text-amber-400">
                  Mission 10 — MVP Discipline
                </span>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  Intentionally Excluded Features (Setup Cost &lt; ₹10,000)
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  92% of surveyed students prefer ordering via WhatsApp or lightweight web catalog rather than downloading a dedicated app.
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-300">
                {MVP_EXCLUDED_FEATURES.map((feat) => (
                  <li
                    key={feat}
                    className="py-2 px-3 rounded-lg bg-[#0B0E14] border border-slate-800/80 text-xs sm:text-sm"
                  >
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-6 p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-4">
              <div>
                <span className="font-mono text-xs text-amber-400">
                  Mission 12 — Go / No-Go Review Gate
                </span>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  14-Day Pilot Validation Benchmarks
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-[#0B0E14] border border-slate-800">
                  <span className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                    300+
                  </span>
                  <p className="mt-1 text-xs font-medium text-slate-200">
                    Completed Orders in 14 Days
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#0B0E14] border border-slate-800">
                  <span className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                    35%+
                  </span>
                  <p className="mt-1 text-xs font-medium text-slate-200">
                    Customer Repeat Order Rate
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#0B0E14] border border-slate-800">
                  <span className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                    &lt; 20 mins
                  </span>
                  <p className="mt-1 text-xs font-medium text-slate-200">
                    Average Fulfillment Time
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#0B0E14] border border-slate-800">
                  <span className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                    &lt; 2% / &lt; 5%
                  </span>
                  <p className="mt-1 text-xs font-medium text-slate-200">
                    Inventory Shrinkage &amp; Stockouts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 30-DAY GTM & RISKY ASSUMPTIONS */}
      {activeTab === 'gtm' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-50">
                Mission 9 — 30-Day Go-To-Market Experiment Roadmap
              </h2>
              <span className="text-xs text-slate-400">
                Click any week status button to update pilot progress (use Save Blueprint to Cloud above)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GTM_EXPERIMENTS.map((exp) => {
                const status = gtmStatuses[exp.week] ?? 'Planned';
                return (
                  <div
                    key={exp.week}
                    className="p-5 rounded-xl bg-[#131720] border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-amber-400">
                        {exp.week} · {exp.responsibility}
                      </span>
                      <button
                        type="button"
                        onClick={() => cycleGtmStatus(exp.week)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                          status === 'Validated'
                            ? 'bg-emerald-950/50 border-emerald-600/50 text-emerald-300'
                            : status === 'Active'
                            ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                            : 'bg-[#0B0E14] border-slate-700 text-slate-400'
                        }`}
                      >
                        {status}
                      </button>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100">
                      {exp.channel}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {exp.action}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                      <p>
                        <strong className="text-slate-300">Target:</strong> {exp.target}
                      </p>
                      <p>
                        <strong className="text-slate-300">Metric:</strong> {exp.metric}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-50">
              Mission 11 — Top 3 Critical Assumptions &amp; Validation Tests
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TOP_ASSUMPTIONS.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl bg-[#131720] border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-amber-400">Assumption 0{idx + 1}</span>
                    <span className="text-slate-400">{item.targetThreshold}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Why It Matters:</strong>{' '}
                    {item.whyItMatters}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Test Protocol:</strong>{' '}
                    {item.howToTest}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
