export interface PurchaseSummary {
  totalPurchases: number;
  totalAmount: number;
  totalWeight: number;
  avgPrice: number;
}

export interface QuickFilter {
  label: string;
  value: number | null;
}

