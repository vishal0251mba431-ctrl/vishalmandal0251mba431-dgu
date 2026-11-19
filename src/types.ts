export type CategoryId = 'all' | 'snacks' | 'beverages' | 'comfort' | 'study';

export interface CatalogItem {
  id: string;
  name: string;
  category: Exclude<CategoryId, 'all'>;
  categoryLabel: string;
  packSize: string;
  price: number;
  wholesaleCost: number;
  stockCount: number;
  image: string;
  imagePosition?: string;
  description: string;
  tag?: string;
}

export interface CartEntry {
  item: CatalogItem;
  quantity: number;
}

export type AppSection = 'menu' | 'how-it-works' | 'track' | 'venture';

export type OrderStage = 0 | 1 | 2 | 3;

export type GtmStatus = 'Planned' | 'Active' | 'Validated';

export interface OrderItemLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ActiveOrder {
  orderId: string;
  userId?: string;
  createdAt: string;
  createdAtMs?: number;
  customerName: string;
  whatsapp: string;
  location: string;
  roomOrDesk: string;
  items: OrderItemLine[];
  freeEnergyDrinkIncluded: boolean;
  promoCodeApplied: string;
  discountAmount: number;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: 'upi' | 'whatsapp';
  stage: OrderStage;
  status: 'active' | 'delivered';
  etaSeconds: number;
  courierName: string;
  courierBadge: string;
  courierVehicle: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  defaultLocation?: string;
  defaultRoomOrDesk?: string;
  defaultWhatsapp?: string;
  surveyRewardUnlocked: boolean;
}

export interface VenturePlanState {
  selectedScenarioId: 'conservative' | 'base' | 'ambitious' | 'custom';
  sellingPrice: number;
  variableCost: number;
  customers: number;
  purchasesPerCustomer: number;
  monthlyFixedCost: number;
  gtmStatuses: Record<string, GtmStatus>;
}

export interface CompetitorPoint {
  id: string;
  name: string;
  type: string;
  axisX: number;
  axisY: number;
  priceCost: string;
  mainOffer: string;
  mainStrength: string;
  mainWeakness: string;
  evidenceSource: string;
  evidenceStrength: 'Strong' | 'Moderate';
  isSelf?: boolean;
}

export interface FinancialScenario {
  id: 'conservative' | 'base' | 'ambitious';
  label: string;
  subtitle: string;
  sellingPrice: number;
  variableCost: number;
  customers: number;
  purchasesPerCustomer: number;
  monthlyFixedCost: number;
  notes: string;
}

export interface GtmWeek {
  week: string;
  channel: string;
  action: string;
  metric: string;
  learningQuestion: string;
  target: string;
  responsibility: string;
}

export interface RiskAssumption {
  id: string;
  title: string;
  whyItMatters: string;
  howToTest: string;
  evidenceNeeded: string;
  targetThreshold: string;
}
