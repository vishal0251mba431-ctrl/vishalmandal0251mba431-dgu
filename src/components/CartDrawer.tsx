import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  LogIn,
  MessageSquare,
  Minus,
  Plus,
  QrCode,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import {
  DROP_OFF_LOCATIONS,
  FLAT_DELIVERY_FEE,
  MIDNIGHT_BUNDLE_THRESHOLD,
} from '../data/campusData';
import { CartEntry } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartEntry[];
  onUpdateQty: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  isMidnightWindow: boolean;
  onOrderPlaced: () => void;
}

const VALID_PROMOS: Record<string, { discount: number; label: string }> = {
  CAMPUSFIRST: { discount: 50, label: '₹50 off first late-night order' },
  SURVEY30: { discount: 30, label: '₹30 post-order survey cashback' },
};

const UpiQrGraphic: React.FC<{ amount: number }> = ({ amount }) => {
  const cells = useMemo(() => {
    const grid: boolean[] = [];
    const seed = Math.max(1, Math.round(amount));
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const inTopLeft = r < 4 && c < 4;
        const inTopRight = r < 4 && c > 10;
        const inBottomLeft = r > 10 && c < 4;
        if (inTopLeft || inTopRight || inBottomLeft) {
          const lr = r > 10 ? r - 11 : r;
          const lc = c > 10 ? c - 11 : c;
          const border = lr === 0 || lr === 3 || lc === 0 || lc === 3;
          const center = lr >= 1 && lr <= 2 && lc >= 1 && lc <= 2;
          grid.push(border || center);
        } else {
          const hash = (r * 31 + c * 17 + seed * 7) % 11 > 4;
          grid.push(hash);
        }
      }
    }
    return grid;
  }, [amount]);

  return (
    <div className="inline-flex flex-col items-center p-3 rounded-lg bg-white text-[#0B0E14]">
      <svg
        width="132"
        height="132"
        viewBox="0 0 15 15"
        role="img"
        aria-label={`UPI QR Code for ₹${amount}`}
      >
        <rect width="15" height="15" fill="#ffffff" />
        {cells.map((filled, idx) => {
          if (!filled) return null;
          const x = idx % 15;
          const y = Math.floor(idx / 15);
          return <rect key={idx} x={x} y={y} width="1" height="1" fill="#0B0E14" />;
        })}
      </svg>
      <span className="mt-2 font-mono text-[11px] font-semibold tracking-tight text-slate-900 tabular-nums">
        campuscravings@upi · ₹{amount}
      </span>
    </div>
  );
};

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  isMidnightWindow,
  onOrderPlaced,
}) => {
  const {
    user,
    userProfile,
    authBusy,
    signInWithGoogle,
    createOrder,
  } = useFirebase();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('+91 98765 43210');
  const [location, setLocation] = useState(DROP_OFF_LOCATIONS[0]);
  const [roomOrDesk, setRoomOrDesk] = useState('Room 314');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'whatsapp'>('upi');
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill delivery details from Firestore profile when signed in
  useEffect(() => {
    if (userProfile) {
      if (!customerName && userProfile.displayName) {
        setCustomerName(userProfile.displayName);
      }
      if (userProfile.defaultLocation) {
        setLocation(userProfile.defaultLocation);
      }
      if (userProfile.defaultRoomOrDesk) {
        setRoomOrDesk(userProfile.defaultRoomOrDesk);
      }
      if (userProfile.defaultWhatsapp) {
        setWhatsapp(userProfile.defaultWhatsapp);
      }
    } else if (user?.displayName && !customerName) {
      setCustomerName(user.displayName);
    }
  }, [userProfile, user]);

  if (!isOpen) return null;

  const surveyRewardUnlocked = Boolean(userProfile?.surveyRewardUnlocked);
  const subtotal = cart.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );
  const freeEnergyDrinkIncluded =
    isMidnightWindow && subtotal >= MIDNIGHT_BUNDLE_THRESHOLD;

  const discountAmount = appliedPromo
    ? Math.min(VALID_PROMOS[appliedPromo]?.discount ?? 0, subtotal)
    : 0;

  const deliveryFee = cart.length > 0 ? FLAT_DELIVERY_FEE : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleApplyPromo = (codeOverride?: string) => {
    const code = (codeOverride ?? promoInput).trim().toUpperCase();
    if (!code) {
      setPromoFeedback('Enter CAMPUSFIRST or SURVEY30.');
      return;
    }
    if (VALID_PROMOS[code]) {
      setAppliedPromo(code);
      setPromoInput(code);
      setPromoFeedback(`Applied ${code}: ${VALID_PROMOS[code].label}.`);
    } else {
      setPromoFeedback('Invalid code. Try CAMPUSFIRST for ₹50 off.');
    }
  };

  const whatsappMessageText = [
    `*CAMPUS CRAVINGS — LATE-NIGHT ORDER*`,
    `Name: ${customerName.trim() || user?.displayName || 'Student'}`,
    `Drop-Off: ${location} (${roomOrDesk.trim() || 'Lobby'})`,
    `Items:`,
    ...cart.map(
      (e) => `- ${e.quantity}x ${e.item.name} (₹${e.item.price * e.quantity})`
    ),
    ...(freeEnergyDrinkIncluded
      ? [`- 1x Volt Berry Energy Can (Midnight Fuel Bundle: ₹0)`]
      : []),
    `Delivery Fee: ₹${deliveryFee}`,
    ...(discountAmount > 0 ? [`Promo (${appliedPromo}): -₹${discountAmount}`] : []),
    `*Total Payable via UPI: ₹${total}*`,
  ].join('\n');

  const handleCopyWhatsapp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessageText);
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 2000);
    } catch {
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 2000);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || submitting) return;

    if (!user) {
      await signInWithGoogle();
      return;
    }

    const finalName = (customerName.trim() || user.displayName || 'Student').trim();
    if (!finalName || roomOrDesk.trim().length < 1 || whatsapp.trim().length < 5) {
      setFormError('Please enter a valid name, room/desk number, and WhatsApp number (min 5 chars).');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await createOrder({
        customerName: finalName,
        whatsapp: whatsapp.trim(),
        location,
        roomOrDesk: roomOrDesk.trim(),
        items: cart.map((entry) => ({
          id: entry.item.id,
          name: entry.item.name,
          price: entry.item.price,
          quantity: entry.quantity,
        })),
        freeEnergyDrinkIncluded,
        promoCodeApplied: appliedPromo || '',
        discountAmount,
        deliveryFee,
        subtotal,
        total,
        paymentMethod,
      });
      onOrderPlaced();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Your late-night order bag"
    >
      <div className="relative w-full max-w-lg bg-[#0F131C] border-l border-slate-800 h-full flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-50">
              Your Late-Night Bag
            </h2>
            <p className="text-xs text-slate-400">
              Flat ₹{FLAT_DELIVERY_FEE} courier drop · Under 20 minutes to your desk
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order bag"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:text-slate-50 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-base font-medium text-slate-200">
                Your late-night bag is empty.
              </p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Add chips, cold coffee, cup noodles, or study essentials from the hostel micro-stock menu.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2.5 text-xs font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Itemized Cart List */}
              <div className="space-y-3">
                {cart.map(({ item, quantity }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#141923] border border-slate-800/80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono tabular-nums">
                        ₹{item.price} each · {item.packSize}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="inline-flex items-center gap-1 bg-[#0B0E14] border border-slate-700 rounded-md p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, -1)}
                          aria-label={`Remove one ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:bg-slate-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-semibold text-slate-100 w-5 text-center tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, 1)}
                          aria-label={`Add one ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:bg-slate-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono text-sm font-semibold text-amber-400 w-12 text-right tabular-nums">
                        ₹{item.price * quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${item.name} from bag`}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Midnight Fuel Bundle Reward Row */}
                {isMidnightWindow && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                      freeEnergyDrinkIncluded
                        ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-200'
                        : 'bg-[#141923] border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap
                        className={`w-4 h-4 shrink-0 ${
                          freeEnergyDrinkIncluded ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        {freeEnergyDrinkIncluded
                          ? 'Midnight Fuel Bundle unlocked: Free Volt Berry Energy Can (250ml)'
                          : `Add ₹${MIDNIGHT_BUNDLE_THRESHOLD - subtotal} more to unlock a free energy drink (11 PM–2 AM)`}
                      </span>
                    </div>
                    {freeEnergyDrinkIncluded && (
                      <span className="font-mono font-semibold text-emerald-300 shrink-0">
                        ₹0
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Promo Code Input */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">Promo Code</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPromo('CAMPUSFIRST')}
                      className="text-amber-400 hover:underline font-mono"
                    >
                      Use CAMPUSFIRST
                    </button>
                    {surveyRewardUnlocked && (
                      <button
                        type="button"
                        onClick={() => handleApplyPromo('SURVEY30')}
                        className="text-emerald-400 hover:underline font-mono"
                      >
                        Use SURVEY30
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter CAMPUSFIRST"
                    className="flex-1 px-3 py-2 text-sm font-mono uppercase bg-[#141923] border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    className="px-4 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {promoFeedback && (
                  <p className="text-xs text-amber-300">{promoFeedback}</p>
                )}
              </div>

              {/* Campus Delivery Details */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Direct Campus Drop-Off
                  </h3>
                  {user && (
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                      {user.email}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="cc-name"
                      className="block text-xs text-slate-400 mb-1"
                    >
                      Student Name
                    </label>
                    <input
                      id="cc-name"
                      type="text"
                      maxLength={100}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={user?.displayName || 'Your Name'}
                      className="w-full px-3 py-2 text-sm bg-[#141923] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cc-whatsapp"
                      className="block text-xs text-slate-400 mb-1"
                    >
                      WhatsApp Number
                    </label>
                    <input
                      id="cc-whatsapp"
                      type="tel"
                      maxLength={32}
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono bg-[#141923] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="cc-location"
                      className="block text-xs text-slate-400 mb-1"
                    >
                      Hostel / Library Zone
                    </label>
                    <select
                      id="cc-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#141923] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      {DROP_OFF_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="cc-room"
                      className="block text-xs text-slate-400 mb-1"
                    >
                      Room or Desk Number
                    </label>
                    <input
                      id="cc-room"
                      type="text"
                      maxLength={80}
                      value={roomOrDesk}
                      onChange={(e) => setRoomOrDesk(e.target.value)}
                      placeholder="e.g. Room 314 / Desk B12"
                      className="w-full px-3 py-2 text-sm bg-[#141923] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Zero-Fee Direct UPI QR / WhatsApp Bot Checkout Selector */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-100">
                  Lightweight Checkout (Zero Gateway Fee)
                </h3>

                <div className="grid grid-cols-2 gap-2 p-1 bg-[#141923] border border-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      paymentMethod === 'upi'
                        ? 'bg-amber-400 text-[#0B0E14] font-semibold'
                        : 'text-slate-300 hover:text-slate-50'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                    Direct UPI QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('whatsapp')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      paymentMethod === 'whatsapp'
                        ? 'bg-amber-400 text-[#0B0E14] font-semibold'
                        : 'text-slate-300 hover:text-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    WhatsApp Order Bot
                  </button>
                </div>

                {paymentMethod === 'upi' ? (
                  <div className="p-4 rounded-xl bg-[#141923] border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                    <UpiQrGraphic amount={total} />
                    <div className="text-xs text-slate-300 space-y-1.5 text-center sm:text-left">
                      <p className="font-semibold text-slate-100">
                        Scan via GPay, PhonePe, or Paytm
                      </p>
                      <p className="text-slate-400 leading-relaxed">
                        Direct UPI QR eliminates payment gateway fees so delivery stays flat at ₹{FLAT_DELIVERY_FEE}.
                      </p>
                      <p className="font-mono text-[11px] text-amber-300 break-all">
                        upi://pay?pa=campuscravings@upi&amp;am={total}&amp;cu=INR
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#141923] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        Formatted WhatsApp Catalog Message
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyWhatsapp}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        {copiedWhatsapp ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Text
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#0B0E14] border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {whatsappMessageText}
                    </pre>
                  </div>
                )}
              </div>

              {formError && (
                <p role="alert" className="text-xs text-rose-400 font-medium">
                  {formError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-800 bg-[#0C1018] space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-mono tabular-nums">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Flat Campus Micro-Mobility Delivery</span>
                <span className="font-mono tabular-nums">₹{deliveryFee}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promo ({appliedPromo})</span>
                  <span className="font-mono tabular-nums">-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-slate-50 pt-1.5 border-t border-slate-800">
                <span>Total Payable</span>
                <span className="font-mono text-base text-amber-400 tabular-nums">
                  ₹{total}
                </span>
              </div>
            </div>

            {!user ? (
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void signInWithGoogle()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                {authBusy
                  ? 'Connecting Google Account...'
                  : 'Sign in with Google to Place Order'}
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleCheckout()}
                className="w-full py-3 px-4 text-sm font-semibold text-[#0B0E14] bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                {submitting
                  ? 'Saving Order to Database...'
                  : paymentMethod === 'upi'
                  ? `Confirm UPI Payment (₹${total}) & Dispatch Courier`
                  : `Submit WhatsApp Order (₹${total}) & Track Drop`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
