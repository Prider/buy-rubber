'use client';

import React from 'react';
import { Button, Modal } from 'animal-island-ui';
import { UpdateUserRequest, UserRole } from '@/types/user';

interface EditUserModalProps {
  visible: boolean;
  form: UpdateUserRequest;
  onChange: <K extends keyof UpdateUserRequest>(field: K, value: UpdateUserRequest[K]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const FORM_ID = 'edit-user-form';

const fieldClassName =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-600 dark:disabled:text-gray-400';

export const EditUserModal: React.FC<EditUserModalProps> = ({
  visible,
  form,
  onChange,
  onSubmit,
  onClose,
}) => {
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const roleRef = React.useRef<HTMLSelectElement>(null);
  const statusRef = React.useRef<HTMLButtonElement>(null);

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
      open={visible}
      className="app-island-modal"
      title={
        <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
          แก้ไขผู้ใช้งาน
        </span>
      }
      width={560}
      typewriter={false}
      onClose={onClose}
      footer={
        <>
          <Button htmlType="button" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="primary" htmlType="submit" form={FORM_ID}>
            บันทึกการแก้ไข
          </Button>
        </>
      }
    >
      <div className="w-full text-base font-normal">
        <form id={FORM_ID} onSubmit={onSubmit} className="w-full space-y-5 px-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              ชื่อผู้ใช้ <span className="text-red-500">*</span>
            </label>
            <input
              ref={usernameRef}
              type="text"
              value={form.username}
              onChange={(e) => onChange('username', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, passwordRef)}
              className={fieldClassName}
              placeholder="กรอกชื่อผู้ใช้"
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">รหัสผ่านใหม่</label>
            <input
              ref={passwordRef}
              type="password"
              value={form.password ?? ''}
              onChange={(e) => onChange('password', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, roleRef, usernameRef)}
              className={fieldClassName}
              placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
              autoComplete="new-password"
            />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              เว้นว่างไว้หากต้องการใช้รหัสผ่านเดิม
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">สิทธิ์</label>
            <select
              ref={roleRef}
              value={form.role}
              onChange={(e) => onChange('role', e.target.value as UserRole)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault();
                  statusRef.current?.focus();
                }
              }}
              className={fieldClassName}
            >
              <option value="viewer">ผู้ชม (อ่านอย่างเดียว)</option>
              <option value="user">ผู้ใช้งาน (แก้ไขได้)</option>
              <option value="admin">ผู้ดูแล (สิทธิ์เต็ม)</option>
            </select>
          </div>
          <button
            ref={statusRef}
            type="button"
            role="switch"
            aria-checked={form.isActive}
            id="isActive"
            onClick={() => onChange('isActive', !form.isActive)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            className={`w-full flex items-center justify-between gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-colors ${
              form.isActive
                ? 'border-green-500 bg-green-50 dark:border-green-500 dark:bg-green-950/40'
                : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40'
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">สถานะบัญชี</p>
              <p
                className={`mt-0.5 text-sm font-medium ${
                  form.isActive
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {form.isActive ? 'เปิดใช้งาน — สามารถเข้าสู่ระบบได้' : 'ปิดใช้งาน — ไม่สามารถเข้าสู่ระบบได้'}
              </p>
            </div>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${
                form.isActive ? 'bg-green-500' : 'bg-red-400 dark:bg-red-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        </form>
      </div>
    </Modal>
  );
};
