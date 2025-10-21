'use client';

import React from 'react';

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ProductTypeFormModalProps {
  isOpen: boolean;
  editingProductType: ProductType | null;
  formData: {
    code: string;
    name: string;
    description: string;
  };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string) => void;
}

export default function ProductTypeFormModal({
  isOpen,
  editingProductType,
  formData,
  onClose,
  onSubmit,
  onChange,
}: ProductTypeFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {editingProductType ? 'แก้ไขประเภทสินค้า' : 'เพิ่มประเภทสินค้า'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                รหัสประเภท <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => onChange('code', e.target.value.toUpperCase())}
                className="input"
                placeholder="เช่น FRESH, DRY"
                required
                disabled={!!editingProductType}
                maxLength={10}
              />
              {editingProductType && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ไม่สามารถแก้ไขรหัสประเภทได้
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ชื่อประเภท <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="input"
                placeholder="เช่น น้ำยางสด, ยางแห้ง"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                คำอธิบาย
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onChange('description', e.target.value)}
                className="input"
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                {editingProductType ? 'บันทึก' : 'เพิ่ม'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

