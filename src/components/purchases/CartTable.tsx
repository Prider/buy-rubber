import React, { useEffect, useRef } from 'react';
import { useAlert } from '@/hooks/useAlert';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { moistureUnitLabel, type MoistureUnit } from '@/lib/purchases/moisture';
import { logger } from '@/lib/logger';
import { CloseButton } from '@/components/common/CloseButton';

interface CartItem {
  id: string;
  type: 'purchase';
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
  moisturePercent?: number;
  moistureUnit?: MoistureUnit;
  pricePerUnit?: number;
  bonusPrice?: number;
  basePrice?: number;
  adjustedPrice?: number;
  finalPrice?: number;
  totalAmount: number;
  notes?: string;
}

function CartCell({
  label,
  wide = false,
  className,
  labelClassName = 'text-gray-500 dark:text-gray-400',
  children,
}: {
  label: string;
  wide?: boolean;
  className: string;
  labelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <td
      className={`${className} max-lg:flex max-lg:items-center max-lg:justify-between max-lg:gap-2 max-lg:px-0 max-lg:py-0 lg:table-cell ${wide ? 'max-lg:col-span-2' : ''}`}
    >
      <span className={`shrink-0 text-[10px] font-medium leading-none lg:hidden ${labelClassName}`}>
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
  onEditCartItem: (id: string) => void;
  onShowPrintModal: () => void;
  clearCart: () => void;
  error?: string;
  setError?: (error: string) => void;
  onClose?: () => void;
  onRecordPurchase?: () => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  submitting,
  totalAmount,
  saveCartToDb,
  removeFromCart,
  onEditCartItem,
  onShowPrintModal,
  clearCart,
  error,
  setError,
  onClose,
  onRecordPurchase,
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
      <div className="border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900 lg:border-gray-100 lg:bg-gradient-to-br lg:from-green-50 lg:via-emerald-50 lg:to-teal-50 lg:px-4 lg:py-2.5 dark:lg:border-gray-600 dark:lg:from-gray-800 dark:lg:via-gray-700 dark:lg:to-gray-600">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm lg:flex">
              <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight text-gray-900 dark:text-white lg:text-xl">ตะกร้า</h2>
              <p className="hidden text-xs leading-tight text-gray-600 dark:text-gray-300 lg:block lg:text-sm">
                {cart.length > 0 
                  ? `รายการรับซื้อที่รอการบันทึก (${cart.length} รายการ)`
                  : ''
                }
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onRecordPurchase && (
              <button
                type="button"
                onClick={onRecordPurchase}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                รับซื้อ
              </button>
            )}
            {onClose && (
              <CloseButton onClick={onClose} className="lg:hidden" />
            )}
          </div>
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
          className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain max-lg:p-2"
        >
          <table className="w-full max-lg:block lg:table-fixed">
            <colgroup className="max-lg:hidden">
              <col className="w-[16%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead className={cart.length === 0 ? 'hidden' : 'sticky top-0 z-10 bg-gray-50 dark:bg-gray-700 max-lg:hidden'}>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="bg-gray-50 px-2 py-2 text-left align-bottom text-[11px] font-semibold leading-tight text-gray-900 dark:bg-gray-700 dark:text-white">รายละเอียด</th>
                <th className="bg-gray-50 px-2 py-2 text-right align-bottom text-[11px] font-semibold leading-tight text-gray-900 dark:bg-gray-700 dark:text-white">น้ำหนักรวม<br />ภาชนะ (กก.)</th>
                <th className="bg-gray-50 px-2 py-2 text-right align-bottom text-[11px] font-semibold leading-tight text-gray-900 dark:bg-gray-700 dark:text-white">น้ำหนัก<br />ภาชนะ (กก.)</th>
                <th className="bg-gray-50 px-2 py-2 text-right align-bottom text-[11px] font-semibold leading-tight text-gray-900 dark:bg-gray-700 dark:text-white">น้ำหนัก<br />สุทธิ (กก.)</th>
                <th className="bg-gray-50 px-2 py-2 text-right align-bottom text-[11px] font-semibold leading-tight text-gray-900 dark:bg-gray-700 dark:text-white">ราคา/กก.</th>
                <th className="bg-gray-50 px-2 py-2 text-right align-bottom text-[11px] font-semibold leading-tight text-red-600 dark:bg-gray-700 dark:text-red-400">หัก<br />ความชื้น</th>
                <th className="bg-gray-50 px-2 py-2 text-right align-bottom text-[11px] font-semibold leading-tight text-gray-900 dark:bg-gray-700 dark:text-white">จำนวนเงิน</th>
                <th className="bg-gray-50 px-2 py-2 text-center align-bottom text-[11px] font-semibold leading-tight text-gray-900 dark:bg-gray-700 dark:text-white">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600 max-lg:block max-lg:space-y-2 max-lg:divide-y-0">
            {cart.length > 0 ? (
              cart.map((item, index) => (
                <tr key={item.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 max-lg:grid max-lg:grid-cols-2 max-lg:gap-x-2 max-lg:gap-y-1 max-lg:rounded-lg max-lg:border max-lg:border-gray-200 max-lg:p-2 dark:max-lg:border-gray-600 lg:table-row ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'}`}>
                  <CartCell label="รายละเอียด" wide className="break-words px-2 py-2 text-xs text-gray-900 dark:text-gray-100">
                    <div>
                      <div className="font-medium">{item.memberName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.productTypeName}</div>
                    </div>
                  </CartCell>
                  <CartCell label="รวมภาชนะ" className="whitespace-nowrap px-2 py-2 text-right text-xs tabular-nums text-gray-900 dark:text-gray-100 max-lg:text-left">
                    {formatNumber(item.grossWeight || 0)}
                  </CartCell>
                  <CartCell label="ภาชนะ" className="whitespace-nowrap px-2 py-2 text-right text-xs tabular-nums text-gray-900 dark:text-gray-100 max-lg:text-left">
                    {formatNumber(item.containerWeight || 0)}
                  </CartCell>
                  <CartCell label="สุทธิ" className="whitespace-nowrap px-2 py-2 text-right text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100 max-lg:text-left">
                    {formatNumber(item.netWeight || 0)}
                  </CartCell>
                  <CartCell label="ราคา" className="whitespace-nowrap px-2 py-2 text-right text-xs tabular-nums text-gray-900 dark:text-gray-100 max-lg:text-left">
                    {formatNumber(item.finalPrice || 0)}
                  </CartCell>
                  <CartCell label="หักความชื้น" labelClassName="text-red-600 dark:text-red-400" className="px-2 py-2 text-right text-xs font-medium leading-tight text-red-600 dark:text-red-400 max-lg:text-left">
                    <>
                      <span className="tabular-nums">{formatNumber(item.moisturePercent || 0)}</span>
                      <span className="mt-0.5 block text-[10px]">{moistureUnitLabel(item.moistureUnit)}</span>
                    </>
                  </CartCell>
                  <CartCell
                    label="จำนวนเงิน"
                    wide
                    className={`whitespace-nowrap px-2 py-2 text-right text-xs font-semibold tabular-nums max-lg:text-left ${
                    item.totalAmount >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}
                  >
                    {formatCurrency(item.totalAmount)}
                  </CartCell>
                  <CartCell label="จัดการ" wide className="whitespace-nowrap px-2 py-2 text-center max-lg:text-left">
                    <div className="flex flex-nowrap items-center justify-center gap-1 max-lg:justify-end">
                      <button
                        type="button"
                        onClick={() => onEditCartItem(item.id)}
                        disabled={submitting}
                        className="rounded-md bg-blue-50 px-1.5 py-1 text-[11px] font-medium text-blue-700 transition-colors duration-150 ease-out hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 max-lg:min-h-9 max-lg:px-2.5"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        disabled={submitting}
                        className="rounded-md bg-red-50 px-1.5 py-1 text-[11px] font-medium text-red-600 transition-colors duration-150 ease-out hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 max-lg:min-h-9 max-lg:px-2.5"
                      >
                        ลบ
                      </button>
                    </div>
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
                      <p className="text-xs">เพิ่มรายการรับซื้อเพื่อเริ่มต้น</p>
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
            <div className="flex items-center justify-between gap-3 px-4 py-2 lg:justify-end lg:gap-3 lg:px-2 lg:pr-[calc(15%+0.5rem)]">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                รวมทั้งหมด
              </div>
              <div className={`text-sm font-bold tabular-nums ${
                totalAmount >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800">
            <div className="px-4 py-3">
              <div className="flex flex-col lg:flex-row gap-2 lg:items-start lg:justify-between">
                <div className="flex w-full items-center justify-end gap-3 max-lg:[&_button]:relative max-lg:[&_button]:flex max-lg:[&_button]:min-h-12 max-lg:[&_button]:flex-1 max-lg:[&_button]:items-center max-lg:[&_button]:justify-center">
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
                    className="min-h-12 rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    รีเซ็ตตะกร้า
                  </button>
                  <button
                    onClick={handleSaveAndAskPrint}
                    disabled={submitting || cart.length === 0}
                    className="min-h-12 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-[box-shadow,transform] duration-150 ease-out hover:from-green-700 hover:to-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none motion-safe:hover:-translate-y-0.5 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600"
                  >
                    {submitting ? (
                      <span>กำลังบันทึก...</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 max-lg:w-full max-lg:justify-center">
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
