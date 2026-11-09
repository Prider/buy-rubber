export type MemberHistoryKind = 'purchase' | 'serviceFee';

export interface MemberHistoryRow {
  id: string;
  kind: MemberHistoryKind;
  date: string;
  createdAt: string;
  purchaseNo: string | null;
  label: string;
  netWeight: number | null;
  unitPrice: number | null;
  moisturePercent: number | null;
  amount: number;
  notes: string | null;
}

export interface MemberHistorySummary {
  purchaseCount: number;
  purchaseAmount: number;
  totalWeight: number;
  avgPrice: number;
  serviceFeeCount: number;
  serviceFeeAmount: number;
  totalRecords: number;
}

export interface QuickFilter {
  label: string;
  value: number | null;
}
