import React, { useEffect, useRef } from 'react';
import { useAlert } from '@/hooks/useAlert';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface CartItem {
  id: string;
  type: 'purchase' | 'serviceFee';
  date: string;
  // Purchase fields
  memberId?: string;
  memberName?: string;
  memberCode?: string;
  productTypeId?: string;
  productTypeName?: string;
  productTypeCode?: string;
  grossWeight?: number; // น้ำหนักรวมภาชนะ
  containerWeight?: number; // น้ำหนักภาชนะ
  netWeight?: number; // น้ำหนักสุทธิ
  dryWeight?: number;
  pricePerUnit?: number;
  bonusPrice?: number;
  basePrice?: number;
  adjustedPrice?: number;
  finalPrice?: number;
  // service fee fields
  category?: string;
  amount?: number;
  description?: string;
  // Common fields
  totalAmount: number; // Positive for purchases, negative for service fees
  notes?: string;
}

function CartCell({
  label,
  wide = false,
  className,
  children,
}: {
  label: string;
  wide?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <td
      className={`${className} max-lg:flex max-lg:items-center max-lg:justify-between max-lg:gap-2 max-lg:px-0 max-lg:py-0 lg:table-cell ${wide ? 'max-lg:col-span-2' : ''}`}
    >
      <span className="shrink-0 text-[10px] font-medium leading-none text-gray-500 dark:text-gray-400 lg:hidden">
        {label}
      </span>
      <div className="min-w-0 max-lg:text-right max-lg:text-sm lg:contents">
        {children}
      </div>
    </td>
  );
}

