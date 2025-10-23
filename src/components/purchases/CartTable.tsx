import React from 'react';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

interface CartItem {
  id: string;
  date: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  productTypeId: string;
  productTypeName: string;
  productTypeCode: string;
  grossWeight: number;
  dryWeight: number;
  pricePerUnit: number;
  bonusPrice: number;
  basePrice: number;
  adjustedPrice: number;
  finalPrice: number;
  totalAmount: number;
  notes: string;
}

interface CartTableProps {
  cart: CartItem[];
  submitting: boolean;
  totalAmount: number;
  printCart: () => void;
  saveCartToDb: () => void;
  removeFromCart: (id: string) => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  submitting,
  totalAmount,
  printCart,
  saveCartToDb,
  removeFromCart,
}) => {
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
            <div className="flex items-center space-x-3">
              <button
                onClick={printCart}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>พิมพ์ PDF</span>
                </div>
              </button>
              <button
                onClick={saveCartToDb}
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
                    <span>บันทึกลงฐานข้อมูล</span>
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">วันที่รับซื้อ</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">สมาชิก</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">ประเภทสินค้า</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">น้ำหนักแห้ง (กก.)</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">ราคา/กก.</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">เงินที่ได้</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {cart.length > 0 ? (
              cart.map((item, index) => (
                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'}`}>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDate(item.date)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.memberName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.productTypeName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatNumber(item.dryWeight)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatNumber(item.finalPrice)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
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
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="text-lg font-medium">ตะกร้าว่าง</p>
                      <p className="text-sm">เพิ่มรายการรับซื้อเพื่อเริ่มต้น</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {cart.length > 0 && (
            <tfoot>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-t-2 border-gray-200 dark:border-gray-500">
                <td colSpan={5} className="px-6 py-4 text-right text-lg font-bold text-gray-900 dark:text-white">
                  รวมทั้งหมด
                </td>
                <td className="px-6 py-4 text-lg font-bold text-green-600 dark:text-green-400">
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
