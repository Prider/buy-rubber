'use client';

import React from 'react';
import ProductTypeCard from './ProductTypeCard';
import { getMaxProductTypes } from '@/lib/maxProductTypes';

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface ProductTypeManagementProps {
  productTypes: ProductType[];
  onAdd: () => void;
  onEdit: (productType: ProductType) => void;
  onDelete: (productType: ProductType) => void;
  onSuspend: (productType: ProductType) => void;
  onReactivate: (productType: ProductType) => void;
}

const MAX_PRODUCT_TYPES = getMaxProductTypes();

export default function ProductTypeManagement({ 
  productTypes, 
  onAdd, 
  onEdit, 
  onDelete,
  onSuspend,
  onReactivate,
}: ProductTypeManagementProps) {
  const activeCount = productTypes.filter((productType) => productType.isActive !== false).length;
  const inactiveCount = productTypes.length - activeCount;
  const isMaxReached = productTypes.length >= MAX_PRODUCT_TYPES;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            ประเภทสินค้า
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            ใช้งาน {activeCount} · กำลังนำส่ง {inactiveCount} · สูงสุด {MAX_PRODUCT_TYPES}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={isMaxReached}
          className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
        >
          <span aria-hidden="true">+</span>
          <span>{isMaxReached ? 'ครบจำนวนสูงสุด' : 'เพิ่มประเภท'}</span>
        </button>
      </div>

      {isMaxReached && (
        <p className="border-b border-gray-100 px-5 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          สามารถเพิ่มประเภทสินค้าได้สูงสุด {MAX_PRODUCT_TYPES} รายการ
        </p>
      )}

      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {productTypes.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            ยังไม่มีประเภทสินค้า
          </li>
        ) : (
          productTypes.map((productType) => (
            <ProductTypeCard
              key={productType.id}
              productType={productType}
              onEdit={onEdit}
              onDelete={onDelete}
              onSuspend={onSuspend}
              onReactivate={onReactivate}
            />
          ))
        )}
      </ul>
    </section>
  );
}
