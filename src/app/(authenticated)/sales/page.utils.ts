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
  destinationCompanyId?: string | null;
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
  destinationCompanyId: string;
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

/** True when required sale fields are filled. Allows pricePerUnit === 0. */
export function isSalesFormSubmitReady(formData: SaleFormData): boolean {
  if (
    !formData.destinationCompanyId ||
    !formData.productTypeId ||
    formData.weight.trim() === '' ||
    formData.pricePerUnit.trim() === '' ||
    !formData.sellingType
  ) {
    return false;
  }

  const weight = parseRequiredNumber(formData.weight);
  const pricePerUnit = parseRequiredNumber(formData.pricePerUnit);
  // weight must be > 0; price may be 0 (e.g. free / sample sale)
  return weight != null && weight > 0 && pricePerUnit != null && pricePerUnit >= 0;
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

/** Page buttons to render (avoids allocating Array(totalPages) for large datasets). */
export function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) {
      result.push('ellipsis');
    }
    result.push(sorted[i]!);
  }
  return result;
}

export function normalizeSaleRow(row: SaleRowApi): SaleRow {
  const { notes, expenseNote, ...rest } = row;
  return { ...rest, expenseNote: expenseNote ?? notes ?? null };
}

export function buildSalePayload(formData: SaleFormData) {
  return {
    date: formData.date,
    destinationCompanyId: formData.destinationCompanyId,
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
