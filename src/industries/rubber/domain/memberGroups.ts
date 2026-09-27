export interface MemberGroupPriceInput {
  productTypeId: string;
  price: number;
}

export function parseMemberGroupPrices(
  data: unknown,
): { prices: MemberGroupPriceInput[] } | { error: string } {
  if (data == null) return { prices: [] };
  if (!Array.isArray(data)) return { error: 'รูปแบบราคาของกลุ่มไม่ถูกต้อง' };

  const prices: MemberGroupPriceInput[] = [];
  const seen = new Set<string>();

  for (const item of data) {
    if (!item || typeof item !== 'object') {
      return { error: 'รูปแบบราคาของกลุ่มไม่ถูกต้อง' };
    }
    const record = item as { productTypeId?: unknown; price?: unknown };
    const productTypeId = String(record.productTypeId ?? '').trim();
    if (!productTypeId) continue;
    if (record.price === '' || record.price === null || record.price === undefined) continue;

    const price = Number(record.price);
    if (!Number.isFinite(price) || price < 0) {
      return { error: 'ราคาของกลุ่มต้องเป็นตัวเลขที่ไม่ติดลบ' };
    }
    if (seen.has(productTypeId)) continue;
    seen.add(productTypeId);
    prices.push({ productTypeId, price });
  }

  return { prices };
}
