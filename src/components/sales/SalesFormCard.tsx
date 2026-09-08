'use client';

import { useMemo, useState, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet } from 'animal-island-ui';
import { formatNumber } from '@/lib/utils';
import {
  computeSaleProfitPreview,
  computeTotalPreview,
  isSalesFormSubmitReady,
  type SaleExpenseLine,
  type SaleFormData,
} from '@/app/(authenticated)/sales/page.utils';
import { EXPENSE_TYPES, MAX_SALE_EXPENSES, SELLING_TYPES } from '@/components/sales/salesFormCard.constants';
import {
  getSalesFormCardBorderClass,
  getSalesFormCardTitle,
  getSalesFormLayoutClasses,
  getSalesFormSaveButtonText,
  getSalesWalletStyle,
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

function openDatePicker(input: HTMLInputElement) {
  try {
    input.showPicker?.();
  } catch {
    // showPicker can throw if the input is not user-activated in some browsers
  }
}

function Field({
  label,
  hint,
  action,
  children,
  className = '',
}: {
  label?: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const showHeader = label != null && label !== '';
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      {showHeader ? (
        <div className="mb-1.5 flex min-h-[1.25rem] items-center justify-between gap-2">
          <label className="block truncate text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </label>
          {hint || action ? (
            <div className="flex min-w-0 shrink items-center gap-1.5">
              {hint}
              {action}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function HintButton({
  children,
  disabled,
  onClick,
  testId,
  title,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  testId: string;
  title: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="shrink-0 text-[11px] font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
    >
      {children}
    </button>
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
      className={`shrink-0 text-gray-400 transition-transform duration-300 dark:text-gray-500 ${open ? 'rotate-180' : 'rotate-0'} ${className}`}
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
  const totalPreview = useMemo(() => {
    const total = computeTotalPreview(formData);
    return Number(total.toFixed(2));
  }, [formData]);
  const profitPreview = useMemo(() => {
    const profit = computeSaleProfitPreview(formData, selectedAvgCostPerKg);
    return profit == null ? null : Number(profit.toFixed(2));
  }, [formData, selectedAvgCostPerKg]);
  const hasCompanySelected = Boolean(
    String(formData.destinationCompanyId ?? '').trim() &&
      String(companySearchTerm ?? '').trim(),
  );
  const submitReady = useMemo(() => {
    if (!hasCompanySelected) return false;
    return isSalesFormSubmitReady(formData);
  }, [formData, hasCompanySelected]);
  const canSave = !saving && !hasValidationError && submitReady;
  const atExpenseLimit = formData.expenses.length >= MAX_SALE_EXPENSES;
  const layout = getSalesFormLayoutClasses(compact);
  const cardBorderClass = getSalesFormCardBorderClass(isEditing);
  const titleText = getSalesFormCardTitle(isEditing, editingSaleNo);
  const saveButtonText = getSalesFormSaveButtonText(saving, isEditing);
  const companyDisabled = isEditing;
  const isFieldDisabled = (field: SalesFormFieldName) => isEditing && field !== 'pricePerUnit';
  const getInputClass = (field: SalesFormFieldName) =>
    `${layout.inputClass} ${
      fieldErrors[field]
        ? 'border-red-500 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-100'
        : isEditing && field === 'pricePerUnit'
          ? 'border-violet-400 ring-2 ring-violet-200 focus:border-violet-500 focus:ring-violet-100 dark:border-violet-400 dark:ring-violet-500/40'
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

  const fillField = (name: 'weight' | 'pricePerUnit', value: number) => {
    onInputChange({
      target: { name, value: Number(value).toFixed(2) },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const formatFieldToTwoDecimals = (name: 'weight' | 'pricePerUnit') => {
    const raw = formData[name].trim();
    if (raw === '') return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const formatted = n.toFixed(2);
    if (formatted === formData[name]) return;
    onInputChange({
      target: { name, value: formatted },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const btnClass = compact ? 'px-3.5 py-2 text-sm' : 'px-4 py-2.5 text-sm';

  return (
    <div
      data-testid="sales-form-card"
      className={`flex w-full flex-col rounded-2xl border bg-white shadow-sm dark:bg-gray-800 ${
        isOpen ? 'overflow-visible' : 'overflow-hidden'
      } ${cardBorderClass}`}
    >
      <button
        type="button"
        id="sales-form-card-toggle"
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30 ${layout.headerBtnPad} ${
          isOpen ? 'border-b border-gray-100 dark:border-gray-700' : ''
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <h2 className={`min-w-0 truncate ${layout.titleClass}`}>
            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
              {titleText}
            </span>
          </h2>
          {isEditing ? (
            <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
              กำลังแก้ไข
            </span>
          ) : null}
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
                className={`shrink-0 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 ${
                  compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm'
                }`}
              >
                {error}
              </div>
            ) : null}

            <div
              className={`relative flex w-full min-w-0 flex-nowrap items-end ${layout.rowGap} ${
                showCompanyDropdown && !companyDisabled ? 'z-50' : 'z-10'
              }`}
            >
              <Field label="วันที่" className="w-[9.75rem] shrink-0">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={onInputChange}
                  onClick={(e) => openDatePicker(e.currentTarget)}
                  onFocus={(e) => openDatePicker(e.currentTarget)}
                  disabled={isFieldDisabled('date')}
                  className={`${getInputClass('date')} cursor-pointer`}
                />
              </Field>
              <Field
                label={
                  <>
                    ชื่อบริษัทปลายทาง <span className="text-red-500">*</span>
                  </>
                }
                className="relative z-50 w-[18rem] shrink-0"
              >
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`${getInputClass('destinationCompanyId')} pl-9 pr-8`}
                    placeholder="ค้นหาบริษัทตามชื่อหรือรหัส"
                    autoComplete="off"
                  />
                  {companySearchTerm && !companyDisabled ? (
                    <button
                      type="button"
                      onClick={onClearCompanySearch}
                      disabled={saving}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-gray-300"
                      aria-label="ล้างการค้นหาบริษัท"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : null}

                  {showCompanyDropdown && !companyDisabled && filteredCompanies.length > 0 ? (
                    <div
                      ref={companyDropdownRef}
                      className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800"
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
                          className="w-full border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-700"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {company.code} - {company.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {showCompanyDropdown &&
                  !companyDisabled &&
                  companySearchTerm &&
                  filteredCompanies.length === 0 ? (
                    <div
                      className="absolute left-0 right-0 top-full z-[100] mt-1 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-600 dark:bg-gray-800"
                      onMouseEnter={clearHideTimeout}
                      onMouseLeave={scheduleDropdownHide}
                    >
                      <p className="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
                        ไม่พบบริษัทที่ตรงกับคำค้นหา
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/destination-companies?showAddModal=true')}
                        disabled={saving}
                        className="mx-auto flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        เพิ่มบริษัทใหม่
                      </button>
                    </div>
                  ) : null}
                </div>
              </Field>
              <Field label="รูปแบบการขาย" className="w-[8.75rem] shrink-0">
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
              <Field label="ประเภทสินค้า" className="min-w-[9rem] flex-[1.1]">
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
              <Field label="%ยาง" className="w-[4.75rem] shrink-0">
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
              <Field
                label="น้ำหนัก (กก.)"
                className="min-w-[8.5rem] flex-1"
                hint={
                  formData.productTypeId ? (
                    <span className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                      คงเหลือ {selectedStockKg != null ? Number(selectedStockKg).toLocaleString('th-TH') : '-'} กก.
                    </span>
                  ) : undefined
                }
                action={
                  formData.productTypeId && selectedStockKg != null && !isFieldDisabled('weight') ? (
                    <HintButton
                      testId="sales-fill-weight-stock"
                      title="เติมน้ำหนักคงเหลือทั้งหมด"
                      disabled={saving}
                      onClick={() => fillField('weight', selectedStockKg)}
                    >
                      ทั้งหมด
                    </HintButton>
                  ) : undefined
                }
              >
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={onInputChange}
                  onBlur={() => formatFieldToTwoDecimals('weight')}
                  disabled={isFieldDisabled('weight')}
                  className={getInputClass('weight')}
                />
              </Field>
              <Field
                label="ราคา/กก."
                className="min-w-[8.5rem] flex-1"
                hint={
                  formData.productTypeId ? (
                    <span className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                      ต้นทุน{' '}
                      {selectedAvgCostPerKg != null
                        ? `฿${formatNumber(Number(selectedAvgCostPerKg.toFixed(2)))}`
                        : '-'}
                    </span>
                  ) : undefined
                }
                action={
                  formData.productTypeId &&
                  selectedAvgCostPerKg != null &&
                  !isFieldDisabled('pricePerUnit') ? (
                    <HintButton
                      testId="sales-fill-price-avg-cost"
                      title="เติมราคาด้วยต้นทุนเฉลี่ย"
                      disabled={saving}
                      onClick={() => fillField('pricePerUnit', selectedAvgCostPerKg)}
                    >
                      ใช้ต้นทุน
                    </HintButton>
                  ) : undefined
                }
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={onInputChange}
                  onBlur={() => formatFieldToTwoDecimals('pricePerUnit')}
                  disabled={isFieldDisabled('pricePerUnit')}
                  className={getInputClass('pricePerUnit')}
                />
              </Field>
            </div>

            <div className={`relative z-0 flex flex-col ${layout.rowGap} w-full min-w-0 border-t border-gray-100 pt-3 dark:border-gray-700`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  ค่าใช้จ่าย
                  {formData.expenses.length > 0 ? (
                    <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
                      {formData.expenses.length}/{MAX_SALE_EXPENSES}
                    </span>
                  ) : null}
                </span>
                {!isEditing ? (
                  <button
                    type="button"
                    data-testid="sales-add-expense"
                    onClick={onAddExpense}
                    disabled={saving || atExpenseLimit}
                    title={atExpenseLimit ? `จำกัดค่าใช้จ่ายสูงสุด ${MAX_SALE_EXPENSES} รายการ` : undefined}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400"
                  >
                    {atExpenseLimit ? 'ครบจำนวนสูงสุด' : '+ เพิ่มค่าใช้จ่าย'}
                  </button>
                ) : null}
              </div>

              {formData.expenses.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {isEditing ? 'ไม่มีค่าใช้จ่าย' : 'ยังไม่มีค่าใช้จ่าย'}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {formData.expenses.map((line, index) => (
                    <div
                      key={line.id}
                      data-testid={`sales-expense-row-${index}`}
                      className="grid grid-cols-1 items-end gap-2 rounded-xl bg-gray-50 p-2.5 sm:grid-cols-[8.5rem_7.5rem_minmax(0,1fr)_auto] dark:bg-gray-900/40"
                    >
                      <Field label={index === 0 ? 'ชนิดค่าใช้จ่าย' : undefined}>
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
                      <Field label={index === 0 ? 'จำนวนเงิน (บาท)' : undefined}>
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
                      <Field label={index === 0 ? 'หมายเหตุ' : undefined}>
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
                          className={`inline-flex items-center justify-center rounded-xl border border-gray-200 font-medium text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-300 ${btnClass}`}
                        >
                          ลบ
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              <div className={`flex w-full flex-nowrap items-end justify-between ${compact ? 'gap-2' : 'gap-3'}`}>
                <div className="flex min-w-0 flex-nowrap items-end gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="flex h-[36px] items-center">ยอดรวม</span>
                  <Wallet value={totalPreview} size="small" style={getSalesWalletStyle(totalPreview)} />
                  {profitPreview != null ? (
                    <div className="flex h-[36px] min-w-0 items-center">
                      <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                      กำไร/ขาดทุน
                      <span
                        className={`px-2 font-semibold tabular-nums ${
                          profitPreview > 1e-6
                            ? 'text-green-600 dark:text-green-400'
                            : profitPreview < -1e-6
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {profitPreview > 1e-6 ? '+' : ''}
                        {`${profitPreview < 0 ? '-' : ''}฿${formatNumber(Math.abs(profitPreview))}`}
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="flex h-[42px] items-center gap-2">
                  {isEditing && onCancelEdit ? (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      disabled={saving}
                      className={`shrink-0 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 ${btnClass}`}
                    >
                      ยกเลิก
                    </button>
                  ) : null}
                  <button
                    type="button"
                    data-testid="sales-form-save"
                    onClick={onSave}
                    disabled={!canSave}
                    aria-disabled={!canSave}
                    className={`shrink-0 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:animate-none animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 dark:disabled:from-gray-400 dark:disabled:via-gray-400 dark:disabled:to-gray-400 ${btnClass}`}
                  >
                    {saveButtonText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
