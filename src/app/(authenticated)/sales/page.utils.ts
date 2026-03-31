export interface ProductType {
  id: string;
  code: string;
  name: string;
}

export interface SaleRow {
  id: string;
  saleNo: string;
  date: string;
  companyName: string;
  productTypeId: string;
  productType?: { name: string; code: string };
  weight: number;
  rubberPercent: number | null;
  pricePerUnit: number;
  expenseType: string | null;
  expenseCost: number | null;
  expenseNote: string | null;
  sellingType: string;
  totalAmount: number;
}

export interface SaleFormData {
  date: string;
  companyName: string;
  productTypeId: string;
  weight: string;
  rubberPercent: string;
  pricePerUnit: string;
  expenseType: string;
  expenseCost: string;
  expenseNote: string;
  sellingType: string;
}

export type SaleRowApi = Omit<SaleRow, 'expenseNote'> & {
  notes?: string | null;
  expenseNote?: string | null;
};

export interface SalesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export const SELLING_TYPES = ['จ่ายสด', 'ขายล่วง', 'ฝาก'];

export function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toInputDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return getTodayDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseOptionalNumber(v: string): number | null {
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseRequiredNumber(v: string): number | null {
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function computeTotalPreview(formData: SaleFormData): number {
  const w = parseRequiredNumber(formData.weight) ?? 0;
  const p = parseRequiredNumber(formData.pricePerUnit) ?? 0;
  const expenseCost = parseOptionalNumber(formData.expenseCost) ?? 0;
  const total = w * p - expenseCost;
  return total > 0 ? total : 0;
}

export function computePagination(total: number, currentPage: number, pageSize: number): SalesPagination {
  const totalPages = Math.ceil(total / pageSize) || 1;
  return {
    page: currentPage,
    limit: pageSize,
    total,
    totalPages,
    hasMore: currentPage < totalPages,
  };
}

export function paginateRows<T>(rows: T[], currentPage: number, pageSize: number): T[] {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return rows.slice(start, end);
}

export function normalizeSaleRow(row: SaleRowApi): SaleRow {
  const { notes, expenseNote, ...rest } = row;
  return { ...rest, expenseNote: expenseNote ?? notes ?? null };
}

export function buildSalePayload(formData: SaleFormData) {
  return {
    date: formData.date,
    companyName: formData.companyName.trim(),
    productTypeId: formData.productTypeId,
    weight: parseRequiredNumber(formData.weight),
    rubberPercent: formData.rubberPercent === '' ? null : parseFloat(formData.rubberPercent),
    pricePerUnit: parseRequiredNumber(formData.pricePerUnit),
    expenseType: formData.expenseType || null,
    expenseCost: parseOptionalNumber(formData.expenseCost),
    notes: formData.expenseNote.trim() ? formData.expenseNote : null,
    sellingType: formData.sellingType,
  };
}
