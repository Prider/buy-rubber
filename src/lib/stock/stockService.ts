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
    /** Purchase row id — links ledger line to a single purchase for safe delete/edit */
    refId?: string | null;
  },
) {
  const { productTypeId, qtyKg, unitCostPerKg, refNo, date, notes, refId } = input;

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
      refId: refId ?? null,
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

/** Restore quantity and average cost when a sale is deleted (inverse of applySaleToStock). */
export async function reverseSaleFromStock(
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

  if (!Number.isFinite(qtyKg) || qtyKg <= 0) return;

  const saleEntry = (await tx.stockLedgerEntry.findFirst({
    where: { productTypeId, refType: 'SALE', refNo },
    orderBy: { createdAt: 'desc' },
  })) as { id: string; unitCostPerKg: number | null } | null;

  const pos = (await tx.stockPosition.findUnique({
    where: { productTypeId },
  })) as StockPositionLike | null;

  const existingQty = Number(pos?.quantityKg ?? 0);
  const existingAvg = Number(pos?.avgCostPerKg ?? 0);

  let unitCostPerKg = existingAvg;
  if (saleEntry?.unitCostPerKg != null && Number.isFinite(Number(saleEntry.unitCostPerKg))) {
    unitCostPerKg = Number(saleEntry.unitCostPerKg);
  }

  const newQty = existingQty + qtyKg;
  const newAvg =
    newQty <= EPS ? 0 : (existingQty * existingAvg + qtyKg * unitCostPerKg) / newQty;

  if (!pos) {
    await tx.stockPosition.create({
      data: { productTypeId, quantityKg: newQty, avgCostPerKg: newAvg },
    });
  } else {
    await tx.stockPosition.update({
      where: { productTypeId },
      data: { quantityKg: newQty, avgCostPerKg: newAvg },
    });
  }

  await tx.stockLedgerEntry.deleteMany({
    where: { productTypeId, refType: 'SALE', refNo },
  });

  await tx.stockLedgerEntry.create({
    data: {
      productTypeId,
      refType: 'SALE_DELETE',
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

/**
 * Remove purchase quantity from stock and ledger (inverse of applyPurchaseToStock).
 * Prefers ledger rows linked via refId = purchase id; otherwise matches PURCHASE + refNo (+ qty).
 */
export async function reversePurchaseFromStock(
  tx: any,
  input: {
    purchaseId: string;
    productTypeId: string;
    purchaseNo: string;
    netWeight: number;
    /** Usually purchase.finalPrice — used when no ledger match */
    unitCostPerKg: number;
    date: Date;
    notes?: string | null;
  },
) {
  const { purchaseId, productTypeId, purchaseNo, netWeight, unitCostPerKg, date, notes } = input;

  if (!Number.isFinite(netWeight) || netWeight <= 0) return;

  let purchaseEntry = (await tx.stockLedgerEntry.findFirst({
    where: { productTypeId, refType: 'PURCHASE', refId: purchaseId },
    orderBy: { createdAt: 'desc' },
  })) as { id: string; qtyChangeKg: number; unitCostPerKg: number | null } | null;

  if (!purchaseEntry) {
    purchaseEntry = (await tx.stockLedgerEntry.findFirst({
      where: {
        productTypeId,
        refType: 'PURCHASE',
        refNo: purchaseNo,
        qtyChangeKg: netWeight,
      },
      orderBy: { createdAt: 'desc' },
    })) as { id: string; qtyChangeKg: number; unitCostPerKg: number | null } | null;
  }

  if (!purchaseEntry) {
    purchaseEntry = (await tx.stockLedgerEntry.findFirst({
      where: { productTypeId, refType: 'PURCHASE', refNo: purchaseNo },
      orderBy: { createdAt: 'asc' },
    })) as { id: string; qtyChangeKg: number; unitCostPerKg: number | null } | null;
  }

  let q = Math.abs(Number(netWeight));
  if (purchaseEntry) {
    q = Math.abs(Number(purchaseEntry.qtyChangeKg));
  }

  let U = Number(unitCostPerKg);
  if (purchaseEntry?.unitCostPerKg != null && Number.isFinite(Number(purchaseEntry.unitCostPerKg))) {
    U = Number(purchaseEntry.unitCostPerKg);
  }

  const pos = (await tx.stockPosition.findUnique({
    where: { productTypeId },
  })) as StockPositionLike | null;

  const existingQty = Number(pos?.quantityKg ?? 0);
  const existingAvg = Number(pos?.avgCostPerKg ?? 0);

  if (!purchaseEntry) {
    q = Math.abs(Number(netWeight));
    U = Number(unitCostPerKg);
    if (!pos || q < EPS) {
      return;
    }
  }

  if (existingQty - q < -EPS) {
    throw new StockInsufficientError(
      `Insufficient stock to remove purchase layer for productTypeId=${productTypeId}`,
      productTypeId,
      existingQty,
      q,
    );
  }

  const newQty = Math.max(0, existingQty - q);
  const newAvg = newQty <= EPS ? 0 : (existingQty * existingAvg - q * U) / newQty;

  if (pos) {
    await tx.stockPosition.update({
      where: { productTypeId },
      data: { quantityKg: newQty, avgCostPerKg: newAvg },
    });
  } else if (newQty > EPS) {
    await tx.stockPosition.create({
      data: { productTypeId, quantityKg: newQty, avgCostPerKg: newAvg },
    });
  }

  if (purchaseEntry) {
    await tx.stockLedgerEntry.delete({ where: { id: purchaseEntry.id } });
  }

  await tx.stockLedgerEntry.create({
    data: {
      productTypeId,
      refType: 'PURCHASE_DELETE',
      refNo: purchaseNo,
      refId: purchaseId,
      qtyChangeKg: -q,
      unitCostPerKg: U,
      totalCost: q * U,
      balanceQtyKg: newQty,
      balanceAvgCostPerKg: newAvg,
      date,
      notes: notes ?? undefined,
    },
  });
}

