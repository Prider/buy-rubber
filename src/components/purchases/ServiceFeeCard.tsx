'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ServiceFeeCategoryRecord } from '@/lib/serviceFeeCategories';
import { useServiceFeeCategories } from '@/hooks/useServiceFeeCategories';

const ServiceFeeCategoryModal = dynamic(
  () => import(/* webpackPrefetch: true */ '@/components/purchases/ServiceFeeCategoryModal'),
);

interface ServiceFeeFormData {
  category: string;
  amount: string;
}

interface ServiceFeeCardProps {
  formData: ServiceFeeFormData;
  error: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setCategory: (category: string) => void;
  isFormValid: boolean;
  resetForm: () => void;
  addToCart: () => void;
  submitting?: boolean;
}

export const ServiceFeeCard: React.FC<ServiceFeeCardProps> = ({
  formData,
  error,
  handleInputChange,
  setCategory,
  isFormValid,
  resetForm,
  addToCart,
  submitting = false,
}) => {
  const categoryInputRef = useRef<HTMLSelectElement>(null);
  const categoryFieldRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuOpensUp, setCategoryMenuOpensUp] = useState(false);
  const {
    categories,
    loading: categoriesLoading,
    saving: categoriesSaving,
    error: categoriesError,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useServiceFeeCategories();

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!categoryMenuOpen) return;

    const placeMenu = () => {
      const field = categoryButtonRef.current?.getBoundingClientRect();
      if (!field) return;
      const spaceBelow = window.innerHeight - field.bottom;
      setCategoryMenuOpensUp(spaceBelow < 240 && field.top > spaceBelow);
    };

    const closeOnOutside = (event: PointerEvent) => {
      if (!categoryFieldRef.current?.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCategoryMenuOpen(false);
    };

    placeMenu();
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', placeMenu);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', placeMenu);
    };
  }, [categoryMenuOpen]);

  const focusCategoryField = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      categoryButtonRef.current?.focus();
      return;
    }
    categoryInputRef.current?.focus();
  };

  const chooseCategory = (category: string) => {
    setCategory(category);
    setCategoryMenuOpen(false);
  };

  const handleCategorySaved = (category: ServiceFeeCategoryRecord, previousName: string | null) => {
    if (previousName && formData.category === previousName) {
      setCategory(category.name);
      return;
    }
    if (!previousName && !formData.category) {
      setCategory(category.name);
    }
  };

  const handleCategoryDeleted = (category: ServiceFeeCategoryRecord) => {
    if (formData.category === category.name) {
      setCategory('');
    }
  };
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

  const selectedCategoryMissing =
    Boolean(formData.category) && !categories.some((category) => category.name === formData.category);

  return (
    <>
    <div className="overflow-visible bg-[var(--app-bg)] lg:overflow-hidden lg:rounded-xl lg:bg-white lg:shadow-md dark:lg:bg-gray-800">
      <div className="p-4 space-y-4">
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

        <form
          onSubmit={(e) => {
          e.preventDefault(); 
          addToCart(); 
          requestAnimationFrame(() => {
            focusCategoryField();
          });
          }}
          className="space-y-5 max-lg:[&_:is(input,select)]:h-12 max-lg:[&_:is(input,select)]:rounded-2xl max-lg:[&_:is(input,select)]:text-base max-lg:[&_label]:text-sm max-lg:[&_label]:font-semibold lg:space-y-4"
        >
          <div className="space-y-3">
            <div className="hidden items-center space-x-2 lg:flex">
              <div className="w-5 h-5 bg-orange-100 dark:bg-orange-900 rounded-md flex items-center justify-center">
                <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">หักค่าบริการ</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    ประเภท <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-violet-700 underline-offset-2 transition hover:underline dark:text-violet-300"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="lg:hidden">จัดการประเภท</span>
                    <span className="hidden lg:inline">จัดการประเภทค่าหักค่าบริการ</span>
                  </button>
                </div>
                <div className="relative" ref={categoryFieldRef}>
                  <button
                    ref={categoryButtonRef}
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={categoryMenuOpen}
                    disabled={submitting || categoriesLoading}
                    onClick={() => setCategoryMenuOpen((open) => !open)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setCategoryMenuOpen(true);
                        return;
                      }
                      if (categoryMenuOpen) return;
                      handleKeyDown(e, amountInputRef);
                    }}
                    className="flex h-12 w-full items-center rounded-2xl border border-gray-200 bg-white px-3 pr-10 text-left text-base focus:border-transparent focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 lg:hidden"
                  >
                    <span className={formData.category ? 'truncate text-gray-900 dark:text-gray-100' : 'truncate text-gray-500 dark:text-gray-400'}>
                      {formData.category || (categoriesLoading ? 'กำลังโหลด...' : 'เลือกประเภท...')}
                    </span>
                  </button>
                  <svg
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform lg:hidden ${categoryMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {categoryMenuOpen ? (
                    <ul
                      role="listbox"
                      aria-label="ประเภท"
                      className={`absolute left-0 right-0 z-50 max-h-60 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-700 lg:hidden ${categoryMenuOpensUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                    >
                      <li role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={formData.category === ''}
                          onClick={() => chooseCategory('')}
                          className="flex min-h-11 w-full items-center px-3 text-left text-base text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                        >
                          เลือกประเภท...
                        </button>
                      </li>
                      {categories.map((category) => (
                        <li key={category.id} role="presentation">
                          <button
                            type="button"
                            role="option"
                            aria-selected={formData.category === category.name}
                            onClick={() => chooseCategory(category.name)}
                            className={`flex min-h-11 w-full items-center px-3 text-left text-base hover:bg-gray-100 dark:hover:bg-gray-600 ${
                              formData.category === category.name
                                ? 'bg-orange-50 font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {category.name}
                          </button>
                        </li>
                      ))}
                      {selectedCategoryMissing ? (
                        <li role="presentation">
                          <button
                            type="button"
                            role="option"
                            aria-selected
                            onClick={() => chooseCategory(formData.category)}
                            className="flex min-h-11 w-full items-center bg-orange-50 px-3 text-left text-base font-medium text-orange-700 hover:bg-gray-100 dark:bg-orange-900/30 dark:text-orange-200 dark:hover:bg-gray-600"
                          >
                            {formData.category}
                          </button>
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                  <select
                    ref={categoryInputRef}
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, amountInputRef)}
                    className="hidden w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 lg:block"
                    required
                    disabled={submitting || categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? 'กำลังโหลด...' : 'เลือกประเภท...'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                    {selectedCategoryMissing ? (
                      <option value={formData.category}>{formData.category}</option>
                    ) : null}
                  </select>
                </div>
                {categoriesError ? (
                  <p className="text-xs text-red-600 dark:text-red-400">{categoriesError}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
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
                        focusCategoryField();
                      }
                    }}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-1.5 pr-12 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 dark:text-gray-400 text-[11px] font-medium">บาท</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900 max-lg:fixed max-lg:inset-x-0 max-lg:z-[35] max-lg:bottom-[calc(3.5rem+env(safe-area-inset-bottom))] max-lg:[&_button]:flex max-lg:[&_button]:min-h-12 max-lg:[&_button]:flex-1 max-lg:[&_button]:items-center max-lg:[&_button]:justify-center max-lg:[&_button]:rounded-2xl max-lg:[&_button]:text-sm md:left-16 lg:static lg:inset-auto lg:z-auto lg:justify-end lg:border-gray-100 lg:bg-transparent lg:px-0 lg:py-0 lg:pt-3 dark:lg:border-gray-600 dark:lg:bg-transparent">
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="max-lg:min-h-11 px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              รีเซ็ต
            </button>
            <button
              ref={submitButtonRef}
              type="submit"
              disabled={!isFormValid || submitting}
              className="max-lg:min-h-11 px-5 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 text-white rounded-md text-xs font-semibold hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-1 focus:ring-orange-400 transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
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
    <ServiceFeeCategoryModal
      isOpen={categoryModalOpen}
      onClose={() => setCategoryModalOpen(false)}
      categories={categories}
      loading={categoriesLoading}
      saving={categoriesSaving}
      onCreateCategory={createCategory}
      onUpdateCategory={updateCategory}
      onDeleteCategory={deleteCategory}
      onRefresh={loadCategories}
      onSaved={handleCategorySaved}
      onDeleted={handleCategoryDeleted}
    />
    </>
  );
};

