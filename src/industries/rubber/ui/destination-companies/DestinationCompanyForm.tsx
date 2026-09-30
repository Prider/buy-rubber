'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DestinationCompanyFormProps, DestinationCompanyFormData } from '@/industries/rubber/types/destinationCompany';

const FORM_ID = 'destination-company-form';

const fieldClassName =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-600 dark:disabled:text-gray-400';

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

  const handleCancel = useCallback(() => {
    setLocalFormData(formData);
    setValidationError(null);
    onCancel();
  }, [formData, onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleCancel]);

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

  const canSubmit = !isLoading && hasChanges && Boolean(localFormData.name.trim());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={handleCancel} aria-hidden="true" />
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="destination-company-form-title"
          className="relative flex max-h-[100dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800 sm:max-h-[calc(100dvh-2rem)] sm:max-w-[720px] sm:rounded-2xl"
        >
          <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
            <h2
              id="destination-company-form-title"
              className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-center text-xl font-bold text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 sm:text-2xl"
            >
              {editingCompany ? 'แก้ไขบริษัทปลายทาง' : 'เพิ่มบริษัทปลายทาง'}
            </h2>
          </div>

          <div className="overflow-y-auto p-4 sm:p-6">
            <form id={FORM_ID} onSubmit={handleSubmit} className="w-full space-y-5 text-base font-normal">
              {validationError ? (
                <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {validationError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ชื่อบริษัท <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    value={localFormData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                    className={fieldClassName}
                    placeholder="เช่น บริษัท ยางไทย จำกัด"
                    required
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">รหัสบริษัท</label>
                  <input
                    type="text"
                    value={localFormData.code}
                    disabled
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">เบอร์โทร</label>
                <input
                  ref={phoneRef}
                  type="text"
                  value={localFormData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, addressRef, nameRef)}
                  className={fieldClassName}
                  placeholder="เช่น 0812345678"
                  inputMode="tel"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">ที่อยู่</label>
                <textarea
                  ref={addressRef}
                  value={localFormData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                      return;
                    }
                    handleKeyDown(e, undefined, phoneRef);
                  }}
                  rows={3}
                  className={`${fieldClassName} resize-none`}
                  placeholder="ที่อยู่บริษัท (ถ้ามี)"
                  disabled={isLoading}
                />
              </div>
            </form>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-4 py-4 dark:border-gray-700 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="min-h-11 w-full rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 sm:w-auto"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form={FORM_ID}
              disabled={!canSubmit}
              className="min-h-11 w-full rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-6 py-3 font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:animate-none animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 sm:w-auto"
            >
              {isLoading ? 'กำลังบันทึก...' : editingCompany ? 'บันทึกการแก้ไข' : 'เพิ่มบริษัท'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
