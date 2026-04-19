'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { formatCurrency } from '@/lib/utils';
import { computeTotalPreview } from '@/app/(authenticated)/sales/page.utils';
import { EXPENSE_TYPES, SELLING_TYPES } from '@/components/sales/salesFormCard.constants';
import {
  getSalesFormCardBorderClass,
  getSalesFormCardTitle,
  getSalesFormLayoutClasses,
  getSalesFormSaveButtonText,
} from '@/components/sales/salesFormCardUi';

interface ProductType {
  id: string;
  code: string;
  name: string;
}

interface SaleFormData {
  date: string;
  companyName: string;
  productTypeId: string;
  weight: string;
  rubberPercent: string;
  pricePerUnit: string;
  expenseType: string;
  expenseCost: string;
  expenseNote: string;
  sellingType: string;
}
type SalesFormFieldName =
  | 'date'
  | 'companyName'
  | 'productTypeId'
  | 'weight'
  | 'rubberPercent'
  | 'pricePerUnit'
  | 'expenseType'
  | 'expenseCost'
  | 'expenseNote'
  | 'sellingType';

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
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
  isSubmitReady?: boolean;
  saving: boolean;
  isEditing?: boolean;
  editingSaleNo?: string | null;
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
  isSubmitReady = false,
  saving,
  isEditing = false,
  editingSaleNo = null,
  onInputChange,
  onSave,
  onCancelEdit,
}: SalesFormCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const totalPreview = useMemo(() => computeTotalPreview(formData), [formData]);
  const layout = getSalesFormLayoutClasses(compact);
  const cardBorderClass = getSalesFormCardBorderClass(isEditing);
  const titleText = getSalesFormCardTitle(isEditing, editingSaleNo);
  const saveButtonText = getSalesFormSaveButtonText(saving, isEditing);
  const getInputClass = (field: SalesFormFieldName) =>
    `${layout.inputClass} ${
      fieldErrors[field]
        ? 'border-red-500 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-500'
        : ''
    }`;

  return (
    <div
      data-testid="sales-form-card"
      className={`flex w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-lg dark:bg-gray-800 ${cardBorderClass}`}
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
          <h2 className={`min-w-0 ${layout.titleClass}`}>{titleText}</h2>
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
        <div className="min-h-0 overflow-hidden">
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
              className={`flex flex-wrap xl:flex-nowrap items-end ${layout.rowGap} w-full min-w-0 overflow-x-auto pb-0.5`}
            >
              <Field label="วันที่" className="min-w-[9.5rem] max-w-[10rem]">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={onInputChange}
                  className={getInputClass('date')}
                />
              </Field>
              <Field label="ชื่อบริษัทปลายทาง" className="min-w-[10rem] flex-[1.25]">
                <input
                  name="companyName"
                  value={formData.companyName}
                  onChange={onInputChange}
                  className={getInputClass('companyName')}
                  placeholder="เช่น บริษัท A"
                />
              </Field>
              <Field label="รูปแบบการขาย" className="min-w-[8.5rem] max-w-[10rem]">
                <select
                  name="sellingType"
                  value={formData.sellingType}
                  onChange={onInputChange}
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
                  className={getInputClass('rubberPercent')}
                />
              </Field>
              <Field label="น้ำหนัก (กก.)" className="min-w-[7rem] max-w-[8rem]">
                {formData.productTypeId ? (
                  <div className="mb-1 text-[11px] text-red-500 dark:text-red-400">
                    คงเหลือ: <span className="font-semibold">{selectedStockKg != null ? Number(selectedStockKg).toLocaleString('th-TH') : '-'}</span> กก.
                  </div>
                ) : null}
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={onInputChange}
                  className={getInputClass('weight')}
                />
              </Field>
              <Field label="ราคา/กก." className="min-w-[7rem] max-w-[8rem]">
                {formData.productTypeId ? (
                  <div className="mb-1 text-[11px] text-red-500 dark:text-red-500">
                    ต้นทุนเฉลี่ย: <span className="font-semibold">{selectedAvgCostPerKg != null ? formatCurrency(selectedAvgCostPerKg) : '-'}</span>
                  </div>
                ) : null}
                <input
                  type="number"
                  step="0.01"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={onInputChange}
                  className={getInputClass('pricePerUnit')}
                />
              </Field>
            </div>

            <div
              className={`flex flex-wrap xl:flex-nowrap items-end ${layout.rowGap} w-full min-w-0 overflow-x-auto border-t border-gray-100 py-0.5 dark:border-gray-700 ${compact ? 'pt-1' : 'pb-1 pt-1'}`}
            >
              <Field label="ชนิดค่าใช้จ่าย" className="!flex-none min-w-[6.5rem] max-w-[8.5rem] w-[8rem] shrink-0">
                <select
                  name="expenseType"
                  value={formData.expenseType}
                  onChange={onInputChange}
                  className={getInputClass('expenseType')}
                >
                  <option value="">ไม่ระบุ</option>
                  {EXPENSE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ค่าใช้จ่าย (บาท)" className="min-w-[7.5rem] max-w-[9rem]">
                <input
                  type="number"
                  step="0.01"
                  name="expenseCost"
                  value={formData.expenseCost}
                  onChange={onInputChange}
                  className={getInputClass('expenseCost')}
                />
              </Field>
              <Field label="หมายเหตุค่าใช้จ่าย" className="min-w-[10rem] flex-[1.5]">
                <input
                  name="expenseNote"
                  value={formData.expenseNote}
                  onChange={onInputChange}
                  placeholder="เช่น ค่าขนส่ง..."
                  className={getInputClass('expenseNote')}
                />
              </Field>
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
                  ยอดรวมประมาณการ: <span className="font-semibold">{formatCurrency(totalPreview)}</span>
                </div>
                <button
                  type="button"
                  data-testid="sales-form-save"
                  onClick={onSave}
                  disabled={saving || hasValidationError || !isSubmitReady}
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
