'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface ProductType {
  id: string;
  code: string;
  name: string;
}

interface ProductPrice {
  productTypeId: string;
  price: number;
}

interface SetPriceFormModalProps {
  isOpen: boolean;
  formData: {
    date: string;
    prices: ProductPrice[];
  };
  productTypes: ProductType[];
  getPriceForDateAndType: (date: string, productTypeId: string) => number | null;
  hasPriceChanges: () => boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDateChange: (date: string) => void;
  onPriceChange: (productTypeId: string, price: number) => void;
}

export default function SetPriceFormModal({
  isOpen,
  formData,
  productTypes,
  getPriceForDateAndType,
  hasPriceChanges,
  onClose,
  onSubmit,
  onDateChange,
  onPriceChange,
}: SetPriceFormModalProps) {
  if (!isOpen) return null;

  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          ตั้งราคาประกาศ
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">วันที่</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => onDateChange(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
              ราคาตามประเภทสินค้า (บาท/กก.)
            </h3>
            <div className="space-y-3">
              {productTypes.map((productType, index) => {
                const todayPrice = getPriceForDateAndType(todayDate, productType.id);
                return (
                  <div key={productType.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                          {productType.code}
                        </span>
                        {productType.name}
                        {todayPrice && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            (ปัจจุบัน: {formatCurrency(todayPrice)})
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        value={formData.prices[index]?.price || ''}
                        onChange={(e) =>
                          onPriceChange(productType.id, parseFloat(e.target.value) || 0)
                        }
                        className="input text-right"
                        step="0.01"
                        min="0"
                        placeholder={todayPrice ? `${todayPrice}` : '0.00'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasPriceChanges()}
              >
                บันทึกราคา
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

