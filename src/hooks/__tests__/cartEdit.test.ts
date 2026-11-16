import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCart } from '../useCart';
import { usePurchaseForm } from '../usePurchaseForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/useAlert', () => ({
  useAlert: () => ({ showWarning: vi.fn() }),
}));

const members = [
  { id: 'member-1', code: 'M001', name: 'Member One', ownerPercent: 100, tapperPercent: 0 },
];
const productTypes = [{ id: 'product-1', code: 'PT001', name: 'น้ำยางสด' }];

const purchaseForm = {
  date: '2026-11-11',
  memberId: 'member-1',
  productTypeId: 'product-1',
  grossWeight: '100',
  containerWeight: '5',
  netWeight: '95',
  pricePerUnit: '50',
  moisturePercent: '0',
  moistureUnit: 'kg' as const,
  bonusPrice: '',
  notes: '',
};

describe('cart item editing', () => {
  beforeEach(() => {
    let now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      now += 1;
      return now;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => [] }) as Response)
    );
  });

  it('replaces the selected purchase line and leaves the other lines in place', () => {
    const { result } = renderHook(() =>
      useCart({ members, productTypes, user: { id: 'user-1' }, loadPurchases: vi.fn() })
    );

    act(() => {
      result.current.addToCart(purchaseForm);
      result.current.addToCart({ ...purchaseForm, grossWeight: '80', containerWeight: '0', netWeight: '80' });
    });

    const [first, second] = result.current.cart;
    act(() => {
      result.current.updateCartItem(first.id, {
        ...purchaseForm,
        grossWeight: '120',
        containerWeight: '10',
        netWeight: '110',
        pricePerUnit: '40',
      });
    });

    expect(result.current.cart).toHaveLength(2);
    expect(result.current.cart[0]).toMatchObject({
      id: first.id,
      grossWeight: 120,
      containerWeight: 10,
      netWeight: 110,
      pricePerUnit: 40,
      totalAmount: 4400,
    });
    expect(result.current.cart[1].id).toBe(second.id);
    expect(result.current.cart[1].grossWeight).toBe(80);
  });

  it('loads a cart purchase back into the entry form', async () => {
    const { result } = renderHook(() => usePurchaseForm({ members, productTypes }));

    await act(async () => {
      result.current.loadCartItem({
        date: '2026-11-01',
        memberId: 'member-1',
        productTypeId: 'product-1',
        grossWeight: 100,
        containerWeight: 5,
        pricePerUnit: 40,
        moisturePercent: 2,
        moistureUnit: 'kg',
        bonusPrice: 0,
        notes: 'เช้า',
      });
      await Promise.resolve();
    });

    expect(result.current.memberSearchTerm).toBe('M001 - Member One');
    expect(result.current.productTypeSearchTerm).toBe('PT001 - น้ำยางสด');
    expect(result.current.selectedMember?.id).toBe('member-1');
    expect(result.current.formData).toMatchObject({
      date: '2026-11-01',
      memberId: 'member-1',
      productTypeId: 'product-1',
      grossWeight: '100',
      containerWeight: '5',
      pricePerUnit: '40',
      moisturePercent: '2',
      moistureUnit: 'kg',
      notes: 'เช้า',
      netWeight: '93.00',
    });
    expect(result.current.isFormValid()).toBe(true);
  });
});
