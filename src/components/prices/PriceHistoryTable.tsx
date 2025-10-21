'use client';

import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ProductType {
  id: string;
  code: string;
  name: string;
}

interface PriceHistoryTableProps {
  productTypes: ProductType[];
  getPriceForDateAndType: (date: string, productTypeId: string) => number | null;
  loading: boolean;
}

export default function PriceHistoryTable({ 
  productTypes, 
  getPriceForDateAndType,
  loading 
}: PriceHistoryTableProps) {
  // Get last 10 days (excluding today)
  const getLast10Days = () => {
    const days = [];
    for (let i = 1; i <= 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last10Days = getLast10Days();

  // Filter out days where all prices are null
  const daysWithPrices = last10Days.filter(date => {
    return productTypes.some(pt => getPriceForDateAndType(date, pt.id) !== null);
  });

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
          <span className="text-white text-sm">📊</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ประวัติราคา
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {daysWithPrices.length > 0 ? `${daysWithPrices.length} วันล่าสุด` : '10 วันล่าสุด'} (ไม่รวมวันนี้)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      ) : productTypes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">ยังไม่มีประเภทสินค้า</p>
        </div>
      ) : daysWithPrices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">ยังไม่มีประวัติราคา</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">เริ่มต้นโดยการตั้งราคาวันนี้</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="sticky left-0 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider z-10">
                  วันที่
                </th>
                {productTypes.map((productType) => (
                  <th 
                    key={productType.id} 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {productType.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                      {productType.code}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {daysWithPrices.map((date, index) => (
                <tr 
                  key={date}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="sticky left-0 bg-white dark:bg-gray-900 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 z-10">
                    <div className="flex flex-col">
                      <span>{formatDate(date)}</span>
                      {index === 0 && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          เมื่อวาน
                        </span>
                      )}
                    </div>
                  </td>
                  {productTypes.map((productType) => {
                    const price = getPriceForDateAndType(date, productType.id);
                    return (
                      <td 
                        key={productType.id} 
                        className="px-6 py-4 whitespace-nowrap text-center text-sm"
                      >
                        {price !== null ? (
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(price)}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

