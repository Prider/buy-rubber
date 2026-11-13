import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PurchasesPage from '../page';

const mockPush = vi.fn();
const mockLoadData = vi.fn();
const mockLoadPurchases = vi.fn();
const mockAddToCart = vi.fn();
const mockSaveCartToDb = vi.fn();

type PurchaseFormInput = {
  date?: string;
  memberId?: string;
  productTypeId?: string;
  grossWeight?: string;
  containerWeight?: string;
  netWeight?: string;
  pricePerUnit?: string;
  moisturePercent?: string;
  moistureUnit?: string;
  bonusPrice?: string;
  notes?: string;
};

type MockCartItem = PurchaseFormInput & { id: string };

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', username: 'tester', role: 'USER' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePurchaseData', () => ({
  usePurchaseData: () => {
    return {
      loading: false,
      members: [
        { id: 'member-1', code: 'M001', name: 'Member One', ownerPercent: 100, tapperPercent: 0 },
      ],
      productTypes: [{ id: 'product-1', code: 'PT001', name: 'น้ำยางสด' }],
      loadData: mockLoadData,
      loadPurchases: mockLoadPurchases,
    };
  },
}));

vi.mock('@/hooks/useExpenseForm', () => ({
  useExpenseForm: () => ({
    formData: { category: '', amount: '' },
    error: '',
    setError: vi.fn(),
    handleInputChange: vi.fn(),
    isFormValid: () => false,
    resetForm: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: () => {
    const [cart, setCart] = React.useState<MockCartItem[]>([]);
    const addToCart = (formData: PurchaseFormInput) => {
      mockAddToCart(formData);
      setCart((prev) => [...prev, { id: `${prev.length + 1}`, ...formData }]);
    };
    const saveCartToDb = vi.fn(async () => {
      mockSaveCartToDb(cart);
      setCart([]);
    });
    return {
      cart,
      submitting: false,
      error: '',
      setError: vi.fn(),
      addToCart,
      addServiceFeeToCart: vi.fn(),
      removeFromCart: vi.fn(),
      saveCartToDb,
      printCart: vi.fn(),
      previewCart: vi.fn(),
      downloadPDF: vi.fn(),
      totalAmount: 0,
      clearCart: vi.fn(() => setCart([])),
    };
  },
}));

vi.mock('@/components/purchases/PurchasesList', () => {
  const PurchasesList = React.forwardRef(function PurchasesList() {
    return <div>ประวัติการรับซื้อทั้งหมด</div>;
  });
  return { PurchasesList };
});

vi.mock('@/components/purchases/CartTable', () => ({
  CartTable: ({
    cart,
    saveCartToDb,
    onRecordPurchase,
  }: {
    cart: MockCartItem[];
    saveCartToDb: () => Promise<void>;
    onRecordPurchase?: () => void;
  }) => (
    <div data-testid="cart-table">
      <button type="button" onClick={onRecordPurchase}>
        บันทึกการรับซื้อ
      </button>
      <p>cart-count:{cart.length}</p>
      <button type="button" onClick={saveCartToDb}>
        บันทึกตะกร้า
      </button>
    </div>
  ),
}));

vi.mock('@/components/purchases/ServiceFeeCard', () => ({
  ServiceFeeCard: () => <div data-testid="service-fee-card">service-fee-card</div>,
}));

describe('PurchasesPage UI integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ({
          ok: true,
          json: async () => [],
        }) as Response
      )
    );
  });

  const openPurchaseEntry = async (user: ReturnType<typeof userEvent.setup>) => {
    if (screen.queryByPlaceholderText('ค้นหาสมาชิกตามชื่อหรือรหัส')) {
      return;
    }
    await user.click(screen.getAllByRole('button', { name: 'บันทึกการรับซื้อ' })[0]);
  };

  const fillValidPurchaseForm = async (user: ReturnType<typeof userEvent.setup>, gross: string, container: string) => {
    await openPurchaseEntry(user);
    const memberSearch = screen.getByPlaceholderText('ค้นหาสมาชิกตามชื่อหรือรหัส');
    await user.click(memberSearch);
    await user.clear(memberSearch);
    await user.type(memberSearch, 'M001');
    await user.click(screen.getByRole('button', { name: /M001 - Member One/i }));

    const productSearch = screen.getByPlaceholderText('ค้นหาตามชื่อหรือรหัส...');
    await user.click(productSearch);
    await user.clear(productSearch);
    await user.type(productSearch, 'PT001');
    await user.click(screen.getByRole('button', { name: /PT001 - น้ำยางสด/i }));

    const grossWeightInput = document.querySelector('input[name="grossWeight"]') as HTMLInputElement;
    const containerWeightInput = document.querySelector('input[name="containerWeight"]') as HTMLInputElement;

    await user.clear(grossWeightInput);
    await user.type(grossWeightInput, gross);
    await user.clear(containerWeightInput);
    await user.type(containerWeightInput, container);

    const priceInput = document.querySelector('input[name="pricePerUnit"]') as HTMLInputElement;
    await user.clear(priceInput);
    await user.type(priceInput, '50');
  };

  it('auto-calculates netWeight from gross minus container', async () => {
    render(<PurchasesPage />);
    const user = userEvent.setup();
    await openPurchaseEntry(user);

    const grossWeightInput = document.querySelector('input[name="grossWeight"]') as HTMLInputElement;
    const containerWeightInput = document.querySelector('input[name="containerWeight"]') as HTMLInputElement;
    const netWeightInput = document.querySelector('input[name="netWeight"]') as HTMLInputElement;

    await user.type(grossWeightInput, '100');
    await user.type(containerWeightInput, '5');

    await waitFor(() => {
      expect(netWeightInput.value).toBe('95.00');
    });
  });

  it('leaves unit price empty until the user enters it', async () => {
    render(<PurchasesPage />);
    const user = userEvent.setup();
    await openPurchaseEntry(user);

    const productSearch = screen.getByPlaceholderText('ค้นหาตามชื่อหรือรหัส...');
    await user.click(productSearch);
    await user.type(productSearch, 'PT001');
    await user.click(screen.getByRole('button', { name: /PT001 - น้ำยางสด/i }));

    const priceInput = document.querySelector('input[name="pricePerUnit"]') as HTMLInputElement;
    expect(priceInput.value).toBe('');
  });

  it('reduces the total by a moisture deduction in baht', async () => {
    render(<PurchasesPage />);
    const user = userEvent.setup();

    await fillValidPurchaseForm(user, '100', '0');
    await user.click(screen.getByRole('radio', { name: 'บาท' }));

    expect(screen.getByText('(น้ำหนักสุทธิ × ราคาต่อหน่วย) − หักความชื้น')).toBeInTheDocument();

    const total = document.querySelector('input[name="totalAmount"]') as HTMLInputElement;
    expect(total.value).toBe('5000.00');

    const moisture = document.querySelector('input[name="moisturePercent"]') as HTMLInputElement;
    await user.clear(moisture);
    await user.type(moisture, '10');

    await waitFor(() => {
      expect(total.value).toBe('4990.00');
    });
  });

  it('deducts moisture kilograms from net weight', async () => {
    render(<PurchasesPage />);
    const user = userEvent.setup();

    await fillValidPurchaseForm(user, '100', '0');
    await user.click(screen.getByRole('radio', { name: 'กก.' }));
    expect(screen.getByText('(น้ำหนักสุทธิ − หักความชื้น) × ราคาต่อหน่วย')).toBeInTheDocument();

    const moisture = document.querySelector('input[name="moisturePercent"]') as HTMLInputElement;
    await user.clear(moisture);
    await user.type(moisture, '2');

    const netWeight = document.querySelector('input[name="netWeight"]') as HTMLInputElement;
    const total = document.querySelector('input[name="totalAmount"]') as HTMLInputElement;
    await waitFor(() => {
      expect(netWeight.value).toBe('98.00');
      expect(total.value).toBe('4900.00');
    });
  });

  it('shows validation error when container weight is invalid', async () => {
    render(<PurchasesPage />);
    const user = userEvent.setup();
    await openPurchaseEntry(user);

    const grossWeightInput = document.querySelector('input[name="grossWeight"]') as HTMLInputElement;
    const containerWeightInput = document.querySelector('input[name="containerWeight"]') as HTMLInputElement;

    await user.type(grossWeightInput, '100');
    await user.type(containerWeightInput, '100');

    await waitFor(() => {
      expect(screen.getByText('น้ำหนักภาชนะต้องน้อยกว่าน้ำหนักรวมภาชนะ')).toBeInTheDocument();
    });
  });

  it('submits purchase item when form is valid', async () => {
    render(<PurchasesPage />);
    const user = userEvent.setup();

    await fillValidPurchaseForm(user, '100', '5');

    await user.click(screen.getByRole('button', { name: /เพิ่มลงตะกร้า/i }));

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledTimes(1);
      expect(mockAddToCart).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: 'member-1',
          productTypeId: 'product-1',
          grossWeight: '100',
          containerWeight: '5',
          netWeight: '95.00',
          pricePerUnit: '50',
        })
      );
    });
  });

  it('submits multi-item purchase transaction from UI cart', async () => {
    render(<PurchasesPage />);
    const user = userEvent.setup();

    await fillValidPurchaseForm(user, '100', '5');
    await user.click(screen.getByRole('button', { name: /เพิ่มลงตะกร้า/i }));

    await fillValidPurchaseForm(user, '120', '10');
    await user.click(screen.getByRole('button', { name: /เพิ่มลงตะกร้า/i }));

    await waitFor(() => {
      expect(screen.getByText('cart-count:2')).toBeInTheDocument();
      expect(mockAddToCart).toHaveBeenCalledTimes(2);
    });

    await user.click(screen.getByRole('button', { name: /บันทึกตะกร้า/i }));

    await waitFor(() => {
      expect(mockSaveCartToDb).toHaveBeenCalledTimes(1);
      expect(mockSaveCartToDb).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            grossWeight: '100',
            containerWeight: '5',
            netWeight: '95.00',
            pricePerUnit: '50',
          }),
          expect.objectContaining({
            grossWeight: '120',
            containerWeight: '10',
            netWeight: '110.00',
            pricePerUnit: '50',
          }),
        ])
      );
      expect(screen.getByText('cart-count:0')).toBeInTheDocument();
    });
  });

  it('closes the purchase entry after the cart is saved', async () => {
    render(<PurchasesPage />);
    const user = userEvent.setup();

    await openPurchaseEntry(user);
    expect(screen.getByPlaceholderText('ค้นหาสมาชิกตามชื่อหรือรหัส')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /บันทึกตะกร้า/i }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('ค้นหาสมาชิกตามชื่อหรือรหัส')).not.toBeInTheDocument();
    });
  });
});
