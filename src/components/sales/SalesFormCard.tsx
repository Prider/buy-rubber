'use client';

import { useMemo, useState, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import {
  computeSaleProfitPreview,
  computeTotalPreview,
  isSalesFormSubmitReady,
  type SaleExpenseLine,
  type SaleFormData,
} from '@/app/(authenticated)/sales/page.utils';
import { EXPENSE_TYPES, SELLING_TYPES } from '@/components/sales/salesFormCard.constants';
import {
  getSalesFormCardBorderClass,
  getSalesFormCardTitle,
  getSalesFormLayoutClasses,
  getSalesFormSaveButtonText,
} from '@/components/sales/salesFormCardUi';
import type { DestinationCompany } from '@/types/destinationCompany';

interface ProductType {
  id: string;
  code: string;
  name: string;
}

type SalesFormFieldName =
  | 'date'
  | 'destinationCompanyId'
  | 'companyName'
  | 'productTypeId'
  | 'weight'
  | 'rubberPercent'
  | 'pricePerUnit'
  | 'sellingType';

function Field({
  label,
  children,
  className = '',
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 min-w-[7rem] flex-1 ${className}`}>
      <label className="block text-xs font-medium whitespace-nowrap">{label}</label>
      {children}
    </div>
  );
}

export interface SalesFormCardProps {
  /** Tighter spacing for viewport-fit layouts (e.g. sales page). */
  compact?: boolean;
  /** Initial fold state; form body starts open when true (default). */
  defaultOpen?: boolean;
  error: string;
  productTypes: ProductType[];
  formData: SaleFormData;
  selectedStockKg?: number | null;
  selectedAvgCostPerKg?: number | null;
  fieldErrors?: Partial<Record<SalesFormFieldName, string>>;
  hasValidationError?: boolean;
  saving: boolean;
  isEditing?: boolean;
  editingSaleNo?: string | null;
  companySearchTerm: string;
  showCompanyDropdown: boolean;
  filteredCompanies: DestinationCompany[];
  onCompanySearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCompanySelect: (company: DestinationCompany) => void;
  onClearCompanySearch: () => void;
  onShowCompanyDropdown: (show: boolean) => void;
  onAddExpense: () => void;
  onRemoveExpense: (expenseId: string) => void;
  onExpenseChange: (expenseId: string, field: keyof Omit<SaleExpenseLine, 'id'>, value: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
  onCancelEdit?: () => void;
}

function ChevronIcon({ open, className = 'h-5 w-5' }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`shrink-0 text-gray-500 transition-transform duration-300 dark:text-gray-400 ${open ? 'rotate-180' : 'rotate-0'} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

const PANEL_ID = 'sales-form-card-panel';

export default function SalesFormCard({
  compact = false,
  defaultOpen = true,
  error,
  productTypes,
  formData,
  selectedStockKg = null,
  selectedAvgCostPerKg = null,
  fieldErrors = {},
  hasValidationError = false,
  saving,
  isEditing = false,
  editingSaleNo = null,
  companySearchTerm,
  showCompanyDropdown,
  filteredCompanies,
  onCompanySearchChange,
  onCompanySelect,
  onClearCompanySearch,
  onShowCompanyDropdown,
  onAddExpense,
  onRemoveExpense,
  onExpenseChange,
  onInputChange,
  onSave,
  onCancelEdit,
}: SalesFormCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hideDropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companySearchRef = useRef<HTMLInputElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const totalPreview = useMemo(() => computeTotalPreview(formData), [formData]);
  const profitPreview = useMemo(
    () => computeSaleProfitPreview(formData, selectedAvgCostPerKg),
    [formData, selectedAvgCostPerKg],
  );
  const submitReady = useMemo(() => isSalesFormSubmitReady(formData), [formData]);
  const layout = getSalesFormLayoutClasses(compact);
  const cardBorderClass = getSalesFormCardBorderClass(isEditing);
  const titleText = getSalesFormCardTitle(isEditing, editingSaleNo);
  const saveButtonText = getSalesFormSaveButtonText(saving, isEditing);
  const companyDisabled = isEditing; // same as other non-price fields
  const isFieldDisabled = (field: SalesFormFieldName) => isEditing && field !== 'pricePerUnit';
  const getInputClass = (field: SalesFormFieldName) =>
    `${layout.inputClass} ${
      fieldErrors[field]
        ? 'border-red-500 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-500'
        : isEditing && field === 'pricePerUnit'
          ? 'border-violet-500 ring-2 ring-violet-300 focus:border-violet-500 focus:ring-violet-400 dark:border-violet-400 dark:ring-violet-500/50'
          : ''
    }`;

  const clearHideTimeout = () => {
    if (hideDropdownTimeoutRef.current) {
      clearTimeout(hideDropdownTimeoutRef.current);
      hideDropdownTimeoutRef.current = null;
    }
  };

  const scheduleDropdownHide = () => {
    clearHideTimeout();
    hideDropdownTimeoutRef.current = setTimeout(() => {
      onShowCompanyDropdown(false);
    }, 150);
  };

  const handleCompanySearchFocus = () => {
    if (companyDisabled) return;
    clearHideTimeout();
    onShowCompanyDropdown(true);
  };

  const focusCompanyOption = (index: number) => {
    const options = companyDropdownRef.current?.querySelectorAll<HTMLButtonElement>('[data-company-option]');
    if (!options || options.length === 0) return;
    const targetIndex = Math.max(0, Math.min(index, options.length - 1));
    options[targetIndex]?.focus();
  };

  const handleCompanySearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (companyDisabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onShowCompanyDropdown(true);
      focusCompanyOption(0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onShowCompanyDropdown(false);
    }
  };

  const handleCompanyOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusCompanyOption(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) {
        companySearchRef.current?.focus();
      } else {
        focusCompanyOption(index - 1);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onShowCompanyDropdown(false);
      companySearchRef.current?.focus();
    }
  };

  const handleCompanySelectWithClose = (company: DestinationCompany) => {
    onCompanySelect(company);
    clearHideTimeout();
    onShowCompanyDropdown(false);
  };

  return (
    <div
      data-testid="sales-form-card"
      className={`flex w-full flex-col rounded-2xl border bg-white shadow-lg dark:bg-gray-800 ${
        isOpen ? 'overflow-visible' : 'overflow-hidden'
      } ${cardBorderClass}`}
    >
      <button
        type="button"
        id="sales-form-card-toggle"
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 ${layout.headerBtnPad} border-b border-gray-200 dark:border-gray-600`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className={`min-w-0 ${layout.titleClass}`}>
            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
              {titleText}
            </span>
          </h2>
          {!isOpen && error ? (
            <span
              className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-200"
              title={error}
            >
              มีข้อผิดพลาด
            </span>
          ) : null}
        </div>
        <span className="sr-only">{isOpen ? 'พับฟอร์ม' : 'ขยายฟอร์ม'}</span>
        <ChevronIcon open={isOpen} className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </button>

      <div
        id={PANEL_ID}
        role="region"
        aria-labelledby="sales-form-card-toggle"
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className={`min-h-0 ${isOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
          <div className={layout.bodyPad}>
            {error ? (
              <div
                className={`shrink-0 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 ${
                  compact ? 'p-1.5 text-xs' : 'p-2 text-sm'
                }`}
              >
                {error}
              </div>
            ) : null}

            <div
              className={`relative flex flex-wrap xl:flex-nowrap items-end ${layout.rowGap} w-full min-w-0 pb-0.5 ${
                showCompanyDropdown && !companyDisabled ? 'z-50' : 'z-10'
              }`}
            >
              <Field label="วันที่" className="min-w-[9.5rem] max-w-[10rem]">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={onInputChange}
                  disabled={isFieldDisabled('date')}
                  className={getInputClass('date')}
                />
              </Field>
              <Field
                label={
                  <>
                    ชื่อบริษัทปลายทาง <span className="text-red-500">*</span>
                  </>
                }
                className="relative z-50 min-w-[12rem] flex-[1.5]"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={companySearchRef}
                    type="text"
                    data-testid="sales-company-search"
                    value={companySearchTerm}
                    onChange={onCompanySearchChange}
                    onFocus={handleCompanySearchFocus}
                    onBlur={scheduleDropdownHide}
                    onKeyDown={handleCompanySearchKeyDown}
                    disabled={companyDisabled}
                    className={`${getInputClass('destinationCompanyId')} pl-8 pr-8 disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="ค้นหาบริษัทตามชื่อหรือรหัส"
                    autoComplete="off"
                  />
                  {companySearchTerm && !companyDisabled ? (
                    <button
                      type="button"
                      onClick={onClearCompanySearch}
                      disabled={saving}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="ล้างการค้นหาบริษัท"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : null}

                  {/* Dropdown — same pattern as PurchaseEntryCard member selector */}
                  {showCompanyDropdown && !companyDisabled && filteredCompanies.length > 0 ? (
                    <div
                      ref={companyDropdownRef}
                      className="absolute left-0 right-0 top-full z-[100] mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                      onMouseEnter={clearHideTimeout}
                      onMouseLeave={scheduleDropdownHide}
                    >
                      {filteredCompanies.map((company, index) => (
                        <button
                          key={company.id}
                          type="button"
                          data-company-option
                          data-testid={`sales-company-option-${company.id}`}
                          onClick={() => handleCompanySelectWithClose(company)}
                          onFocus={clearHideTimeout}
                          onBlur={scheduleDropdownHide}
                          onKeyDown={(event) => handleCompanyOptionKeyDown(event, index)}
                          disabled={saving}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {company.code} - {company.name}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* No results — redirect to create company */}
                  {showCompanyDropdown &&
                  !companyDisabled &&
                  companySearchTerm &&
                  filteredCompanies.length === 0 ? (
                    <div
                      className="absolute left-0 right-0 top-full z-[100] mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-3"
                      onMouseEnter={clearHideTimeout}
                      onMouseLeave={scheduleDropdownHide}
                    >
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-xs font-medium mb-2">ไม่พบบริษัทที่ตรงกับคำค้นหา</p>
                        <button
                          type="button"
                          onClick={() => router.push('/destination-companies?showAddModal=true')}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                          </svg>
                          เพิ่มบริษัทใหม่
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Field>
              <Field label="รูปแบบการขาย" className="min-w-[8.5rem] max-w-[10rem]">
                <select
                  name="sellingType"
                  value={formData.sellingType}
                  onChange={onInputChange}
                  disabled={isFieldDisabled('sellingType')}
                  className={getInputClass('sellingType')}
                >
                  {SELLING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ประเภทสินค้า" className="!flex-none min-w-[8.5rem] max-w-[11rem] w-[10rem] shrink-0">
                <select
                  name="productTypeId"
                  value={formData.productTypeId}
                  onChange={onInputChange}
                  disabled={isFieldDisabled('productTypeId')}
                  className={getInputClass('productTypeId')}
                >
                  <option value="">เลือกประเภทสินค้า</option>
                  {productTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.code} - {pt.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="%ยาง" className="min-w-[6.5rem] max-w-[7rem]">
                <input
                  type="number"
                  step="0.01"
                  name="rubberPercent"
                  value={formData.rubberPercent}
                  onChange={onInputChange}
                  disabled={isFieldDisabled('rubberPercent')}
                  className={getInputClass('rubberPercent')}
                />
              </Field>
              <Field label="น้ำหนัก (กก.)" className="min-w-[8.5rem] max-w-[10rem]">
                {formData.productTypeId ? (
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400">
                    <span className="min-w-0 truncate">
                      คงเหลือ:{' '}
                      <span className="font-semibold">
                        {selectedStockKg != null ? Number(selectedStockKg).toLocaleString('th-TH') : '-'}
                      </span>{' '}
                      กก.
                    </span>
                    {selectedStockKg != null && !isFieldDisabled('weight') ? (
                      <button
                        type="button"
                        data-testid="sales-fill-weight-stock"
                        title="เติมน้ำหนักคงเหลือทั้งหมด"
                        disabled={saving}
                        onClick={() => {
                          onInputChange({
                            target: { name: 'weight', value: String(selectedStockKg) },
                          } as React.ChangeEvent<HTMLInputElement>);
                        }}
                        className="shrink-0 rounded border border-red-300 bg-red-50 px-1 py-0.5 text-[10px] font-medium leading-none text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                      >
                        ทั้งหมด
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={onInputChange}
                  disabled={isFieldDisabled('weight')}
                  className={getInputClass('weight')}
                />
              </Field>
              <Field label="ราคา/กก." className="min-w-[8.5rem] max-w-[10rem]">
                {formData.productTypeId ? (
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400">
                    <span className="min-w-0 truncate">
                      ต้นทุนเฉลี่ย:{' '}
                      <span className="font-semibold">
                        {selectedAvgCostPerKg != null ? formatCurrency(selectedAvgCostPerKg) : '-'}
                      </span>
                    </span>
                    {selectedAvgCostPerKg != null && !isFieldDisabled('pricePerUnit') ? (
                      <button
                        type="button"
                        data-testid="sales-fill-price-avg-cost"
                        title="เติมราคาด้วยต้นทุนเฉลี่ย"
                        disabled={saving}
                        onClick={() => {
                          onInputChange({
                            target: { name: 'pricePerUnit', value: String(selectedAvgCostPerKg) },
                          } as React.ChangeEvent<HTMLInputElement>);
                        }}
                        className="shrink-0 rounded border border-red-300 bg-red-50 px-1 py-0.5 text-[10px] font-medium leading-none text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                      >
                        ต้นทุนเฉลี่ย
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={onInputChange}
                  disabled={isFieldDisabled('pricePerUnit')}
                  className={getInputClass('pricePerUnit')}
                />
              </Field>
            </div>

            <div
              className={`relative z-0 flex flex-col ${layout.rowGap} w-full min-w-0 border-t border-gray-100 py-0.5 dark:border-gray-700 ${compact ? 'pt-1' : 'pb-1 pt-1'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">ค่าใช้จ่าย</span>
                {!isEditing ? (
                  <button
                    type="button"
                    data-testid="sales-add-expense"
                    onClick={onAddExpense}
                    disabled={saving}
                    className={`shrink-0 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50 ${
                      compact ? 'px-3 py-1 text-sm font-medium' : 'px-4 py-2 text-base font-medium'
                    }`}
                  >
                    + เพิ่มค่าใช้จ่าย
                  </button>
                ) : null}
              </div>

              {formData.expenses.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isEditing ? 'ไม่มีค่าใช้จ่าย' : 'ยังไม่มีค่าใช้จ่าย — กด “เพิ่มค่าใช้จ่าย” หากต้องการ'}
                </p>
              ) : (
                <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2'}`}>
                  {formData.expenses.map((line, index) => (
                    <div
                      key={line.id}
                      data-testid={`sales-expense-row-${index}`}
                      className={`flex flex-wrap xl:flex-nowrap items-end ${layout.rowGap} w-full min-w-0`}
                    >
                      <Field label={index === 0 ? 'ชนิดค่าใช้จ่าย' : ''} className="!flex-none min-w-[6.5rem] max-w-[8.5rem] w-[8rem] shrink-0">
                        <select
                          value={line.type}
                          onChange={(e) => onExpenseChange(line.id, 'type', e.target.value)}
                          disabled={isEditing || saving}
                          className={getInputClass('sellingType')}
                        >
                          <option value="">เลือกชนิด</option>
                          {EXPENSE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={index === 0 ? 'จำนวนเงิน (บาท)' : ''} className="min-w-[7.5rem] max-w-[9rem]">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.amount}
                          onChange={(e) => onExpenseChange(line.id, 'amount', e.target.value)}
                          disabled={isEditing || saving}
                          className={getInputClass('sellingType')}
                        />
                      </Field>
                      <Field label={index === 0 ? 'หมายเหตุ' : ''} className="min-w-[12rem] max-w-[20rem] flex-[1.5]">
                        <input
                          value={line.note}
                          onChange={(e) => onExpenseChange(line.id, 'note', e.target.value)}
                          disabled={isEditing || saving}
                          placeholder="เช่น ค่าขนส่ง..."
                          className={getInputClass('sellingType')}
                        />
                      </Field>
                      {!isEditing ? (
                        <button
                          type="button"
                          aria-label="ลบค่าใช้จ่าย"
                          onClick={() => onRemoveExpense(line.id)}
                          disabled={saving}
                          className={`shrink-0 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30 ${
                            compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'
                          }`}
                        >
                          ลบ
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`flex w-full shrink-0 flex-wrap items-center xl:ml-auto xl:w-auto xl:justify-end ${compact ? 'gap-2' : 'gap-3 pb-0.5'}`}
              >
                {isEditing && onCancelEdit ? (
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    disabled={saving}
                    className={`shrink-0 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 ${
                      compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
                    }`}
                  >
                    ยกเลิกการแก้ไข
                  </button>
                ) : null}
                <div
                  className={`rounded-lg bg-gray-50 whitespace-nowrap dark:bg-gray-700 ${
                    compact
                      ? 'min-w-0 px-3 py-1.5 text-xs sm:text-sm'
                      : 'min-w-[18rem] px-5 py-2.5 text-sm sm:min-w-[22rem]'
                  }`}
                >
                  ยอดรวม: <span className="font-semibold">{formatCurrency(totalPreview)}</span>
                  {profitPreview != null ? (
                    <>
                      <span className="mx-2 text-gray-300 dark:text-gray-500">|</span>
                      กำไร/ขาดทุน:{' '}
                      <span
                        className={`font-semibold ${
                          profitPreview > 1e-6
                            ? 'text-green-600 dark:text-green-400'
                            : profitPreview < -1e-6
                              ? 'text-red-600 dark:text-red-400'
                              : ''
                        }`}
                      >
                        {profitPreview > 1e-6 ? '+' : ''}
                        {formatCurrency(profitPreview)}
                      </span>
                    </>
                  ) : null}
                </div>
                <button
                  type="button"
                  data-testid="sales-form-save"
                  onClick={onSave}
                  disabled={saving || hasValidationError || !submitReady}
                  className={`shrink-0 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${
                    compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
                  }`}
                >
                  {saveButtonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
