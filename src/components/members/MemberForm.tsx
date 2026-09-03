'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Modal } from 'animal-island-ui';
import { MemberFormProps, MemberFormData } from '@/types/member';

const FORM_ID = 'member-form';

const fieldClassName =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-600 dark:disabled:text-gray-400';

export const MemberForm: React.FC<MemberFormProps> = ({
  isOpen,
  editingMember,
  formData,
  onSubmit,
  onCancel,
  onFormDataChange,
  isLoading = false,
}) => {
  const [localFormData, setLocalFormData] = useState<MemberFormData>(formData);
  const [validationError, setValidationError] = useState<string | null>(null);
  const initialEditingDataRef = useRef<MemberFormData | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalFormData(formData);
    setValidationError(null);
  }, [formData, isOpen]);

  useEffect(() => {
    if (editingMember) {
      initialEditingDataRef.current = {
        name: editingMember.name,
        code: editingMember.code,
        phone: editingMember.phone || '',
        address: editingMember.address || '',
        ownerPercent: editingMember.ownerPercent,
        tapperPercent: editingMember.tapperPercent,
        tapperName: editingMember.tapperName || '',
      };
    } else {
      initialEditingDataRef.current = null;
    }
  }, [editingMember]);

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

  const handleInputChange = (field: keyof MemberFormData, value: string | number) => {
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

  const handleCancel = () => {
    setLocalFormData(formData);
    setValidationError(null);
    onCancel();
  };

  const hasChanges = useMemo(() => {
    if (!editingMember) return true;
    const initialData = initialEditingDataRef.current;
    if (!initialData) return true;
    return (
      localFormData.name !== initialData.name ||
      localFormData.code !== initialData.code ||
      localFormData.phone !== initialData.phone ||
      localFormData.address !== initialData.address ||
      localFormData.ownerPercent !== initialData.ownerPercent ||
      localFormData.tapperPercent !== initialData.tapperPercent ||
      localFormData.tapperName !== initialData.tapperName
    );
  }, [editingMember, localFormData]);

  const canSubmit = !isLoading && hasChanges;

  return (
    <Modal
      open={isOpen}
      className="app-island-modal"
      title={
        <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
          {editingMember ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}
        </span>
      }
      width={720}
      typewriter={false}
      onClose={handleCancel}
      footer={
        <>
          <Button htmlType="button" onClick={handleCancel} disabled={isLoading}>
            ยกเลิก
          </Button>
          <Button type="primary" htmlType="submit" form={FORM_ID} disabled={!canSubmit}>
            {isLoading ? 'กำลังบันทึก...' : editingMember ? 'บันทึกการแก้ไข' : 'เพิ่มสมาชิก'}
          </Button>
        </>
      }
    >
      <div className="w-full text-base font-normal">
        <p className="mb-6 w-full text-center text-sm font-medium text-gray-600 dark:text-gray-300">
          {editingMember ? 'แก้ไขข้อมูลสมาชิก' : 'กรอกข้อมูลสมาชิกใหม่'}
        </p>
        <form id={FORM_ID} onSubmit={handleSubmit} className="w-full space-y-5 px-2">
          {validationError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 whitespace-pre-line">
              {validationError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                value={localFormData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                className={fieldClassName}
                required
                disabled={isLoading}
                placeholder="กรอกชื่อ-นามสกุล"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                รหัสสมาชิก <span className="text-red-500">*</span>
                {!editingMember && (
                  <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">(สร้างอัตโนมัติ)</span>
                )}
              </label>
              <input
                type="text"
                value={localFormData.code}
                className={fieldClassName}
                required
                disabled
                readOnly
                placeholder="รหัสสมาชิก"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">เบอร์โทรศัพท์</label>
              <input
                ref={phoneRef}
                type="text"
                value={localFormData.phone}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '');
                  handleInputChange('phone', numericValue);
                }}
                onKeyDown={(e) => handleKeyDown(e, addressRef, nameRef)}
                className={fieldClassName}
                disabled={isLoading}
                placeholder="กรอกเบอร์โทรศัพท์"
                inputMode="tel"
                pattern="[0-9]*"
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
                className={`${fieldClassName} resize-none`}
                rows={2}
                disabled={isLoading}
                placeholder="กรอกที่อยู่"
              />
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
