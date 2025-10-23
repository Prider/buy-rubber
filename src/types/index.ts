export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export interface Member {
  id: string;
  code: string;
  name: string;
  idCard?: string;
  phone?: string;
  address?: string;
  bankAccount?: string;
  bankName?: string;
  ownerPercent: number;
  tapperPercent: number;
  tapperId?: string;
  tapperName?: string;
  advanceBalance: number;
  isActive: boolean;
}

export interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface DailyPrice {
  id: string;
  date: Date;
  basePrice: number;
  priceRules?: PriceRule[];
}

export interface PriceRule {
  id: string;
  dailyPriceId: string;
  minPercent: number;
  maxPercent: number;
  adjustment: number;
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  date: Date;
  memberId: string;
  productTypeId: string;
  userId: string;
  grossWeight: number;
  containerWeight: number;
  netWeight: number;
  rubberPercent?: number;
  dryWeight: number;
  basePrice: number;
  adjustedPrice: number;
  bonusPrice: number;
  finalPrice: number;
  totalAmount: number;
  ownerAmount: number;
  tapperAmount: number;
  isPaid: boolean;
  notes?: string;
  location?: Location;
  member?: Member;
  productType?: ProductType;
  user?: User;
}

export interface Advance {
  id: string;
  advanceNo: string;
  date: Date;
  memberId: string;
  amount: number;
  remaining: number;
  notes?: string;
  member?: Member;
}

export interface Payment {
  id: string;
  paymentNo: string;
  date: Date;
  memberId: string;
  userId: string;
  totalAmount: number;
  advanceDeduct: number;
  netAmount: number;
  notes?: string;
  member?: Member;
  user?: User;
  items?: PaymentItem[];
}

export interface PaymentItem {
  id: string;
  paymentId: string;
  purchaseId: string;
  purchase?: Purchase;
}

export interface Sale {
  id: string;
  saleNo: string;
  date: Date;
  productTypeId: string;
  userId: string;
  customerName: string;
  weight: number;
  pricePerKg: number;
  totalAmount: number;
  notes?: string;
  location?: Location;
  productType?: ProductType;
  user?: User;
}

export interface Dividend {
  id: string;
  month: number;
  year: number;
  memberId: string;
  totalWeight: number;
  dividendRate: number;
  amount: number;
  isPaid: boolean;
  paidDate?: Date;
  notes?: string;
  member?: Member;
}

export interface DashboardStats {
  todayPurchases: number;
  todayAmount: number;
  monthPurchases: number;
  monthAmount: number;
  totalMembers: number;
  activeMembers: number;
  totalAdvance: number;
  unpaidAmount: number;
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  memberId?: string;
  productTypeId?: string;
}

