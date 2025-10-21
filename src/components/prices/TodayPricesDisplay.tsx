'use client';

import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ProductType {
  id: string;
  code: string;
  name: string;
}

interface TodayPricesDisplayProps {
  productTypes: ProductType[];
  getPriceForDateAndType: (date: string, productTypeId: string) => number | null;
}

export default function TodayPricesDisplay({ productTypes, getPriceForDateAndType }: TodayPricesDisplayProps) {
  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-green-200 dark:border-green-800">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
          <span className="text-white text-sm">💰</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ราคาวันนี้
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {formatDate(todayDate)}
          </p>
        </div>
      </div>
      
      {productTypes.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productTypes.map((productType) => {
            const todayPrice = getPriceForDateAndType(todayDate, productType.id);
            return (
              <div
                key={productType.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                    {productType.code}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {productType.name}
                </div>
                {todayPrice !== null ? (
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(todayPrice)}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-gray-600 italic">
                    ยังไม่ได้ตั้งราคา
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          ยังไม่มีประเภทสินค้า
        </div>
      )}
    </div>
  );
}

