import { describe, expect, it } from 'vitest';
import { resolvePurchaseUnitPrice } from '../purchaseUnitPrice';

const today = '2026-09-26';

describe('resolvePurchaseUnitPrice', () => {
  it('uses the group price for the product type', () => {
    const price = resolvePurchaseUnitPrice({
      todayDate: today,
      groupId: 'group-1',
      productTypeId: 'rubber-1',
      memberGroups: [{ id: 'group-1', prices: [{ productTypeId: 'rubber-1', price: 45 }] }],
      dailyPrices: [{ productTypeId: 'rubber-1', date: today, price: 50 }],
    });
    expect(price).toBe('45');
  });

  it('falls back to today announced price when the group has no price for that type', () => {
    const price = resolvePurchaseUnitPrice({
      todayDate: today,
      groupId: 'group-1',
      productTypeId: 'rubber-2',
      memberGroups: [{ id: 'group-1', prices: [{ productTypeId: 'rubber-1', price: 45 }] }],
      dailyPrices: [{ productTypeId: 'rubber-2', date: today, price: 40 }],
    });
    expect(price).toBe('40');
  });

  it('uses the announced price when the member has no group', () => {
    const price = resolvePurchaseUnitPrice({
      todayDate: today,
      groupId: null,
      productTypeId: 'rubber-1',
      memberGroups: [],
      dailyPrices: [{ productTypeId: 'rubber-1', date: today, price: 50 }],
    });
    expect(price).toBe('50');
  });
});
