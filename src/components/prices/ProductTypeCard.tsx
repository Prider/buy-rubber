'use client';

import React from 'react';

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface ProductTypeCardProps {
  productType: ProductType;
  onEdit: (productType: ProductType) => void;
  onDelete: (productType: ProductType) => void;
  onSuspend: (productType: ProductType) => void;
  onReactivate: (productType: ProductType) => void;
}

const actionClass =
  'rounded-md px-2 py-1 text-xs font-medium transition-colors';

export default function ProductTypeCard({
  productType,
  onEdit,
  onDelete,
  onSuspend,
  onReactivate,
}: ProductTypeCardProps) {
  const isInactive = productType.isActive === false;

  return (
    <li
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 ${
        isInactive ? 'bg-gray-50/80 dark:bg-gray-900/30' : ''
      }`}
    >
      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
        {productType.code}
      </span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {productType.name}
      </span>
      {isInactive ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          กำลังนำส่ง
        </span>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(productType)}
          className={`${actionClass} text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700`}
        >
          แก้ไข
        </button>
        {isInactive ? (
          <button
            type="button"
            onClick={() => onReactivate(productType)}
            className={`${actionClass} text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30`}
          >
            เปิดใช้งาน
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSuspend(productType)}
              className={`${actionClass} text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/30`}
            >
              กำลังนำส่ง
            </button>
            <button
              type="button"
              onClick={() => onDelete(productType)}
              className={`${actionClass} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30`}
            >
              ลบ
            </button>
          </>
        )}
      </div>
    </li>
  );
}
