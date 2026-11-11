export interface SaleExpenseTypeRecord {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const MAX_NAME_LENGTH = 80;

export const DEFAULT_SALE_EXPENSE_TYPE_NAMES = ['ค่าขนส่ง', 'ค่าแรง', 'ค่าบริการ', 'ภาษี', 'อื่นๆ'] as const;

export const SALE_EXPENSE_TYPES_INITIALIZED_KEY = 'saleExpenseTypesInitialized';

export function normalizeSaleExpenseTypeName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
}

export function saleExpenseTypeNameError(name: string): string | null {
  if (!name) {
    return 'กรุณาระบุชื่อชนิดค่าใช้จ่าย';
  }
  if (name.length > MAX_NAME_LENGTH) {
    return 'ชื่อชนิดค่าใช้จ่ายยาวเกินไป';
  }
  return null;
}

export function findDuplicateSaleExpenseTypeName(
  types: Array<{ id: string; name: string }>,
  name: string,
  ignoreId?: string,
): { id: string; name: string } | undefined {
  const normalized = name.trim().toLowerCase();
  return types.find(
    (type) => type.id !== ignoreId && type.name.trim().toLowerCase() === normalized,
  );
}

export function mergeSaleExpenseTypeNames(existingNames: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const push = (raw: string | null | undefined) => {
    const name = normalizeSaleExpenseTypeName(raw);
    if (!name || name.includes('(+')) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(name);
  };

  for (const name of DEFAULT_SALE_EXPENSE_TYPE_NAMES) {
    push(name);
  }
  for (const name of existingNames) {
    push(name);
  }

  return ordered;
}
