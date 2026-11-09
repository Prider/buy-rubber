'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useAlert } from '@/hooks/useAlert';
import { CloseButton } from '@/components/common/CloseButton';
import { ExpenseCategoryRecord } from '@/lib/expenseCategories';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';

const ExpenseCategoryModal = dynamic(
  () => import(/* webpackPrefetch: true */ '@/components/expenses/ExpenseCategoryModal'),
);

const FORM_ID = 'expense-form';

interface ExpenseFormData {
  date: string;
  category: string;
  amount: number;
  description?: string;
}

interface ExpenseEntryCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
}

export const ExpenseEntryCard: React.FC<ExpenseEntryCardProps> = ({ isOpen, onClose, onSubmit }) => {
  const { showWarning, showError } = useAlert();
  const {
    categories,
    loading: categoriesLoading,
    saving: categoriesSaving,
    error: categoriesError,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useExpenseCategories();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  // Helper function to get current datetime in local time format
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [expenseData, setExpenseData] = useState({
    date: getCurrentDateTimeLocal(),
    category: '',
    amount: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuStyle, setCategoryMenuStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    visibility: 'hidden',
  });
  const categoryInputRef = useRef<HTMLSelectElement>(null);
  const categoryFieldRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const categoryMenuRef = useRef<HTMLUListElement>(null);

  const selectedCategoryMissing =
    Boolean(expenseData.category) && !categories.some((category) => category.name === expenseData.category);

  const focusCategoryField = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      categoryButtonRef.current?.focus();
      return;
    }
    categoryInputRef.current?.focus();
  };

  const chooseCategory = (category: string) => {
    setExpenseData((current) => ({ ...current, category }));
    setCategoryMenuOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      void loadCategories();
    }
  }, [isOpen, loadCategories]);

  useEffect(() => {
    if (!categoryMenuOpen) return;

    const placeMenu = () => {
      const field = categoryButtonRef.current?.getBoundingClientRect();
      if (!field) return;
      if (window.matchMedia('(min-width: 1024px)').matches) {
        setCategoryMenuOpen(false);
        return;
      }

      const gap = 4;
      const preferredHeight = 240;
      const spaceBelow = window.innerHeight - field.bottom - gap;
      const spaceAbove = field.top - gap;
      const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, Math.min(preferredHeight, openUp ? spaceAbove : spaceBelow));
      const top = openUp
        ? Math.max(8, field.top - gap - maxHeight)
        : field.bottom + gap;
      const maxLeft = Math.max(8, window.innerWidth - field.width - 8);

      setCategoryMenuStyle({
        position: 'fixed',
        visibility: 'visible',
        top,
        left: Math.min(Math.max(8, field.left), maxLeft),
        width: Math.min(field.width, window.innerWidth - 16),
        maxHeight,
        zIndex: 1200,
      });
    };

    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (categoryFieldRef.current?.contains(target) || categoryMenuRef.current?.contains(target)) {
        return;
      }
      setCategoryMenuOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setCategoryMenuOpen(false);
        categoryButtonRef.current?.focus();
      }
    };

    placeMenu();
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', placeMenu);
    document.addEventListener('scroll', placeMenu, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', placeMenu);
      document.removeEventListener('scroll', placeMenu, true);
    };
  }, [categoryMenuOpen]);

  const handleCategorySaved = (category: ExpenseCategoryRecord, previousName: string | null) => {
    if (previousName && expenseData.category === previousName) {
      setExpenseData((current) => ({ ...current, category: category.name }));
      return;
    }
    if (!previousName && !expenseData.category) {
      setExpenseData((current) => ({ ...current, category: category.name }));
    }
  };

  const handleCategoryDeleted = (category: ExpenseCategoryRecord) => {
    if (expenseData.category === category.name) {
      setExpenseData((current) => ({ ...current, category: '' }));
    }
  };

  const resetForm = () => {
    setExpenseData({
      date: getCurrentDateTimeLocal(),
      category: '',
      amount: '',
      description: '',
    });
    setCategoryMenuOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseData.category || !expenseData.amount) {
      showWarning('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกประเภทและกรอกจำนวนเงินให้ครบถ้วน');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...expenseData,
        amount: parseFloat(expenseData.amount),
      });
      resetForm();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย';
      showError('เกิดข้อผิดพลาด', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-[1100] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={handleCancel} aria-hidden="true" />
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-form-title"
          className="relative flex max-h-[100dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800 sm:max-h-[calc(100dvh-2rem)] sm:max-w-[640px] sm:rounded-2xl"
        >
          <div className="relative border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
            <h2
              id="expense-form-title"
              className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text px-16 text-center text-xl font-bold text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 sm:text-2xl"
            >
              บันทึกค่าใช้จ่าย
            </h2>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 sm:right-6">
              <CloseButton onClick={handleCancel} disabled={submitting} />
            </span>
          </div>

          <div
            className="overflow-y-auto p-4 sm:p-6"
            role="region"
            aria-label="แบบฟอร์มบันทึกค่าใช้จ่าย"
          >
        <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        {/* Date and Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📅 วันที่และเวลา
          </label>
          <input
            type="datetime-local"
            value={expenseData.date}
            onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
            className="h-11 w-full min-w-0 max-w-full rounded-xl border border-gray-300 px-3 text-base text-gray-900 outline-none transition focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            required
          />
        </div>

        {/* Category */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label id="expense-category-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              🏷️ ประเภท
            </label>
            <button
              type="button"
              onClick={() => {
                setCategoryMenuOpen(false);
                setCategoryModalOpen(true);
              }}
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
              จัดการประเภทค่าใช้จ่าย
            </button>
          </div>
          <div className="relative" ref={categoryFieldRef}>
            <button
              ref={categoryButtonRef}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={categoryMenuOpen}
              aria-labelledby="expense-category-label"
              disabled={submitting || categoriesLoading}
              onClick={() => setCategoryMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setCategoryMenuOpen(true);
                }
              }}
              className="flex h-11 w-full items-center rounded-xl border border-gray-300 bg-white px-3 pr-10 text-left text-base outline-none transition focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 lg:hidden"
            >
              <span className={expenseData.category ? 'truncate text-gray-900 dark:text-white' : 'truncate text-gray-500 dark:text-gray-400'}>
                {expenseData.category || (categoriesLoading ? 'กำลังโหลด...' : 'เลือกประเภท...')}
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
            <select
              ref={categoryInputRef}
              id="expense-category"
              name="category"
              aria-labelledby="expense-category-label"
              value={expenseData.category}
              onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
              className="hidden h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none transition focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm lg:block"
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
                <option value={expenseData.category}>{expenseData.category}</option>
              ) : null}
            </select>
          </div>
          {categoriesError ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{categoriesError}</p>
          ) : null}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            💵 จำนวนเงิน (บาท)
          </label>
          <input
            type="number"
            step="0.01"
            value={expenseData.amount}
            onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                const descriptionElement = document.querySelector<HTMLTextAreaElement>('textarea[data-expense-description]');
                descriptionElement?.focus();
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                focusCategoryField();
              }
            }}
            className="h-11 w-full min-w-0 rounded-xl border border-gray-300 px-3 text-base text-gray-900 outline-none transition focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="0.00"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📝 รายละเอียด (ไม่บังคับ)
          </label>
          <textarea
            value={expenseData.description}
            onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
            data-expense-description
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                const amountInput = (e.currentTarget
                  .closest('form')
                  ?.querySelector('input[type="number"]') ?? null) as HTMLInputElement | null;
                amountInput?.focus();
              }
            }}
            className="w-full min-w-0 rounded-xl border border-gray-300 px-3 py-2.5 text-base text-gray-900 outline-none transition focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            rows={3}
            placeholder="เพิ่มรายละเอียด..."
          />
        </div>

      </form>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-4 py-4 dark:border-gray-700 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="min-h-11 w-full rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 sm:w-auto"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form={FORM_ID}
              disabled={submitting}
              className="min-h-11 w-full rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-6 py-3 font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 sm:w-auto"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกค่าใช้จ่าย'}
            </button>
          </div>
        </div>
      </div>
    </div>
    {categoryMenuOpen && typeof document !== 'undefined'
      ? createPortal(
          <ul
            ref={categoryMenuRef}
            role="listbox"
            aria-labelledby="expense-category-label"
            style={categoryMenuStyle}
            className="overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-700"
          >
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={expenseData.category === ''}
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
                  aria-selected={expenseData.category === category.name}
                  onClick={() => chooseCategory(category.name)}
                  className={`flex min-h-11 w-full items-center px-3 text-left text-base hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    expenseData.category === category.name
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
                  onClick={() => chooseCategory(expenseData.category)}
                  className="flex min-h-11 w-full items-center bg-orange-50 px-3 text-left text-base font-medium text-orange-700 hover:bg-gray-100 dark:bg-orange-900/30 dark:text-orange-200 dark:hover:bg-gray-600"
                >
                  {expenseData.category}
                </button>
              </li>
            ) : null}
          </ul>,
          document.body,
        )
      : null}
    <ExpenseCategoryModal
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

