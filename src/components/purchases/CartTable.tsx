import React from 'react';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface CartItem {
  id: string;
  type: 'purchase' | 'expense';
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
  // Expense fields
  category?: string;
  amount?: number;
  description?: string;
  // Common fields
  totalAmount: number; // Positive for purchases, negative for expenses
  notes?: string;
}

interface CartTableProps {
  cart: CartItem[];
  submitting: boolean;
  totalAmount: number;
  printCart: () => void;
  saveCartToDb: () => Promise<void>;
  removeFromCart: (id: string) => void;
  onShowPrintModal: () => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  submitting,
  totalAmount,
  printCart,
  saveCartToDb,
  removeFromCart,
  onShowPrintModal,
}) => {
  const handleSaveAndAskPrint = async () => {
    logger.debug('Save button clicked', { cartItems: cart });
    try {
      logger.debug('Calling saveCartToDb');
      await saveCartToDb();
      logger.debug('saveCartToDb completed successfully');
      onShowPrintModal();
    } catch (error) {
      logger.error('Error saving cart', error);
    }
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="px-8 py-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-b border-gray-100 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ตะกร้า</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {cart.length > 0 
                  ? `รายการรับซื้อที่รอการบันทึก (${cart.length} รายการ)`
                  : 'ตะกร้าว่าง - เพิ่มรายการรับซื้อเพื่อเริ่มต้น'
                }
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center">
              <button
                onClick={handleSaveAndAskPrint}
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>กำลังบันทึก...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>บันทึกข้อมูล</span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">ประเภท</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">วันที่</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">รายละเอียด</th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">น้ำหนักรวมภาชนะ (กก.)</th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">น้ำหนักภาชนะ (กก.)</th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">น้ำหนักสุทธิ (กก.)</th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">ราคา/กก.</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">จำนวนเงิน</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {cart.length > 0 ? (
              cart.map((item, index) => (
                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'}`}>
                  <td className="px-6 py-4 text-sm">
                    {item.type === 'purchase' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        รับซื้อ
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        ค่าใช้จ่าย
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDate(item.date)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
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
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                    {item.type === 'purchase' ? formatNumber(item.grossWeight || 0) : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                    {item.type === 'purchase' ? formatNumber(item.containerWeight || 0) : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                    {item.type === 'purchase' ? formatNumber(item.netWeight || 0) : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                    {item.type === 'purchase' ? formatNumber(item.finalPrice || 0) : '-'}
                  </td>
                  <td className={`px-6 py-4 text-sm text-right font-semibold ${
                    item.totalAmount >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(item.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="px-3 py-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 text-sm font-medium"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="text-lg font-medium">ตะกร้าว่าง</p>
                      <p className="text-sm">เพิ่มรายการรับซื้อหรือค่าใช้จ่ายเพื่อเริ่มต้น</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {cart.length > 0 && (
            <tfoot>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-t-2 border-gray-200 dark:border-gray-500">
                <td colSpan={7} className="px-6 py-4 text-right text-lg font-bold text-gray-900 dark:text-white">
                  รวมทั้งหมด
                </td>
                <td className={`px-6 py-4 text-right text-lg font-bold ${
                  totalAmount >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(totalAmount)}
                </td>
                <td className="px-6 py-4"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
