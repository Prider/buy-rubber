'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useAlert } from '@/hooks/useAlert';

interface ExpenseFormData {
  date: string;
  category: string;
  amount: number;
  description?: string;
}

interface ExpenseEntryCardProps {
  onSubmit: (data: ExpenseFormData) => Promise<void>;
}

export const ExpenseEntryCard: React.FC<ExpenseEntryCardProps> = ({ onSubmit }) => {
  const { categories, expenses } = useExpenses();
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

  const [expenseData, setExpenseData] = useState({
    date: getCurrentDateTimeLocal(),
    category: '',
    amount: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get unique categories from expenses
  const uniqueCategories = Array.from(new Set(expenses.map(exp => exp.category))).filter(Boolean);
  
  // Get default categories from the hook (fallback if no expenses exist yet)
  const defaultCategoryValues = categories.map(cat => cat.value);
  
  // Combine both sources and get unique values
  const allCategories = Array.from(new Set([...uniqueCategories, ...defaultCategoryValues]));

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย';
      showError('เกิดข้อผิดพลาด', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      tabIndex={0}
      role="region"
      aria-label="แบบฟอร์มบันทึกค่าใช้จ่าย"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            บันทึกค่าใช้จ่าย
          </h2>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Date and Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📅 วันที่และเวลา
          </label>
          <input
            type="datetime-local"
            value={expenseData.date}
            onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
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
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
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
                  className={`w-full px-4 py-3 text-left transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${
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
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
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
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
            rows={3}
            placeholder="เพิ่มรายละเอียด..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {submitting ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>กำลังบันทึก...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>บันทึกค่าใช้จ่าย</span>
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