interface CartTableProps {
  cart: CartItem[];
  submitting: boolean;
  totalAmount: number;
  printCart: () => void;
  saveCartToDb: () => Promise<void>;
  removeFromCart: (id: string) => void;
  onShowPrintModal: () => void;
  clearCart: () => void;
  error?: string;
  setError?: (error: string) => void;
  onClose?: () => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  submitting,
  totalAmount,
  saveCartToDb,
  removeFromCart,
  onShowPrintModal,
  clearCart,
  error,
  setError,
  onClose,
}) => {
  const { showConfirm } = useAlert();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the latest cart item when new items are added
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [cart.length]);

  const handleSaveAndAskPrint = async () => {
    logger.debug('Save button clicked', { cartItems: cart });
    try {
      logger.debug('Calling saveCartToDb');
      await saveCartToDb();
      logger.debug('saveCartToDb completed successfully');
      // Only show modal if save was successful
      onShowPrintModal();
    } catch (error) {
      logger.error('Error saving cart', error);
      // Don't show modal on error - error is already displayed via setError
    }
  };
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800 max-lg:rounded-none max-lg:border-0 max-lg:shadow-none">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900 lg:border-gray-100 lg:bg-gradient-to-br lg:from-green-50 lg:via-emerald-50 lg:to-teal-50 lg:px-6 lg:py-4 dark:lg:border-gray-600 dark:lg:from-gray-800 dark:lg:via-gray-700 dark:lg:to-gray-600">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center space-x-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md lg:flex">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white lg:text-xl">ตะกร้า</h2>
              <p className="hidden text-xs text-gray-600 dark:text-gray-300 lg:block lg:text-sm">
                {cart.length > 0 
                  ? `รายการรับซื้อที่รอการบันทึก (${cart.length} รายการ)`
                  : 'ตะกร้าว่าง - เพิ่มรายการรับซื้อเพื่อเริ่มต้น'
                }
              </p>
            </div>
          </div>
          {/* Date Display - Only show when cart has items */}
          {(cart.length > 0 || onClose) && (
          <div className="flex items-center gap-2 sm:ml-auto">
          {cart.length > 0 && (
            <div className="flex w-fit items-center space-x-2 rounded-lg border border-gray-200 bg-white/60 px-3 py-1.5 dark:border-gray-600 dark:bg-gray-700/60">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400 mr-1.5">วันที่:</span>
                {formatDate(cart[0].date)}
              </div>
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 lg:hidden"
              aria-label="ปิด"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-8 mt-6 mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                เกิดข้อผิดพลาด
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            </div>
            {setError && (
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError('')}
                  className="inline-flex rounded-md p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <span className="sr-only">ปิด</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-x-auto overflow-y-auto max-lg:p-2"
        >
          <table className="w-full max-lg:block">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700 max-lg:hidden">
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">ประเภท</th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">รายละเอียด</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">น้ำหนักรวมภาชนะ (กก.)</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">น้ำหนักภาชนะ (กก.)</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">น้ำหนักสุทธิ (กก.)</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">ราคา/กก.</th>
                <th className="px-6 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">จำนวนเงิน</th>
                <th className="px-6 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600 max-lg:block max-lg:space-y-2 max-lg:divide-y-0">
            {cart.length > 0 ? (
              cart.map((item, index) => (
                <tr key={item.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 max-lg:grid max-lg:grid-cols-2 max-lg:gap-x-2 max-lg:gap-y-1 max-lg:rounded-lg max-lg:border max-lg:border-gray-200 max-lg:p-2 dark:max-lg:border-gray-600 lg:table-row ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'}`}>
                  <CartCell label="ประเภท" wide className="px-4 py-2 text-sm">
                    {item.type === 'purchase' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 whitespace-nowrap">
                        รับซื้อ
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 whitespace-nowrap">
                        ค่าใช้จ่าย
                      </span>
                    )}
                  </CartCell>
                  <CartCell label="รายละเอียด" wide className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {item.type === 'purchase' ? (
                      <div>
                        <div className="font-medium">{item.memberName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.productTypeName}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">{item.category}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                        )}
                      </div>
                    )}
                  </CartCell>
                  <CartCell label="รวมภาชนะ" className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100 max-lg:text-left">
                    {item.type === 'purchase' ? formatNumber(item.grossWeight || 0) : '-'}
                  </CartCell>
                  <CartCell label="ภาชนะ" className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100 max-lg:text-left">
                    {item.type === 'purchase' ? formatNumber(item.containerWeight || 0) : '-'}
                  </CartCell>
                  <CartCell label="สุทธิ" className="px-3 py-2 text-sm text-right font-semibold text-gray-900 dark:text-gray-100 max-lg:text-left">
                    {item.type === 'purchase' ? formatNumber(item.netWeight || 0) : '-'}
                  </CartCell>
                  <CartCell label="ราคา" className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100 max-lg:text-left">
                    {item.type === 'purchase' ? formatNumber(item.finalPrice || 0) : '-'}
                  </CartCell>
                  <CartCell
                    label="จำนวนเงิน"
                    wide
                    className={`px-4 py-2 text-right text-sm font-semibold max-lg:text-left ${
                    item.totalAmount >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}
                  >
                    {formatCurrency(item.totalAmount)}
                  </CartCell>
                  <CartCell label="จัดการ" wide className="px-4 py-2 text-center max-lg:text-left">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 transition-all duration-200 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 max-lg:px-2.5 max-lg:py-1"
                    >
                      ลบ
                    </button>
                  </CartCell>
                </tr>
              ))
            ) : (
              <tr className="max-lg:block">
                <td colSpan={8} className="px-6 py-8 text-center max-lg:block">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="text-base font-medium">ตะกร้าว่าง</p>
                      <p className="text-xs">เพิ่มรายการรับซื้อหรือค่าใช้จ่ายเพื่อเริ่มต้น</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
        <div className={`flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 ${cart.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
            <div className="flex items-center justify-between gap-3 px-4 py-2 lg:grid lg:grid-cols-8 lg:gap-0 lg:px-0">
              <div className="text-base font-bold text-gray-900 dark:text-white lg:col-span-6 lg:px-4 lg:text-right">
                รวมทั้งหมด
              </div>
              <div className={`text-base font-bold lg:col-span-1 lg:px-4 lg:text-right ${
                totalAmount >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(totalAmount)}
              </div>
              <div className="hidden lg:col-span-1 lg:block lg:px-4 lg:py-2"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800">
            <div className="px-4 py-3">
              <div className="flex flex-col lg:flex-row gap-2 lg:items-start lg:justify-between">
                <div className="flex w-full items-center justify-end gap-2 max-lg:[&_button]:relative max-lg:[&_button]:flex max-lg:[&_button]:min-h-11 max-lg:[&_button]:flex-1 max-lg:[&_button]:items-center max-lg:[&_button]:justify-center">
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = await showConfirm(
                        'ยืนยันการล้างตะกร้า',
                        'ต้องการล้างตะกร้าทั้งหมดหรือไม่?',
                        {
                          confirmText: 'ล้างตะกร้า',
                          cancelText: 'ยกเลิก',
                          variant: 'warning',
                        }
                      );
                      if (confirmed) {
                        clearCart?.();
                        setError?.('');
                      }
                    }}
                    disabled={submitting || cart.length === 0}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    รีเซ็ตตะกร้า
                  </button>
                  <button
                    onClick={handleSaveAndAskPrint}
                    disabled={submitting || cart.length === 0}
                    className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-xs shadow-md hover:shadow-lg disabled:shadow-none transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {submitting ? (
                      <span>กำลังบันทึก...</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 max-lg:w-full max-lg:justify-center">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>บันทึกข้อมูล</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
