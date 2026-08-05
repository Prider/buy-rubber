export interface ProductType {
  id: string;
  code: string;
  name: string;
}

export interface SaleExpenseLine {
  id: string;
  type: string;
  amount: string;
  note: string;
}

export interface SaleExpenseApi {
  id?: string;
  type: string;
  amount: number;
  note?: string | null;
  sortOrder?: number;
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
  expenses?: SaleExpenseApi[];
  sellingType: string;
  totalAmount: number;
  /** Avg stock cost/kg at sale time (from ledger); null if unknown. */
  unitCostPerKg?: number | null;
  /** weight × unitCostPerKg at sale time. */
  costOfGoods?: number | null;
  /** totalAmount − costOfGoods (revenue after expenses minus COGS). */
  profitLoss?: number | null;
}

export interface SaleFormData {
  date: string;
  destinationCompanyId: string;
  companyName: string;
  productTypeId: string;
  weight: string;
  rubberPercent: string;
  pricePerUnit: string;
  expenses: SaleExpenseLine[];
  sellingType: string;
}

export type SaleRowApi = Omit<SaleRow, 'expenseNote'> & {
  notes?: string | null;
  expenseNote?: string | null;
  expenses?: SaleExpenseApi[];
};

export interface SalesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export const SELLING_TYPES = ['จ่ายสด', 'ขายล่วง', 'ฝาก'];

export function createEmptyExpenseLine(): SaleExpenseLine {
  return {
    id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: '',
    amount: '',
    note: '',
  };
}

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

/** Sum expense line amounts (empty/invalid lines count as 0). */
export function sumExpenses(expenses: SaleExpenseLine[]): number {
  return expenses.reduce((sum, line) => {
    const amount = parseOptionalNumber(line.amount);
    return sum + (amount != null && amount >= 0 ? amount : 0);
  }, 0);
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
  if (weight == null || weight <= 0 || pricePerUnit == null || pricePerUnit < 0) {
    return false;
  }

  // Expense lines with amount must have a type; negative amounts invalid
  for (const line of formData.expenses) {
    const amount = parseOptionalNumber(line.amount);
    if (amount != null && amount < 0) return false;
    if (amount != null && amount > 0 && !line.type.trim()) return false;
  }

  return true;
}

export function computeTotalPreview(formData: SaleFormData): number {
  const w = parseRequiredNumber(formData.weight) ?? 0;
  const p = parseRequiredNumber(formData.pricePerUnit) ?? 0;
  const expenseCost = sumExpenses(formData.expenses);
  const total = w * p - expenseCost;
  return total > 0 ? total : 0;
}

/** Net profit/loss for one sale: totalAmount (already net of expenses) minus that sale's COGS.
 * Unlike the stock page (product-level rollup using current avg cost × all sold kg),
 * this is always for a single sale transaction.
 */
export function computeSaleProfitLoss(
  totalAmount: number,
  costOfGoods: number | null | undefined,
): number | null {
  if (costOfGoods == null || !Number.isFinite(costOfGoods)) return null;
  if (!Number.isFinite(totalAmount)) return null;
  return totalAmount - costOfGoods;
}

/** Live P/L preview while entering a sale: (weight × price − expenses) − (weight × avgCost). */
export function computeSaleProfitPreview(
  formData: SaleFormData,
  avgCostPerKg: number | null | undefined,
): number | null {
  if (avgCostPerKg == null || !Number.isFinite(avgCostPerKg) || avgCostPerKg < 0) return null;
  const weight = parseRequiredNumber(formData.weight);
  if (weight == null || weight <= 0) return null;
  const totalAmount = computeTotalPreview(formData);
  return computeSaleProfitLoss(totalAmount, weight * avgCostPerKg);
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
  const { notes, expenseNote, expenses, ...rest } = row;
  return {
    ...rest,
    expenseNote: expenseNote ?? notes ?? null,
    expenses: expenses ?? [],
  };
}

/** Map API sale (or legacy single fields) into form expense lines. */
export function expensesFromSaleRow(row: SaleRow): SaleExpenseLine[] {
  if (row.expenses && row.expenses.length > 0) {
    return row.expenses.map((e, index) => ({
      id: e.id ?? `exp-${index}`,
      type: e.type || '',
      amount: e.amount != null ? String(e.amount) : '',
      note: e.note ?? '',
    }));
  }

  // Legacy fallback: single expenseType / expenseCost / notes
  if (row.expenseType || (row.expenseCost != null && row.expenseCost > 0) || row.expenseNote) {
    return [
      {
        id: `legacy-${row.id}`,
        type: row.expenseType || '',
        amount: row.expenseCost != null ? String(row.expenseCost) : '',
        note: row.expenseNote || '',
      },
    ];
  }

  return [];
}

export function formatExpenseTypeLabel(
  expenseType: string | null,
  expenses?: SaleExpenseApi[] | null,
): string {
  if (expenses && expenses.length > 1) {
    const first = expenses[0]?.type || expenseType || '-';
    return `${first} (+${expenses.length - 1})`;
  }
  if (expenses && expenses.length === 1) {
    return expenses[0]?.type || expenseType || '-';
  }
  return expenseType || '-';
}

export function buildSalePayload(formData: SaleFormData) {
  const expenseLines = formData.expenses
    .map((line) => {
      const amount = parseOptionalNumber(line.amount);
      return {
        type: line.type.trim(),
        amount: amount ?? 0,
        note: line.note.trim() ? line.note.trim() : null,
      };
    })
    .filter((line) => line.type || line.amount > 0 || line.note);

  const expenseCost = expenseLines.reduce((sum, line) => sum + line.amount, 0);
  const firstType = expenseLines.find((l) => l.type)?.type || null;
  const notes = expenseLines
    .map((l) => l.note)
    .filter(Boolean)
    .join('; ');

  const expenseType =
    expenseLines.length > 1 && firstType
      ? `${firstType} (+${expenseLines.length - 1})`
      : firstType;

  return {
    date: formData.date,
    destinationCompanyId: formData.destinationCompanyId,
    companyName: formData.companyName.trim(),
    productTypeId: formData.productTypeId,
    weight: parseRequiredNumber(formData.weight),
    rubberPercent: formData.rubberPercent === '' ? null : parseFloat(formData.rubberPercent),
    pricePerUnit: parseRequiredNumber(formData.pricePerUnit),
    expenses: expenseLines,
    expenseType,
    expenseCost: expenseCost > 0 ? expenseCost : null,
    notes: notes || null,
    sellingType: formData.sellingType,
  };
}
