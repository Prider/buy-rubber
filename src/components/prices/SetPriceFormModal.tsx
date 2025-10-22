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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ตั้งราคาประกาศ</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">กำหนดราคารับซื้อยางตามประเภทสินค้า</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-600/50 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={onSubmit} className="space-y-8">
            {/* Date Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">เลือกวันที่</h3>
              </div>
              
              <div className="pl-11">
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    วันที่ประกาศราคา <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Price Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">กำหนดราคาตามประเภทสินค้า</h3>
              </div>
              
              <div className="pl-11">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {productTypes.map((productType, index) => {
                    const todayPrice = getPriceForDateAndType(todayDate, productType.id);
                    const currentPrice = formData.prices[index]?.price || 0;
                    const hasChanged = todayPrice !== null && Math.abs(todayPrice - currentPrice) > 0.001;
                    
                    return (
                      <div key={productType.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                        <div className="space-y-4">
                          {/* Product Type Info */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                                  {productType.code}
                                </span>
                                <h4 className="font-medium text-gray-900 dark:text-white">{productType.name}</h4>
                              </div>
                              {todayPrice && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  ราคาปัจจุบัน: <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(todayPrice)}</span>
                                </p>
                              )}
                            </div>
                            {hasChanged && (
                              <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-medium">เปลี่ยนแปลง</span>
                              </div>
                            )}
                          </div>

                          {/* Price Input */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              ราคาใหม่ (บาท/กก.)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={currentPrice || ''}
                                onChange={(e) => onPriceChange(productType.id, parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 pr-16 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:text-gray-100 transition-all duration-200"
                                step="0.01"
                                min="0"
                                placeholder={todayPrice ? `${todayPrice}` : '0.00'}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">บาท/กก.</span>
                              </div>
                            </div>
                          </div>

                          {/* Price Change Indicator */}
                          {hasChanged && (
                            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                <span className="text-sm text-orange-700 dark:text-orange-300">
                                  เปลี่ยนจาก {formatCurrency(todayPrice!)} เป็น {formatCurrency(currentPrice)}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                {currentPrice > todayPrice! ? '+' : ''}{formatCurrency(currentPrice - todayPrice!)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none"
                disabled={!hasPriceChanges()}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>บันทึกราคา</span>
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

