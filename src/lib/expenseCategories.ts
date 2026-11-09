export interface ExpenseCategoryRecord {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const MAX_NAME_LENGTH = 80;

export const DEFAULT_EXPENSE_CATEGORY_NAMES = ['ค่าน้ำมัน', 'ค่าซ่อมรถ', 'ค่าคนงาน', 'อื่นๆ'] as const;

export const EXPENSE_CATEGORIES_INITIALIZED_KEY = 'expenseCategoriesInitialized';

export function normalizeExpenseCategoryName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
}

export function expenseCategoryNameError(name: string): string | null {
  if (!name) {
    return 'กรุณาระบุชื่อประเภทค่าใช้จ่าย';
  }
  if (name.length > MAX_NAME_LENGTH) {
    return 'ชื่อประเภทยาวเกินไป';
  }
  return null;
}

export function findDuplicateExpenseCategoryName(
  categories: Array<{ id: string; name: string }>,
  name: string,
  ignoreId?: string,
): { id: string; name: string } | undefined {
  const normalized = name.trim().toLowerCase();
  return categories.find(
    (category) =>
      category.id !== ignoreId && category.name.trim().toLowerCase() === normalized,
  );
}

export function mergeExpenseCategoryNames(existingNames: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const push = (raw: string) => {
    const name = normalizeExpenseCategoryName(raw);
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(name);
  };

  for (const name of DEFAULT_EXPENSE_CATEGORY_NAMES) {
    push(name);
  }
  for (const name of existingNames) {
    push(name);
  }

  return ordered;
}
