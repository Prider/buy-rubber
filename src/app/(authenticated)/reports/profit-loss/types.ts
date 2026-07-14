export type ViewMode = 'daily' | 'weekly' | 'monthly';

export interface ProfitLossRow {
  period: string;
  sales: number;
  purchases: number;
  expenses: number;
  purchasePricePerKg: number;
  salePricePerKg: number;
  net: number;
}

export interface ProfitLossTotals {
  sales: number;
  purchases: number;
  expenses: number;
  net: number;
}

export interface ProfitLossReportResponse {
  periods: ProfitLossRow[];
  totals: ProfitLossTotals;
}

export const EMPTY_TOTALS: ProfitLossTotals = {
  sales: 0,
  purchases: 0,
  expenses: 0,
  net: 0,
};

export const CHART_SERIES = [
  { key: 'expenses', label: 'Expenses', color: '#2563eb' },
  { key: 'purchasePricePerKg', label: 'Purchase price/kg', color: '#dc2626' },
  { key: 'salePricePerKg', label: 'Sale price/kg', color: '#16a34a' },
] as const;
