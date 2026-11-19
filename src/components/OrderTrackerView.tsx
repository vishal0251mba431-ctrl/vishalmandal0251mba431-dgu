import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  LogIn,
  ShieldCheck,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { CATALOG_ITEMS, FLAT_DELIVERY_FEE } from '../data/campusData';
import { AppSection, OrderStage } from '../types';

interface OrderTrackerViewProps {
  onNavigate: (section: AppSection) => void;
}

const STAGES: { title: string; detail: string }[] = [
  {
    title: 'Order Logged at Hostel Micro-Cabinet',
    detail: 'Partner student inventory lead packed your sealed items in Hostel Block A.',
  },
  {
    title: 'Picked Up by Student Courier',
    detail: 'Rider equipped with active campus ID badge departed via campus footpath on e-scooter.',
  },
  {
    title: 'Cleared Hostel Security Gate',
    detail: 'Bypassed outer vehicle restriction; heading up directly to your wing/desk.',
  },
  {
    title: 'Delivered to Dorm Door / Library Desk',
    detail: 'Zero-contact drop completed inside the sub-20-minute SLA target.',
  },
];

export const OrderTrackerView: React.FC<OrderTrackerViewProps> = ({
  onNavigate,
}) => {
  const {
    user,
    authReady,
    authBusy,
    userProfile,
    orders,
    ordersLoading,
    signInWithGoogle,
    createOrder,
    advanceOrderStage,
    submitSurvey,
  } = useFirebase();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const activeOrder =
    orders.find((o) => o.orderId === selectedOrderId) ?? orders[0] ?? null;

  const [secondsLeft, setSecondsLeft] = useState<number>(
    activeOrder?.etaSeconds ?? 18 * 60
  );
  const [advancing, setAdvancing] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);

  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [requestedItem, setRequestedItem] = useState('');
  const [submittingSurvey, setSubmittingSurvey] = useState(false);
  const [surveyJustSubmitted, setSurveyJustSubmitted] = useState(false);

  useEffect(() => {
    if (!activeOrder) return;
    setSecondsLeft(activeOrder.etaSeconds);
  }, [activeOrder?.orderId, activeOrder?.etaSeconds]);

  useEffect(() => {
    if (!activeOrder || activeOrder.stage === 3) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeOrder?.orderId, activeOrder?.stage]);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCreateSampleOrder = async () => {
    if (creatingDemo) return;
    setCreatingDemo(true);
    try {
      const created = await createOrder({
        customerName: user?.displayName || 'Aarav Sharma',
        whatsapp: userProfile?.defaultWhatsapp || '+91 98765 43210',
        location:
          userProfile?.defaultLocation || 'Central Library — Quiet Study Floor 2',
        roomOrDesk: userProfile?.defaultRoomOrDesk || 'Desk B-14',
        items: [
          {
            id: CATALOG_ITEMS[0].id,
            name: CATALOG_ITEMS[0].name,
            price: CATALOG_ITEMS[0].price,
            quantity: 1,
          },
          {
            id: CATALOG_ITEMS[6].id,
            name: CATALOG_ITEMS[6].name,
            price: CATALOG_ITEMS[6].price,
            quantity: 2,
          },
          {
            id: CATALOG_ITEMS[10].id,
            name: CATALOG_ITEMS[10].name,
            price: CATALOG_ITEMS[10].price,
            quantity: 1,
          },
        ],
        freeEnergyDrinkIncluded: true,
        promoCodeApplied: 'CAMPUSFIRST',
        discountAmount: 50,
        deliveryFee: FLAT_DELIVERY_FEE,
        subtotal: 250,
        total: 235,
        paymentMethod: 'upi',
      });
      setSelectedOrderId(created.orderId);
    } finally {
      setCreatingDemo(false);
    }
  };

  const handleAdvance = async () => {
    if (!activeOrder || advancing) return;
    setAdvancing(true);
    try {
      await advanceOrderStage(activeOrder);
    } finally {
      setAdvancing(false);
    }
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || npsScore === null || submittingSurvey) return;
    setSubmittingSurvey(true);
    try {
      await submitSurvey(activeOrder.orderId, npsScore, requestedItem);
      setSurveyJustSubmitted(true);
    } finally {
      setSubmittingSurvey(false);
    }
  };

  // Unauthenticated state
  if (authReady && !user) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="p-8 sm:p-10 rounded-xl bg-[#131720] border border-slate-800 text-center space-y-5">
          <LogIn className="w-10 h-10 text-amber-400 mx-auto" aria-hidden="true" />
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-50">
              Sign in with Google to Track Your Orders
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
              Your late-night deliveries, saved hostel room details, and ₹30 post-order cashback rewards are securely synced to your student Google account.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              {authBusy ? 'Signing in...' : 'Sign in with Google'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className="px-5 py-3 text-sm font-medium text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Loading state
  if (!authReady || ordersLoading) {
    return (
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="h-20 rounded-xl bg-[#131720] border border-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 rounded-xl bg-[#131720] border border-slate-800 animate-pulse" />
          <div className="lg:col-span-5 h-80 rounded-xl bg-[#131720] border border-slate-800 animate-pulse" />
        </div>
      </section>
    );
  }

  // Empty state (signed in, zero orders yet)
  if (!activeOrder) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="p-8 sm:p-10 rounded-xl bg-[#131720] border border-slate-800 text-center space-y-5">
          <Clock className="w-10 h-10 text-amber-400 mx-auto" aria-hidden="true" />
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-50">
              No Saved Late-Night Orders Yet
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
              Place an order from the Hostel Micro-Stock Menu or create a sample pilot order in Firestore to test live courier tracking and the ₹30 cashback survey.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className="px-5 py-2.5 text-sm font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              Order from Menu
            </button>
            <button
              type="button"
              disabled={creatingDemo}
              onClick={() => void handleCreateSampleOrder()}
              className="px-5 py-2.5 text-sm font-medium text-slate-200 border border-slate-700 hover:border-slate-500 disabled:opacity-50 rounded-lg transition-colors"
            >
              {creatingDemo ? 'Saving Sample Order...' : 'Create Sample Pilot Order'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const surveyDone = surveyJustSubmitted || Boolean(userProfile?.surveyRewardUnlocked);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Order History Switcher when multiple Firestore orders exist */}
      {orders.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-slate-400 shrink-0 mr-1">Your Orders:</span>
          {orders.map((ord) => {
            const isSelected = ord.orderId === activeOrder.orderId;
            return (
              <button
                key={ord.orderId}
                type="button"
                onClick={() => setSelectedOrderId(ord.orderId)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border whitespace-nowrap shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-amber-400 text-[#0B0E14] border-amber-400 font-semibold'
                    : 'bg-[#131720] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                #{ord.orderId} · ₹{ord.total} · {ord.status === 'delivered' ? 'Delivered' : 'Active'}
              </button>
            );
          })}
        </div>
      )}

      {/* Header Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <p className="font-mono text-xs text-amber-400">
            Order #{activeOrder.orderId} · Placed at {activeOrder.createdAt}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-50">
            {activeOrder.stage === 3
              ? 'Delivered to Your Study Spot'
              : 'Campus Courier En Route'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Drop-off: {activeOrder.location} · {activeOrder.roomOrDesk}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2.5 rounded-lg bg-[#131720] border border-slate-800 text-right">
            <span className="block text-[11px] text-slate-400">
              {activeOrder.stage === 3 ? 'Fulfillment Completed' : 'Sub-20m Target Countdown'}
            </span>
            <span className="font-mono text-xl font-bold text-amber-400 tabular-nums">
              {activeOrder.stage === 3 ? '14m 18s' : formatCountdown(secondsLeft)}
            </span>
          </div>

          {activeOrder.stage < 3 && (
            <button
              type="button"
              disabled={advancing}
              onClick={() => void handleAdvance()}
              className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {advancing ? 'Updating...' : 'Advance Courier Stage'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Tracker & Receipt */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Milestone Timeline */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {activeOrder.courierName} · {activeOrder.courierVehicle}
                </p>
                <p className="text-xs font-mono text-slate-400">
                  Active Campus ID Badge #{activeOrder.courierBadge}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Security Gate Cleared
            </span>
          </div>

          <ol className="space-y-5">
            {STAGES.map((stage, idx) => {
              const stageIdx = idx as OrderStage;
              const isCompleted = activeOrder.stage > stageIdx || activeOrder.stage === 3;
              const isCurrent = activeOrder.stage === stageIdx && activeOrder.stage < 3;

              return (
                <li key={stage.title} className="flex items-start gap-4">
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold shrink-0 border ${
                      isCompleted
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : isCurrent
                        ? 'bg-amber-400 text-[#0B0E14] border-amber-400'
                        : 'bg-[#0B0E14] border-slate-700 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <p
                      className={`text-sm font-semibold ${
                        isCompleted || isCurrent ? 'text-slate-100' : 'text-slate-500'
                      }`}
                    >
                      {stage.title}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {stage.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-800/80">
            Synced live with Firestore database. Real-time GPS map tracking is excluded in the MVP pilot to keep setup costs under ₹10,000.
          </p>
        </div>

        {/* Right: Order Receipt + Post-Order ₹30 Cashback Survey */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-slate-50">
              Order Receipt
            </h2>
            <ul className="space-y-2 text-sm">
              {activeOrder.items.map((item) => (
                <li key={item.id} className="flex justify-between text-slate-300">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span className="font-mono tabular-nums">
                    ₹{item.price * item.quantity}
                  </span>
                </li>
              ))}
              {activeOrder.freeEnergyDrinkIncluded && (
                <li className="flex justify-between text-emerald-400 text-xs pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                    1× Volt Berry Energy Can (Midnight Fuel)
                  </span>
                  <span className="font-mono">₹0</span>
                </li>
              )}
            </ul>

            <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Flat Delivery Fee</span>
                <span className="font-mono tabular-nums">
                  ₹{activeOrder.deliveryFee}
                </span>
              </div>
              {activeOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promo ({activeOrder.promoCodeApplied})</span>
                  <span className="font-mono tabular-nums">
                    -₹{activeOrder.discountAmount}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-slate-50 pt-1.5 border-t border-slate-800">
                <span>
                  Paid ({activeOrder.paymentMethod === 'upi' ? 'Direct UPI QR' : 'WhatsApp Bot'})
                </span>
                <span className="font-mono text-amber-400 tabular-nums">
                  ₹{activeOrder.total}
                </span>
              </div>
            </div>
          </div>

          {/* Mission 9 Week 4 Post-Purchase Survey */}
          <div className="p-6 rounded-xl bg-[#131720] border border-slate-800 space-y-4">
            <div>
              <span className="font-mono text-xs text-amber-400">
                Week 4 Feedback Loop · ₹30 Cashback
              </span>
              <h2 className="mt-1 text-base font-semibold text-slate-50">
                Post-Purchase Pilot Survey
              </h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Rate your delivery speed and suggest what our hostel cabinet should stock next to unlock ₹30 off (<span className="font-mono text-slate-200">SURVEY30</span>).
              </p>
            </div>

            {surveyDone ? (
              <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-700/40 space-y-1.5">
                <p className="text-sm font-semibold text-emerald-300">
                  Feedback Saved — ₹30 Cashback Unlocked
                </p>
                <p className="text-xs text-emerald-200/80">
                  Use promo code <span className="font-mono font-bold">SURVEY30</span> in your bag on your next late-night study order.
                </p>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSurveySubmit(e)} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-2">
                    How likely are you to recommend Campus Cravings to your floor? (1–10)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[2, 4, 6, 8, 10].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNpsScore(val)}
                        className={`py-2 text-xs font-mono font-semibold rounded-md border transition-colors ${
                          npsScore === val
                            ? 'bg-amber-400 text-[#0B0E14] border-amber-400'
                            : 'bg-[#0B0E14] border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cc-stock-req"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    Any snack or stationery item we should stock next?
                  </label>
                  <input
                    id="cc-stock-req"
                    type="text"
                    maxLength={200}
                    value={requestedItem}
                    onChange={(e) => setRequestedItem(e.target.value)}
                    placeholder="e.g. Protein bars, scientific calculator batteries..."
                    className="w-full px-3 py-2 text-xs bg-[#0B0E14] border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={npsScore === null || submittingSurvey}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {submittingSurvey
                    ? 'Saving Survey...'
                    : 'Submit Survey & Unlock SURVEY30'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
