'use client';

import { useMemo } from 'react';
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
  'w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600';

interface SalesFormCardProps {
  error: string;
  productTypes: ProductType[];
  formData: SaleFormData;
  totalPreview: number;
  saving: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
}

export default function SalesFormCard({
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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">บันทึกการขาย</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">กรอกข้อมูลการขายสินค้า</p>
      </div>

      <div className="p-4 overflow-y-auto space-y-3">
        {error && (
          <div className="p-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">วันที่</label>
            <input type="date" name="date" value={formData.date} onChange={onInputChange} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">ชื่อบริษัทปลายทาง</label>
            <input
              name="companyName"
              value={formData.companyName}
              onChange={onInputChange}
              className={INPUT_CLASS}
              placeholder="เช่น บริษัท A"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">ประเภทสินค้า</label>
            <select name="productTypeId" value={formData.productTypeId} onChange={onInputChange} className={INPUT_CLASS}>
              <option value="">เลือกประเภทสินค้า</option>
              {productTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.code} - {pt.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">เปอร์เซ็นต์ยาง (%)</label>
            <input
              type="number"
              step="0.01"
              name="rubberPercent"
              value={formData.rubberPercent}
              onChange={onInputChange}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">น้ำหนักที่ขาย (กก.)</label>
            <input
              type="number"
              step="0.01"
              name="weight"
              value={formData.weight}
              onChange={onInputChange}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">ราคา (บาท/กก.)</label>
            <input
              type="number"
              step="0.01"
              name="pricePerUnit"
              value={formData.pricePerUnit}
              onChange={onInputChange}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">ชนิดค่าใช้จ่าย</label>
            <select name="expenseType" value={formData.expenseType} onChange={onInputChange} className={INPUT_CLASS}>
              <option value="">ไม่ระบุ</option>
              {EXPENSE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">ค่าใช้จ่าย (บาท)</label>
            <input
              type="number"
              step="0.01"
              name="expenseCost"
              value={formData.expenseCost}
              onChange={onInputChange}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">หมายเหตุค่าใช้จ่าย</label>
          <input
            name="expenseNote"
            value={formData.expenseNote}
            onChange={onInputChange}
            placeholder="เช่น ค่าขนส่งจากท่า..."
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">รูปแบบการขาย</label>
          <select name="sellingType" value={formData.sellingType} onChange={onInputChange} className={INPUT_CLASS}>
            {SELLING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm">
          ยอดรวมประมาณการ: <span className="font-semibold">{formatCurrency(totalPreview)}</span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

