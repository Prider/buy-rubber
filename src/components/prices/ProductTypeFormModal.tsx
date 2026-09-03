'use client';

import React from 'react';
import { Button, Modal } from 'animal-island-ui';

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

const FORM_ID = 'product-type-form';

const fieldClassName =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-600 dark:disabled:text-gray-400';

export default function ProductTypeFormModal({
  isOpen,
  editingProductType,
  formData,
  onClose,
  onSubmit,
  onChange,
}: ProductTypeFormModalProps) {
  const codeRef = React.useRef<HTMLInputElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (
    e: React.KeyboardEvent,
    nextRef?: React.RefObject<HTMLElement | null>,
    prevRef?: React.RefObject<HTMLElement | null>
  ) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
    if (e.key === 'ArrowLeft' && prevRef?.current) {
      e.preventDefault();
      prevRef.current.focus();
    }
  };

  return (
    <Modal
      open={isOpen}
      className="app-island-modal"
      title={
        <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
          {editingProductType ? 'แก้ไขประเภทสินค้า' : 'เพิ่มประเภทสินค้า'}
        </span>
      }
      width={650}
      typewriter={false}
      onClose={onClose}
      footer={
        <>
          <Button htmlType="button" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="primary" htmlType="submit" form={FORM_ID}>
            {editingProductType ? 'บันทึกการแก้ไข' : 'เพิ่มประเภทสินค้า'}
          </Button>
        </>
      }
    >
      <div className="w-full text-base font-normal">
        <p className="mb-6 w-full text-center text-sm font-medium text-gray-600 dark:text-gray-300">
          {editingProductType
            ? 'แก้ไขข้อมูลประเภทสินค้า'
            : 'เพิ่มประเภทสินค้าใหม่สำหรับการตั้งราคา'}
        </p>
        <form id={FORM_ID} onSubmit={onSubmit} className="w-full space-y-5 px-2">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                รหัสประเภท <span className="text-red-500">*</span>
              </label>
              <input
                ref={codeRef}
                type="text"
                value={formData.code}
                onChange={(e) => onChange('code', e.target.value.toUpperCase())}
                onKeyDown={(e) => handleKeyDown(e, nameRef)}
                className={fieldClassName}
                placeholder="เช่น FRESH, DRY"
                required
                disabled={!!editingProductType}
                maxLength={10}
              />
              {editingProductType && (
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">ไม่สามารถแก้ไขรหัสประเภทได้</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                ชื่อประเภท <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, descRef, codeRef)}
                className={fieldClassName}
                placeholder="เช่น น้ำยางสด, ยางแห้ง"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">รายละเอียดเพิ่มเติม</label>
            <textarea
              ref={descRef}
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                  return;
                }
                handleKeyDown(e, undefined, nameRef);
              }}
              className={`${fieldClassName} resize-none`}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={4}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
