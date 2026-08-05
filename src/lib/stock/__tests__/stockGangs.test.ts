import { describe, it, expect } from 'vitest';
import { parseSaleNosJson, splitLedgerIntoGangs } from '../stockGangs';

function dt(iso: string) {
  return new Date(iso);
}

describe('splitLedgerIntoGangs', () => {
  it('splits one closed gang and accumulates SALE cogs/soldKg', () => {
    const gangs = splitLedgerIntoGangs('pt-1', [
      {
        refType: 'PURCHASE',
        refNo: 'PUR-1',
        qtyChangeKg: 100,
        totalCost: 1000,
        balanceQtyKg: 100,
        date: dt('2026-07-01'),
      },
      {
        refType: 'SALE',
        refNo: 'SAL-1',
        qtyChangeKg: -40,
        totalCost: 200,
        balanceQtyKg: 60,
        date: dt('2026-07-02'),
      },
      {
        refType: 'SALE',
        refNo: 'SAL-2',
        qtyChangeKg: -60,
        totalCost: 300,
        balanceQtyKg: 0,
        date: dt('2026-07-03'),
      },
    ]);

    expect(gangs).toHaveLength(1);
    expect(gangs[0]).toMatchObject({
      productTypeId: 'pt-1',
      gangNo: 1,
      soldKg: 100,
      cogs: 500,
      salesCount: 2,
      endDate: dt('2026-07-03'),
    });
    expect(gangs[0]!.saleNos).toEqual(['SAL-1', 'SAL-2']);
  });

  it('creates multiple gangs in chronological order', () => {
    const gangs = splitLedgerIntoGangs('pt-1', [
      {
        refType: 'PURCHASE',
        refNo: 'PUR-1',
        qtyChangeKg: 100,
        totalCost: 1000,
        balanceQtyKg: 100,
        date: dt('2026-07-01'),
      },
      {
        refType: 'SALE',
        refNo: 'SAL-1',
        qtyChangeKg: -100,
        totalCost: 400,
        balanceQtyKg: 0,
        date: dt('2026-07-02'),
      },
      {
        refType: 'PURCHASE',
        refNo: 'PUR-2',
        qtyChangeKg: 50,
        totalCost: 500,
        balanceQtyKg: 50,
        date: dt('2026-07-05'),
      },
      {
        refType: 'SALE',
        refNo: 'SAL-2',
        qtyChangeKg: -50,
        totalCost: 250,
        balanceQtyKg: 0,
        date: dt('2026-07-06'),
      },
    ]);

    expect(gangs.map((g) => g.gangNo)).toEqual([1, 2]);
    expect(gangs[1]!.soldKg).toBe(50);
    expect(gangs[1]!.cogs).toBe(250);
  });
});

describe('parseSaleNosJson', () => {
  it('parses valid arrays and ignores bad input', () => {
    expect(parseSaleNosJson('["A","B"]')).toEqual(['A', 'B']);
    expect(parseSaleNosJson('not-json')).toEqual([]);
    expect(parseSaleNosJson(null)).toEqual([]);
  });
});
