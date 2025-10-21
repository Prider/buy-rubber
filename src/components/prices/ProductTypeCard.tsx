'use client';

import React from 'react';

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ProductTypeCardProps {
  productType: ProductType;
  index: number;
  onEdit: (productType: ProductType) => void;
  onDelete: (productType: ProductType) => void;
}

export default function ProductTypeCard({ productType, index, onEdit, onDelete }: ProductTypeCardProps) {
  return (
    <div
      className="group relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative inline-flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border border-gray-200 dark:border-gray-700">
        {/* Gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-blue-500/10 dark:from-primary-500/20 dark:to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative flex items-center space-x-3">
          <span className="text-xs font-bold font-mono bg-gradient-to-r from-primary-500 to-blue-600 text-transparent bg-clip-text px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {productType.code}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {productType.name}
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="relative flex items-center space-x-1 ml-2 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
          <button
            onClick={() => onEdit(productType)}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            title="แก้ไข"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(productType)}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            title="ลบ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

