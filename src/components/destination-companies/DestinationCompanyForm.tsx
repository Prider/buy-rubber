'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DestinationCompanyFormProps, DestinationCompanyFormData } from '@/types/destinationCompany';

export const DestinationCompanyForm: React.FC<DestinationCompanyFormProps> = ({
  isOpen,
  editingCompany,
  formData,
  onSubmit,
  onCancel,
  onFormDataChange,
  isLoading = false,
}) => {
  const [localFormData, setLocalFormData] = useState<DestinationCompanyFormData>(formData);
  const [validationError, setValidationError] = useState<string | null>(null);
  const initialEditingDataRef = useRef<DestinationCompanyFormData | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalFormData(formData);
    setValidationError(null);
  }, [formData, isOpen]);

  useEffect(() => {
    if (editingCompany) {
      initialEditingDataRef.current = {
        name: editingCompany.name,
        code: editingCompany.code,
        phone: editingCompany.phone || '',
        address: editingCompany.address || '',
      };
    } else {
      initialEditingDataRef.current = null;
    }
  }, [editingCompany]);

  const handleInputChange = (field: keyof DestinationCompanyFormData, value: string) => {
    const newData = { ...localFormData, [field]: value };
    setLocalFormData(newData);
    onFormDataChange(newData);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(localFormData);
    } catch (error: unknown) {
      setValidationError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    }
  };

  const hasChanges = useMemo(() => {
    if (!editingCompany) return true;
    const initialData = initialEditingDataRef.current;
    if (!initialData) return true;
    return (
      localFormData.name !== initialData.name ||
      localFormData.phone !== initialData.phone ||
      localFormData.address !== initialData.address
    );
  }, [editingCompany, localFormData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCompany ? 'แก้ไขบริษัทปลายทาง' : 'เพิ่มบริษัทปลายทาง'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
          {validationError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 whitespace-pre-line">
              {validationError}
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium mb-1">รหัสบริษัท</label>
            <input
              type="text"
              value={localFormData.code}
              disabled
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ชื่อบริษัท <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={localFormData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="เช่น บริษัท ยางไทย จำกัด"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">เบอร์โทร</label>
            <input
              ref={phoneRef}
              type="text"
              value={localFormData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="เช่น 0812345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ที่อยู่</label>
            <textarea
              ref={addressRef}
              value={localFormData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="ที่อยู่บริษัท (ถ้ามี)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading || !hasChanges || !localFormData.name.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'กำลังบันทึก...' : editingCompany ? 'บันทึกการแก้ไข' : 'เพิ่มบริษัท'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
