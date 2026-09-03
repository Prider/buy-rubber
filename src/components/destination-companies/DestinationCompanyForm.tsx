'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Modal } from 'animal-island-ui';
import { DestinationCompanyFormProps, DestinationCompanyFormData } from '@/types/destinationCompany';

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

  return (
    <Modal
      open={isOpen}
      className="app-island-modal"
      title={
        <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
          {editingCompany ? 'แก้ไขบริษัทปลายทาง' : 'เพิ่มบริษัทปลายทาง'}
        </span>
      }
      width={650}
      typewriter={false}
      onClose={onCancel}
      footer={
        <>
          <Button htmlType="button" onClick={onCancel} disabled={isLoading}>
            ยกเลิก
          </Button>
          <Button type="primary" htmlType="submit" form={FORM_ID} disabled={!canSubmit}>
            {isLoading ? 'กำลังบันทึก...' : editingCompany ? 'บันทึกการแก้ไข' : 'เพิ่มบริษัท'}
          </Button>
        </>
      }
    >
      <div className="w-full text-base font-normal">
        <p className="mb-6 w-full text-center text-sm font-medium text-gray-600 dark:text-gray-300">
          {editingCompany ? 'แก้ไขข้อมูลบริษัทปลายทาง' : 'เพิ่มบริษัทปลายทางใหม่'}
        </p>
        <form id={FORM_ID} onSubmit={handleSubmit} className="w-full space-y-5 px-2">
          {validationError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 whitespace-pre-line">
              {validationError}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">รหัสบริษัท</label>
            <input
              type="text"
              value={localFormData.code}
              disabled
              className={fieldClassName}
            />
          </div>

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
            />
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
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">ที่อยู่</label>
            <textarea
              ref={addressRef}
              value={localFormData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                  return;
                }
                handleKeyDown(e, undefined, phoneRef);
              }}
              rows={2}
              className={`${fieldClassName} resize-none`}
              placeholder="ที่อยู่บริษัท (ถ้ามี)"
            />
          </div>
        </form>
      </div>
    </Modal>
  );
};
