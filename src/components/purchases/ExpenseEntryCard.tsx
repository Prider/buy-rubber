'use client';

import React, { useRef } from 'react';

interface ExpenseFormData {
  category: string;
  amount: string;
}

interface ExpenseEntryCardProps {
  formData: ExpenseFormData;
  error: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isFormValid: boolean;
  resetForm: () => void;
  addToCart: () => void;
}

export const ExpenseEntryCard: React.FC<ExpenseEntryCardProps> = ({
  formData,
  error,
  handleInputChange,
  isFormValid,
  resetForm,
  addToCart,
}) => {
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (
    e: React.KeyboardEvent,
    nextRef?: React.RefObject<any>,
    prevRef?: React.RefObject<any>
  ) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
    if (e.key === 'ArrowLeft' && prevRef?.current) {
      e.preventDefault();
      prevRef.current.focus();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-b border-gray-100 dark:border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">บันทึกค่าใช้จ่าย</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">กรอกข้อมูลค่าใช้จ่ายและเพิ่มลงตะกร้า</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-700 dark:text-red-300 font-medium text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={(e) => { 
          e.preventDefault(); 
          addToCart(); 
          requestAnimationFrame(() => {
            categoryInputRef.current?.focus();
          });
        }} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">ข้อมูลค่าใช้จ่าย</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ประเภท <span className="text-red-500">*</span>
                </label>
                <input
                  ref={categoryInputRef}
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, amountInputRef)}
                  placeholder="ระบุประเภท..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  จำนวนเงิน (บาท) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={amountInputRef}
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitButtonRef.current?.focus();
                      }
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        categoryInputRef.current?.focus();
                      }
                    }}
                    required
                    className="w-full px-3 py-2 pr-16 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">บาท</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-600">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium text-sm"
            >
              รีเซ็ต
            </button>
            <button
              ref={submitButtonRef}
              type="submit"
              disabled={!isFormValid}
              className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 text-white rounded-lg hover:from-orange-700 hover:to-red-700 dark:hover:from-orange-600 dark:hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              <div className="flex items-center space-x-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span>เพิ่มลงตะกร้า</span>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

