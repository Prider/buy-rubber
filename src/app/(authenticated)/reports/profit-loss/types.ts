export type ViewMode = 'daily' | 'weekly' | 'monthly';

export interface ProfitLossRow {
  period: string;
  sales: number;
  serviceFees: number;
  purchases: number;
  expenses: number;
  purchasePricePerKg: number;
  salePricePerKg: number;
  net: number;
}

export interface ProfitLossTotals {
  sales: number;
  serviceFees: number;
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
  serviceFees: 0,
  purchases: 0,
  expenses: 0,
  net: 0,
};

export const CHART_SERIES = [
  { key: 'expenses', label: 'ค่าใช้จ่าย', color: '#2563eb', axis: 'amount' },
  { key: 'serviceFees', label: 'ค่าบริการ', color: '#d97706', axis: 'amount' },
  { key: 'purchases', label: 'ยอดรับซื้อ', color: '#dc2626', axis: 'amount' },
  { key: 'sales', label: 'ยอดขาย', color: '#16a34a', axis: 'amount' },
] as const;
