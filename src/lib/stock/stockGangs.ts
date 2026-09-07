/**
 * Materialized stock "gangs" (กอง): balance cycles 0 → >0 → 0.
 * Kept in sync on purchase/sale writes; rebuilt from ledger after reverses / backfill.
 */
const EPS = 1e-6;

export type StockGangRow = {
  id: string;
  productTypeId: string;
  gangNo: number;
  startDate: Date;
  endDate: Date | null;
  soldKg: number;
  cogs: number;
  saleNosJson: string;
  salesCount: number;
};

export type StockGangDraft = {
  productTypeId: string;
  gangNo: number;
  startDate: Date;
  endDate: Date | null;
  soldKg: number;
  cogs: number;
  saleNos: string[];
  salesCount: number;
};

type LedgerRow = {
  refType: string;
  refNo: string | null;
  qtyChangeKg: number;
  totalCost: number | null;
  balanceQtyKg: number;
  date: Date;
};

/** Pure split used by rebuild and tests — mirrors previous /api/stock/gangs logic. */
export function splitLedgerIntoGangs(
  productTypeId: string,
  entries: LedgerRow[],
): StockGangDraft[] {
  const gangsChrono: StockGangDraft[] = [];
  let prevBalance = 0;
  let inGang = false;
  let gangCounter = 0;

  for (const e of entries) {
    const currBalance = Number(e.balanceQtyKg) || 0;
    const entering = !inGang && prevBalance <= EPS && currBalance > EPS;
    if (entering) {
      inGang = true;
      gangCounter += 1;
      gangsChrono.push({
        productTypeId,
        gangNo: gangCounter,
        startDate: e.date,
        endDate: null,
        soldKg: 0,
        cogs: 0,
        saleNos: [],
        salesCount: 0,
      });
    }

    if (inGang && e.refType === 'SALE' && e.refNo) {
      const cogsAdd =
        e.totalCost != null && Number.isFinite(Number(e.totalCost)) ? Number(e.totalCost) : 0;
      const soldKgAdd = Number(e.qtyChangeKg) < 0 ? -Number(e.qtyChangeKg) : Number(e.qtyChangeKg);
      const last = gangsChrono[gangsChrono.length - 1]!;
      last.cogs += cogsAdd;
      last.soldKg += soldKgAdd;
      if (!last.saleNos.includes(e.refNo)) {
        last.saleNos.push(e.refNo);
      }
      last.salesCount = last.saleNos.length;
    }

    const leaving = inGang && prevBalance > EPS && currBalance <= EPS;
    if (leaving) {
      const last = gangsChrono[gangsChrono.length - 1]!;
      last.endDate = e.date;
      inGang = false;
    }

    prevBalance = currBalance;
  }

  return gangsChrono;
}

export function parseSaleNosJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
  } catch {
    return [];
  }
}

/** Open a new gang when stock leaves zero (purchase / restore). */
export async function openStockGangIfNeeded(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  input: { productTypeId: string; prevQtyKg: number; nextQtyKg: number; date: Date },
) {
  const { productTypeId, prevQtyKg, nextQtyKg, date } = input;
  if (!(prevQtyKg <= EPS && nextQtyKg > EPS)) return;

  const last = (await tx.stockGang.findFirst({
    where: { productTypeId },
    orderBy: { gangNo: 'desc' },
    select: { gangNo: true },
  })) as { gangNo: number } | null;

  await tx.stockGang.create({
    data: {
      productTypeId,
      gangNo: (last?.gangNo ?? 0) + 1,
      startDate: date,
      endDate: null,
      soldKg: 0,
      cogs: 0,
      saleNosJson: '[]',
      salesCount: 0,
    },
  });
}

/** Accumulate SALE into the open gang; close when balance returns to zero. */
export async function applySaleToOpenStockGang(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  input: {
    productTypeId: string;
    nextQtyKg: number;
    date: Date;
    saleNo: string;
    soldKg: number;
    cogs: number;
  },
) {
  const { productTypeId, nextQtyKg, date, saleNo, soldKg, cogs } = input;

  let open = (await tx.stockGang.findFirst({
    where: { productTypeId, endDate: null },
    orderBy: { gangNo: 'desc' },
  })) as StockGangRow | null;

  // Stock existed but no open row (e.g. table empty after migrate) — start one.
  if (!open) {
    const last = (await tx.stockGang.findFirst({
      where: { productTypeId },
      orderBy: { gangNo: 'desc' },
      select: { gangNo: true },
    })) as { gangNo: number } | null;

    open = (await tx.stockGang.create({
      data: {
        productTypeId,
        gangNo: (last?.gangNo ?? 0) + 1,
        startDate: date,
        endDate: null,
        soldKg: 0,
        cogs: 0,
        saleNosJson: '[]',
        salesCount: 0,
      },
    })) as StockGangRow;
  }

  const saleNos = parseSaleNosJson(open.saleNosJson);
  if (!saleNos.includes(saleNo)) {
    saleNos.push(saleNo);
  }

  const closed = nextQtyKg <= EPS;
  await tx.stockGang.update({
    where: { id: open.id },
    data: {
      soldKg: Number(open.soldKg) + soldKg,
      cogs: Number(open.cogs) + cogs,
      saleNosJson: JSON.stringify(saleNos),
      salesCount: saleNos.length,
      endDate: closed ? date : null,
    },
  });
}

/**
 * Rebuild StockGang rows for one product (or all) from ledger.
 * Used after reverse purchase/sale and for backfill / rebuildStock.
 */
export async function rebuildStockGangs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  productTypeId?: string,
): Promise<{ productTypes: number; gangs: number }> {
  if (productTypeId) {
    await db.stockGang.deleteMany({ where: { productTypeId } });
  } else {
    await db.stockGang.deleteMany({});
  }

  const productTypeIds: string[] = productTypeId
    ? [productTypeId]
    : (
        (await db.stockLedgerEntry.findMany({
          distinct: ['productTypeId'],
          select: { productTypeId: true },
        })) as Array<{ productTypeId: string }>
      ).map((r) => r.productTypeId);

  let gangs = 0;

  for (const ptId of productTypeIds) {
    const entries = (await db.stockLedgerEntry.findMany({
      where: { productTypeId: ptId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: {
        refType: true,
        refNo: true,
        qtyChangeKg: true,
        totalCost: true,
        balanceQtyKg: true,
        date: true,
      },
    })) as LedgerRow[];

    const drafts = splitLedgerIntoGangs(ptId, entries);
    if (drafts.length === 0) continue;

    const BATCH = 500;
    for (let i = 0; i < drafts.length; i += BATCH) {
      const chunk = drafts.slice(i, i + BATCH);
      await db.stockGang.createMany({
        data: chunk.map((g) => ({
          productTypeId: g.productTypeId,
          gangNo: g.gangNo,
          startDate: g.startDate,
          endDate: g.endDate,
          soldKg: g.soldKg,
          cogs: g.cogs,
          saleNosJson: JSON.stringify(g.saleNos),
          salesCount: g.salesCount,
        })),
      });
    }
    gangs += drafts.length;
  }

  return { productTypes: productTypeIds.length, gangs };
}
