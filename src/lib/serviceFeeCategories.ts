export interface ServiceFeeCategoryRecord {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const MAX_NAME_LENGTH = 80;

export function normalizeServiceFeeCategoryName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
}

export function serviceFeeCategoryNameError(name: string): string | null {
  if (!name) {
    return 'กรุณาระบุชื่อประเภทค่าบริการ';
  }
  if (name.length > MAX_NAME_LENGTH) {
    return 'ชื่อประเภทยาวเกินไป';
  }
  return null;
}

export function findDuplicateServiceFeeCategoryName(
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
