export interface SellingTypeRecord {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const MAX_NAME_LENGTH = 80;

export const DEFAULT_SELLING_TYPE_NAMES = ['จ่ายสด', 'ขายล่วง', 'ฝาก'] as const;

export const SELLING_TYPES_INITIALIZED_KEY = 'sellingTypesInitialized';

export function normalizeSellingTypeName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
}

export function sellingTypeNameError(name: string): string | null {
  if (!name) {
    return 'กรุณาระบุชื่อรูปแบบการขาย';
  }
  if (name.length > MAX_NAME_LENGTH) {
    return 'ชื่อรูปแบบการขายยาวเกินไป';
  }
  return null;
}

export function findDuplicateSellingTypeName(
  types: Array<{ id: string; name: string }>,
  name: string,
  ignoreId?: string,
): { id: string; name: string } | undefined {
  const normalized = name.trim().toLowerCase();
  return types.find(
    (type) => type.id !== ignoreId && type.name.trim().toLowerCase() === normalized,
  );
}

export function mergeSellingTypeNames(existingNames: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const push = (raw: string) => {
    const name = normalizeSellingTypeName(raw);
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(name);
  };

  for (const name of DEFAULT_SELLING_TYPE_NAMES) {
    push(name);
  }
  for (const name of existingNames) {
    push(name);
  }

  return ordered;
}
