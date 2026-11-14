import { describe, expect, it } from 'vitest';
import { canEditPurchases } from '@/types/user';
import { buildPurchaseUpdateBody, purchaseToFormSource, toDateInputValue } from '../editPurchase';
import type { PurchaseLine } from '../types';

const purchase: PurchaseLine = {
  id: 'purchase-1',
  purchaseNo: 'PUR-001',
  date: '2026-11-14T02:30:00.000Z',
  memberId: 'member-1',
  productTypeId: 'product-1',
  member: { id: 'member-1', code: 'M001', name: 'สวนทดสอบ' },
  productType: { id: 'product-1', code: 'PT001', name: 'ยางก้อน' },
  grossWeight: 100,
  containerWeight: 5,
  netWeight: 95,
  basePrice: 50,
  bonusPrice: 1,
  rubberPercent: 32,
  moisturePercent: 2,
  moistureUnit: 'kg',
  notes: 'หมายเหตุ',
  finalPrice: 51,
  totalAmount: 4743,
};

describe('canEditPurchases', () => {
  it('allows the owner, the manager, and root', () => {
    expect(canEditPurchases('admin')).toBe(true);
    expect(canEditPurchases('user')).toBe(true);
    expect(canEditPurchases('root')).toBe(true);
  });

  it('blocks staff and accountant accounts', () => {
    expect(canEditPurchases('viewer')).toBe(false);
    expect(canEditPurchases('accountant')).toBe(false);
    expect(canEditPurchases(null)).toBe(false);
  });
});

describe('purchase edit payload', () => {
  it('keeps the original timestamp when the calendar date is unchanged', () => {
    const source = purchaseToFormSource(purchase);
    expect(source.date).toBe(toDateInputValue(purchase.date));
    expect(source.moistureUnit).toBe('kg');
    expect(source.pricePerUnit).toBe(50);

    const body = buildPurchaseUpdateBody(
      {
        date: source.date,
        memberId: source.memberId,
        productTypeId: source.productTypeId,
        grossWeight: '100',
        containerWeight: '5',
        netWeight: '93',
        pricePerUnit: '50',
        moisturePercent: '2',
        moistureUnit: source.moistureUnit,
        bonusPrice: '1',
        notes: 'หมายเหตุ',
      },
      purchase,
    );

    expect(body.date).toBe(purchase.date);
    expect(body.rubberPercent).toBe(32);
    expect(body.grossWeight).toBe(100);
    expect(body.memberId).toBe('member-1');
  });

  it('sends a new calendar date when the user changes it', () => {
    const source = purchaseToFormSource(purchase);
    const body = buildPurchaseUpdateBody(
      {
        date: '2026-11-01',
        memberId: source.memberId,
        productTypeId: source.productTypeId,
        grossWeight: '80',
        containerWeight: '0',
        netWeight: '80',
        pricePerUnit: '40',
        moisturePercent: '',
        moistureUnit: 'baht',
        bonusPrice: '',
        notes: '',
      },
      purchase,
    );

    expect(body.date).toBe('2026-11-01');
    expect(body.containerWeight).toBe(0);
    expect(body.moisturePercent).toBe(0);
    expect(body.bonusPrice).toBe(0);
  });

  it('treats a missing moisture unit as baht', () => {
    expect(purchaseToFormSource({ ...purchase, moistureUnit: null }).moistureUnit).toBe('baht');
  });
});
