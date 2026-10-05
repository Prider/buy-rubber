export const ACTIVITY_LOG_RETENTION_DAYS = 90;

export const ACTIVITY_ACTIONS = ['create', 'update', 'delete'] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_ENTITY_TYPES = [
  'purchase',
  'sale',
  'member',
  'destinationCompany',
  'productType',
  'expense',
  'serviceFee',
  'reportGroup',
  'user',
] as const;

export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  create: 'สร้าง',
  update: 'แก้ไข',
  delete: 'ลบ',
};

export const ACTIVITY_ENTITY_LABELS: Record<ActivityEntityType, string> = {
  purchase: 'รับซื้อ',
  sale: 'ขาย',
  member: 'สมาชิก',
  destinationCompany: 'บริษัทปลายทาง',
  productType: 'ประเภทสินค้า',
  expense: 'ค่าใช้จ่าย',
  serviceFee: 'ค่าบริการ',
  reportGroup: 'กลุ่มรายงาน',
  user: 'ผู้ใช้งาน',
};

export const ACTIVITY_FIELD_LABELS: Record<string, string> = {
  date: 'วันที่',
  memberId: 'สมาชิก',
  productTypeId: 'ประเภทสินค้า',
  productTypeIds: 'ประเภทสินค้าในกลุ่ม',
  grossWeight: 'น้ำหนักรวม',
  containerWeight: 'น้ำหนักภาชนะ',
  netWeight: 'น้ำหนักสุทธิ',
  rubberPercent: '%ยาง',
  dryWeight: 'น้ำหนักแห้ง',
  basePrice: 'ราคาพื้นฐาน',
  adjustedPrice: 'ราคาหลังปรับ',
  bonusPrice: 'ราคาบวก',
  finalPrice: 'ราคาสุดท้าย',
  totalAmount: 'ยอดเงิน',
  ownerAmount: 'เงินเจ้าของสวน',
  tapperAmount: 'เงินคนตัด',
  notes: 'หมายเหตุ',
  isPaid: 'จ่ายแล้ว',
  name: 'ชื่อ',
  code: 'รหัส',
  idCard: 'เลขบัตร',
  phone: 'โทรศัพท์',
  address: 'ที่อยู่',
  bankAccount: 'เลขบัญชี',
  bankName: 'ธนาคาร',
  ownerPercent: '%เจ้าของสวน',
  tapperPercent: '%คนตัด',
  tapperId: 'รหัสคนตัด',
  tapperName: 'ชื่อคนตัด',
  isActive: 'ใช้งานอยู่',
  description: 'รายละเอียด',
  companyName: 'บริษัท',
  destinationCompanyId: 'บริษัทปลายทาง',
  weight: 'น้ำหนัก',
  pricePerUnit: 'ราคาต่อหน่วย',
  expenseCost: 'ค่าใช้จ่าย',
  expenseSummary: 'รายการค่าใช้จ่าย',
  sellingType: 'รูปแบบการขาย',
  category: 'ประเภท',
  amount: 'จำนวนเงิน',
  expenseNo: 'เลขที่ค่าใช้จ่าย',
  serviceFeeNo: 'เลขที่ค่าบริการ',
  purchaseNo: 'เลขที่รับซื้อ',
  saleNo: 'เลขที่ขาย',
  username: 'ชื่อผู้ใช้',
  role: 'สิทธิ์',
  password: 'รหัสผ่าน',
  sortOrder: 'ลำดับ',
  prices: 'ราคา',
  soft: 'ปิดการใช้งาน',
};

export type FieldChange = { from: unknown; to: unknown };

export function isFieldChange(value: unknown): value is FieldChange {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'from' in value &&
    'to' in value
  );
}

function sameValue(left: unknown, right: unknown): boolean {
  if (left instanceof Date || right instanceof Date) {
    const leftTime = left instanceof Date ? left.getTime() : Date.parse(String(left));
    const rightTime = right instanceof Date ? right.getTime() : Date.parse(String(right));
    if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime)) {
      return leftTime === rightTime;
    }
  }

  if (typeof left === 'number' || typeof right === 'number') {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return Math.abs(leftNumber - rightNumber) < 1e-6;
    }
  }

  const normalizedLeft = left === undefined || left === null ? '' : left;
  const normalizedRight = right === undefined || right === null ? '' : right;
  return String(normalizedLeft) === String(normalizedRight);
}

/** Returns changed keys only. Empty result means the edit should not be logged. */
export function diffFields(
  before: object,
  after: object,
  keys: string[],
): Record<string, FieldChange> | null {
  const previous = before as Record<string, unknown>;
  const next = after as Record<string, unknown>;
  const changes: Record<string, FieldChange> = {};

  for (const key of keys) {
    if (!sameValue(previous[key], next[key])) {
      changes[key] = {
        from: previous[key] ?? null,
        to: next[key] ?? null,
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

export function activityRetentionCutoff(now = new Date()): Date {
  return new Date(now.getTime() - ACTIVITY_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}
