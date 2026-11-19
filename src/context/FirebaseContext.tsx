import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  signInWithPopup,
  signOut,
} from '../firebase';
import {
  ActiveOrder,
  OrderStage,
  UserProfile,
  VenturePlanState,
} from '../types';

const ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function sanitizeText(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

function sanitizeId(val: string, fallback: string): string {
  const cleaned = val.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  return cleaned.length >= 3 && ID_REGEX.test(cleaned) ? cleaned : fallback;
}

export interface CreateOrderInput {
  customerName: string;
  whatsapp: string;
  location: string;
  roomOrDesk: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  freeEnergyDrinkIncluded: boolean;
  promoCodeApplied: string;
  discountAmount: number;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: 'upi' | 'whatsapp';
}

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  userProfile: UserProfile | null;
  orders: ActiveOrder[];
  ordersLoading: boolean;
  venturePlan: VenturePlanState | null;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  createOrder: (input: CreateOrderInput) => Promise<ActiveOrder>;
  advanceOrderStage: (order: ActiveOrder) => Promise<void>;
  submitSurvey: (orderId: string, npsScore: number, requestedItem: string) => Promise<void>;
  saveVenturePlan: (state: VenturePlanState) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [venturePlan, setVenturePlan] = useState<VenturePlanState | null>(null);
  const [asyncError, setAsyncError] = useState<Error | null>(null);

  if (asyncError) {
    throw asyncError;
  }

  const inFlightProfileRef = React.useRef<Map<string, Promise<void>>>(new Map());

  // Ensure user profile document exists in Firestore upon login (deduplicated per uid)
  const ensureUserProfile = async (firebaseUser: User): Promise<void> => {
    const existingPromise = inFlightProfileRef.current.get(firebaseUser.uid);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = (async () => {
      const profilePath = `users/${firebaseUser.uid}`;
      const userRef = doc(db, 'users', firebaseUser.uid);
      let snap;
      try {
        snap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, profilePath);
      }

      if (!snap.exists()) {
        const displayName = sanitizeText(
          firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Campus Student',
          100
        );
        const email = sanitizeText(firebaseUser.email || '', 150);
        const photoURL = sanitizeText(firebaseUser.photoURL || '', 500);
        try {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            displayName,
            email,
            ...(photoURL ? { photoURL } : {}),
            surveyRewardUnlocked: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, profilePath);
        }
      }
    })();

    inFlightProfileRef.current.set(firebaseUser.uid, promise);
    try {
      await promise;
    } finally {
      inFlightProfileRef.current.delete(firebaseUser.uid);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (!firebaseUser) {
        setUserProfile(null);
        setOrders([]);
        setVenturePlan(null);
        setOrdersLoading(false);
        return;
      }

      try {
        await ensureUserProfile(firebaseUser);
      } catch (err) {
        setAsyncError(err instanceof Error ? err : new Error(String(err)));
      }
    });
    return () => unsub();
  }, []);

  // Attach Firestore listeners strictly after auth is ready & user is signed in
  useEffect(() => {
    if (!authReady || !user) return;

    const profilePath = `users/${user.uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setUserProfile({
            uid: String(d.uid || user.uid),
            displayName: String(d.displayName || user.displayName || 'Student'),
            email: String(d.email || user.email || ''),
            photoURL: d.photoURL ? String(d.photoURL) : undefined,
            defaultLocation: d.defaultLocation ? String(d.defaultLocation) : undefined,
            defaultRoomOrDesk: d.defaultRoomOrDesk ? String(d.defaultRoomOrDesk) : undefined,
            defaultWhatsapp: d.defaultWhatsapp ? String(d.defaultWhatsapp) : undefined,
            surveyRewardUnlocked: Boolean(d.surveyRewardUnlocked),
          });
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, profilePath);
        } catch (wrapped) {
          setAsyncError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    setOrdersLoading(true);
    const ordersPath = 'orders';
    const ordersQuery = query(
      collection(db, ordersPath),
      where('userId', '==', user.uid)
    );
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const list: ActiveOrder[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const ts = d.createdAt instanceof Timestamp ? d.createdAt.toDate() : null;
          return {
            orderId: String(d.orderId || docSnap.id),
            userId: String(d.userId || user.uid),
            createdAt: ts
              ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
            createdAtMs: ts ? ts.getTime() : Date.now(),
            customerName: String(d.customerName || ''),
            whatsapp: String(d.whatsapp || ''),
            location: String(d.location || ''),
            roomOrDesk: String(d.roomOrDesk || ''),
            items: Array.isArray(d.items) ? d.items : [],
            freeEnergyDrinkIncluded: Boolean(d.freeEnergyDrinkIncluded),
            promoCodeApplied: String(d.promoCodeApplied || ''),
            discountAmount: Number(d.discountAmount || 0),
            deliveryFee: Number(d.deliveryFee || 0),
            subtotal: Number(d.subtotal || 0),
            total: Number(d.total || 0),
            paymentMethod: d.paymentMethod === 'whatsapp' ? 'whatsapp' : 'upi',
            stage: Number(d.stage ?? 0) as OrderStage,
            status: d.status === 'delivered' ? 'delivered' : 'active',
            etaSeconds: Number(d.etaSeconds ?? 0),
            courierName: String(d.courierName || 'Rohan Mehta'),
            courierBadge: String(d.courierBadge || 'DGU-402'),
            courierVehicle: String(d.courierVehicle || 'Campus E-Scooter'),
          };
        });
        list.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
        setOrders(list);
        setOrdersLoading(false);
      },
      (err) => {
        setOrdersLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, ordersPath);
        } catch (wrapped) {
          setAsyncError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    const venturePath = `venture_plans/${user.uid}`;
    const unsubVenture = onSnapshot(
      doc(db, 'venture_plans', user.uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setVenturePlan({
            selectedScenarioId: d.selectedScenarioId || 'base',
            sellingPrice: Number(d.sellingPrice ?? 200),
            variableCost: Number(d.variableCost ?? 140),
            customers: Number(d.customers ?? 500),
            purchasesPerCustomer: Number(d.purchasesPerCustomer ?? 3),
            monthlyFixedCost: Number(d.monthlyFixedCost ?? 15000),
            gtmStatuses: d.gtmStatuses || {
              'Week 1': 'Validated',
              'Week 2': 'Active',
              'Week 3': 'Planned',
              'Week 4': 'Planned',
            },
          });
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, venturePath);
        } catch (wrapped) {
          setAsyncError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    return () => {
      unsubProfile();
      unsubOrders();
      unsubVenture();
    };
  }, [authReady, user]);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(cred.user);
      return cred.user;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Google Sign-In could not complete.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
      return null;
    } finally {
      setAuthBusy(false);
    }
  };

  const signOutUser = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } finally {
      setAuthBusy(false);
    }
  };

  const createOrder = async (input: CreateOrderInput): Promise<ActiveOrder> => {
    if (!user) {
      throw new Error('Please sign in with Google before placing an order.');
    }

    const orderId = sanitizeId(
      `CC-${Math.floor(100000 + Math.random() * 900000)}`,
      `CC-${Date.now()}`
    );
    const boundedItems = input.items.slice(0, 20).map((it) => ({
      id: sanitizeText(it.id, 64),
      name: sanitizeText(it.name, 120),
      price: Math.max(0, Math.min(5000, Number(it.price))),
      quantity: Math.max(1, Math.min(20, Math.round(Number(it.quantity)))),
    }));

    const payload = {
      orderId,
      userId: user.uid,
      customerName: sanitizeText(input.customerName, 100) || 'Student',
      whatsapp: sanitizeText(input.whatsapp, 32),
      location: sanitizeText(input.location, 120),
      roomOrDesk: sanitizeText(input.roomOrDesk, 80),
      items: boundedItems,
      freeEnergyDrinkIncluded: Boolean(input.freeEnergyDrinkIncluded),
      promoCodeApplied: sanitizeText(input.promoCodeApplied || '', 32),
      discountAmount: Math.max(0, Math.min(500, Number(input.discountAmount))),
      deliveryFee: Math.max(0, Math.min(100, Number(input.deliveryFee))),
      subtotal: Math.max(1, Math.min(20000, Number(input.subtotal))),
      total: Math.max(0, Math.min(20000, Number(input.total))),
      paymentMethod: input.paymentMethod,
      stage: 0 as OrderStage,
      status: 'active' as const,
      etaSeconds: 18 * 60,
      courierName: 'Rohan Mehta',
      courierBadge: 'DGU-402',
      courierVehicle: 'Campus E-Scooter',
    };

    const orderPath = `orders/${orderId}`;
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'orders', orderId), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users', user.uid), {
        defaultLocation: payload.location,
        defaultRoomOrDesk: payload.roomOrDesk,
        defaultWhatsapp: payload.whatsapp,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, orderPath);
    }

    return {
      ...payload,
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      createdAtMs: Date.now(),
    };
  };

  const advanceOrderStage = async (order: ActiveOrder): Promise<void> => {
    if (!user || order.stage >= 3 || order.status === 'delivered') return;
    const nextStage = Math.min(3, order.stage + 1) as OrderStage;
    const nextStatus = nextStage === 3 ? 'delivered' : 'active';
    const nextEta = nextStage === 3 ? 0 : Math.max(120, order.etaSeconds - 300);

    const orderPath = `orders/${order.orderId}`;
    try {
      await updateDoc(doc(db, 'orders', order.orderId), {
        stage: nextStage,
        status: nextStatus,
        etaSeconds: nextEta,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, orderPath);
    }
  };

  const submitSurvey = async (
    orderId: string,
    npsScore: number,
    requestedItem: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('Sign in with Google to submit feedback.');
    }
    await ensureUserProfile(user);
    const cleanOrderId = sanitizeId(orderId, 'CC-0000');
    const responseId = sanitizeId(
      `SR-${cleanOrderId}-${user.uid.slice(0, 8)}`,
      `SR-${Date.now()}`
    );
    const surveyPath = `survey_responses/${responseId}`;

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'survey_responses', responseId), {
        userId: user.uid,
        orderId: cleanOrderId,
        npsScore: Math.max(1, Math.min(10, Math.round(npsScore))),
        requestedItem: sanitizeText(requestedItem, 200),
        createdAt: serverTimestamp(),
      });
      if (!userProfile?.surveyRewardUnlocked) {
        batch.update(doc(db, 'users', user.uid), {
          surveyRewardUnlocked: true,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, surveyPath);
    }
  };

  const saveVenturePlan = async (state: VenturePlanState): Promise<void> => {
    if (!user) return;
    const venturePath = `venture_plans/${user.uid}`;
    const payload = {
      userId: user.uid,
      selectedScenarioId: state.selectedScenarioId,
      sellingPrice: Math.max(50, Math.min(1000, Number(state.sellingPrice))),
      variableCost: Math.max(20, Math.min(800, Number(state.variableCost))),
      customers: Math.max(10, Math.min(10000, Number(state.customers))),
      purchasesPerCustomer: Math.max(1, Math.min(20, Number(state.purchasesPerCustomer))),
      monthlyFixedCost: Math.max(0, Math.min(500000, Number(state.monthlyFixedCost))),
      gtmStatuses: {
        'Week 1': state.gtmStatuses['Week 1'] || 'Planned',
        'Week 2': state.gtmStatuses['Week 2'] || 'Planned',
        'Week 3': state.gtmStatuses['Week 3'] || 'Planned',
        'Week 4': state.gtmStatuses['Week 4'] || 'Planned',
      },
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'venture_plans', user.uid), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, venturePath);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        authBusy,
        authError,
        userProfile,
        orders,
        ordersLoading,
        venturePlan,
        signInWithGoogle,
        signOutUser,
        createOrder,
        advanceOrderStage,
        submitSurvey,
        saveVenturePlan,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
}
