'use client';

import { useMemo, type ReactNode } from 'react';
import { formatCurrency } from '@/lib/utils';

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

const SELLING_TYPES = ['จ่ายสด', 'ขายล่วง', 'ฝาก'];
const EXPENSE_TYPES = ['ค่าขนส่ง', 'ค่าแรง', 'ค่าบริการ', 'อื่นๆ'];

const INPUT_CLASS =
  'w-full min-w-0 px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600';

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

interface SalesFormCardProps {
  /** Tighter spacing for viewport-fit layouts (e.g. sales page). */
  compact?: boolean;
  error: string;
  productTypes: ProductType[];
  formData: SaleFormData;
  totalPreview: number;
  saving: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
}

export default function SalesFormCard({
  compact = false,
  error,
  productTypes,
  formData,
  totalPreview,
  saving,
  onInputChange,
  onSave,
}: SalesFormCardProps) {
  const buttonText = useMemo(() => {
    return saving ? 'กำลังบันทึก...' : 'บันทึก Selling Transactions';
  }, [saving]);

  const inputClass = compact
    ? 'w-full min-w-0 px-2.5 py-1.5 text-sm border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600'
    : INPUT_CLASS;

  const headerPad = compact ? 'px-4 py-2' : 'px-6 py-4';
  const titleClass = compact
    ? 'text-base font-bold text-gray-900 dark:text-white'
    : 'text-xl font-bold text-gray-900 dark:text-white';
  const bodyPad = compact ? 'p-2.5 flex flex-col gap-2 min-w-0' : 'p-4 flex flex-col gap-3 min-w-0';
  const rowGap = compact ? 'gap-2' : 'gap-3';

  return (
    <div className="w-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className={`${headerPad} border-b border-gray-200 dark:border-gray-600`}>
        <h2 className={titleClass}>บันทึกการขาย</h2>
      </div>

      <div className={bodyPad}>
        {error && (
          <div
            className={`shrink-0 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 ${
              compact ? 'p-1.5 text-xs' : 'p-2 text-sm'
            }`}
          >
            {error}
          </div>
        )}

        {/* Row 1: main sale fields */}
        <div className={`flex flex-wrap xl:flex-nowrap items-end ${rowGap} w-full min-w-0 overflow-x-auto pb-0.5`}>
          <Field label="วันที่" className="min-w-[9.5rem] max-w-[10rem]">
            <input type="date" name="date" value={formData.date} onChange={onInputChange} className={inputClass} />
          </Field>
          <Field label="ชื่อบริษัทปลายทาง" className="min-w-[10rem] flex-[1.25]">
            <input
              name="companyName"
              value={formData.companyName}
              onChange={onInputChange}
              className={inputClass}
              placeholder="เช่น บริษัท A"
            />
          </Field>
          <Field label="รูปแบบการขาย" className="min-w-[8.5rem] max-w-[10rem]">
            <select name="sellingType" value={formData.sellingType} onChange={onInputChange} className={inputClass}>
              {SELLING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ประเภทสินค้า" className="!flex-none min-w-[8.5rem] max-w-[11rem] w-[10rem] shrink-0">
            <select name="productTypeId" value={formData.productTypeId} onChange={onInputChange} className={inputClass}>
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
              className={inputClass}
            />
          </Field>
          <Field label="น้ำหนัก (กก.)" className="min-w-[7rem] max-w-[8rem]">
            <input
              type="number"
              step="0.01"
              name="weight"
              value={formData.weight}
              onChange={onInputChange}
              className={inputClass}
            />
          </Field>
          <Field label="ราคา/กก." className="min-w-[7rem] max-w-[8rem]">
            <input
              type="number"
              step="0.01"
              name="pricePerUnit"
              value={formData.pricePerUnit}
              onChange={onInputChange}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Row 2: expense fields + total + save */}
        <div
          className={`flex flex-wrap xl:flex-nowrap items-end ${rowGap} w-full min-w-0 overflow-x-auto border-t border-gray-100 py-0.5 dark:border-gray-700 ${compact ? 'pt-1' : 'pb-1 pt-1'}`}
        >
          <Field label="ชนิดค่าใช้จ่าย" className="!flex-none min-w-[6.5rem] max-w-[8.5rem] w-[8rem] shrink-0">
            <select name="expenseType" value={formData.expenseType} onChange={onInputChange} className={inputClass}>
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
              className={inputClass}
            />
          </Field>
          <Field label="หมายเหตุค่าใช้จ่าย" className="min-w-[10rem] flex-[1.5]">
            <input
              name="expenseNote"
              value={formData.expenseNote}
              onChange={onInputChange}
              placeholder="เช่น ค่าขนส่ง..."
              className={inputClass}
            />
          </Field>
          <div
            className={`flex w-full shrink-0 flex-wrap items-center xl:ml-auto xl:w-auto xl:justify-end ${compact ? 'gap-2' : 'gap-3 pb-0.5'}`}
          >
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
              onClick={onSave}
              disabled={saving}
              className={`shrink-0 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${
                compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
              }`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

