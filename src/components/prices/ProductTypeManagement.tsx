'use client';

import React from 'react';
import ProductTypeCard from './ProductTypeCard';

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ProductTypeManagementProps {
  productTypes: ProductType[];
  onAdd: () => void;
  onEdit: (productType: ProductType) => void;
  onDelete: (productType: ProductType) => void;
}

export default function ProductTypeManagement({ 
  productTypes, 
  onAdd, 
  onEdit, 
  onDelete 
}: ProductTypeManagementProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-primary-100 dark:border-gray-700 shadow-sm">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 dark:bg-primary-900 rounded-full -mr-32 -mt-32 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-100 dark:bg-blue-900 rounded-full -ml-24 -mb-24 opacity-20"></div>
      
      <div className="relative px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">📦</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                ประเภทสินค้า
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {productTypes.length} รายการ
              </p>
            </div>
          </div>
          <button
            onClick={onAdd}
            className="group relative px-4 py-2 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border border-primary-200 dark:border-primary-700"
          >
            <span className="flex items-center space-x-1">
              <span className="text-lg group-hover:scale-110 transition-transform">+</span>
              <span>เพิ่มประเภท</span>
            </span>
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {productTypes.map((productType, index) => (
            <ProductTypeCard
              key={productType.id}
              productType={productType}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

