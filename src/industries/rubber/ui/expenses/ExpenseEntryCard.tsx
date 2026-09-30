'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAlert } from '@/shared/hooks/useAlert';

const FORM_ID = 'expense-entry-form';
const DEFAULT_CATEGORIES = ['ค่าน้ำมัน', 'ค่าซ่อมรถ', 'ค่าคนงาน', 'อื่นๆ'];

interface ExpenseFormData {
  date: string;
  category: string;
  amount: number;
  description?: string;
}

interface EditingExpense {
  date: string;
  category: string;
  amount: number;
  description?: string | null;
}

interface ExpenseEntryCardProps {
  expenses: { category: string }[];
  editingExpense?: EditingExpense | null;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onClose: () => void;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const ExpenseEntryCard: React.FC<ExpenseEntryCardProps> = ({
  expenses,
  editingExpense = null,
  onSubmit,
  onClose,
}) => {
  const { showWarning, showError } = useAlert();
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

  const [expenseData, setExpenseData] = useState(() => (
    editingExpense
      ? {
          date: toDateTimeLocal(editingExpense.date) || getCurrentDateTimeLocal(),
          category: editingExpense.category,
          amount: String(editingExpense.amount),
          description: editingExpense.description || '',
        }
      : {
          date: getCurrentDateTimeLocal(),
          category: '',
          amount: '',
          description: '',
        }
  ));
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get unique categories from expenses
  const uniqueCategories = Array.from(new Set(expenses.map(exp => exp.category))).filter(Boolean);
  const allCategories = Array.from(new Set([...uniqueCategories, ...DEFAULT_CATEGORIES]));

  // Handle category input change
  const handleCategoryChange = (value: string) => {
    setExpenseData({ ...expenseData, category: value });
    setSelectedIndex(-1);
    
    if (value) {
      // Filter categories based on input
      const filtered = allCategories.filter(cat => 
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5)); // Show max 5 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      // Show all categories if input is empty
      setSuggestions(allCategories.slice(0, 5));
      setShowSuggestions(allCategories.length > 0);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: string) => {
    setExpenseData({ ...expenseData, category: suggestion });
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseData.category || !expenseData.amount) {
      showWarning('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกประเภทและจำนวนเงินให้ครบถ้วน');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...expenseData,
        amount: parseFloat(expenseData.amount),
      });
      
      // Reset form
      setExpenseData({
        date: getCurrentDateTimeLocal(),
        category: '',
        amount: '',
        description: '',
      });
      setSuggestions([]);
      setShowSuggestions(false);
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย';
      showError('เกิดข้อผิดพลาด', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-[1100] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-form-title"
          className="relative flex max-h-[100dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800 sm:max-h-[calc(100dvh-2rem)] sm:max-w-[640px] sm:rounded-2xl"
        >
          <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
            <h2
              id="expense-form-title"
              className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-center text-xl font-bold text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 sm:text-2xl"
            >
              {editingExpense ? 'แก้ไขค่าใช้จ่าย' : 'เพิ่มค่าใช้จ่าย'}
            </h2>
          </div>

          <div className="overflow-y-auto p-4 sm:p-6">
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
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🏷️ ประเภท
          </label>
          <input
            ref={inputRef}
            type="text"
            value={expenseData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              handleCategoryChange(expenseData.category);
            }}
            className="h-11 w-full min-w-0 rounded-xl border border-gray-300 px-3 text-base text-gray-900 outline-none transition focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="ระบุประเภท (เช่น ค่าน้ำมัน, ค่าซ่อมรถ)"
            required
          />
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className={`min-h-11 w-full px-4 py-3 text-left text-sm transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${
                    selectedIndex === index
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
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
                inputRef.current?.focus();
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
              onClick={handleClose}
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
              {submitting ? 'กำลังบันทึก...' : editingExpense ? 'บันทึกการแก้ไข' : 'บันทึกค่าใช้จ่าย'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

