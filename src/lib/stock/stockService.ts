/* eslint-disable @typescript-eslint/no-explicit-any */

const EPS = 1e-6;

export class StockInsufficientError extends Error {
  constructor(
    message: string,
    public readonly productTypeId: string,
    public readonly availableKg: number,
    public readonly requestedKg: number,
  ) {
    super(message);
    this.name = 'StockInsufficientError';
  }
}

type StockPositionLike = {
  quantityKg: number;
  avgCostPerKg: number;
};

export async function applyPurchaseToStock(
  tx: any,
  input: {
    productTypeId: string;
    qtyKg: number;
    unitCostPerKg: number;
    refNo: string;
    date: Date;
    notes?: string | null;
  },
) {
  const { productTypeId, qtyKg, unitCostPerKg, refNo, date, notes } = input;

  if (!Number.isFinite(qtyKg) || qtyKg < 0) return;
  if (!Number.isFinite(unitCostPerKg) || unitCostPerKg < 0) {
    // Allow 0 cost if you really want, but keep it safe.
  }

  const existing = (await tx.stockPosition.findUnique({
    where: { productTypeId },
  })) as StockPositionLike | null;

  const pos: StockPositionLike =
    existing ??
    ((await tx.stockPosition.create({
      data: { productTypeId, quantityKg: 0, avgCostPerKg: 0 },
    })) as StockPositionLike);

  const oldQty = Number(pos.quantityKg) || 0;
  const oldAvg = Number(pos.avgCostPerKg) || 0;
  const newQty = oldQty + qtyKg;

  const newAvg =
    newQty <= EPS ? 0 : (oldQty * oldAvg + qtyKg * unitCostPerKg) / newQty;

  await tx.stockPosition.update({
    where: { productTypeId },
    data: { quantityKg: newQty, avgCostPerKg: newAvg },
  });

  await tx.stockLedgerEntry.create({
    data: {
      productTypeId,
      refType: 'PURCHASE',
      refNo,
      qtyChangeKg: qtyKg,
      unitCostPerKg: unitCostPerKg,
      totalCost: qtyKg * unitCostPerKg,
      balanceQtyKg: newQty,
      balanceAvgCostPerKg: newAvg,
      date,
      notes: notes ?? undefined,
    },
  });
}

export async function applySaleToStock(
  tx: any,
  input: {
    productTypeId: string;
    qtyKg: number;
    refNo: string;
    date: Date;
    notes?: string | null;
  },
) {
  const { productTypeId, qtyKg, refNo, date, notes } = input;

  if (!Number.isFinite(qtyKg) || qtyKg < 0) return;

  const pos = (await tx.stockPosition.findUnique({
    where: { productTypeId },
  })) as StockPositionLike | null;

  const availableKg = Number(pos?.quantityKg ?? 0);
  const avgCostPerKg = Number(pos?.avgCostPerKg ?? 0);

  if (availableKg - qtyKg < -EPS) {
    throw new StockInsufficientError(
      `Insufficient stock for productTypeId=${productTypeId}`,
      productTypeId,
      availableKg,
      qtyKg,
    );
  }

  const newQty = Math.max(0, availableKg - qtyKg);
  const newAvg = newQty <= EPS ? 0 : avgCostPerKg;

  await tx.stockPosition.update({
    where: { productTypeId },
    data: { quantityKg: newQty, avgCostPerKg: newAvg },
  });

  await tx.stockLedgerEntry.create({
    data: {
      productTypeId,
      refType: 'SALE',
      refNo,
      qtyChangeKg: -qtyKg,
      unitCostPerKg: avgCostPerKg,
      totalCost: qtyKg * avgCostPerKg,
      balanceQtyKg: newQty,
      balanceAvgCostPerKg: newAvg,
      date,
      notes: notes ?? undefined,
    },
  });
}

