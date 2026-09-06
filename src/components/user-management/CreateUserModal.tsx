'use client';

import React from 'react';
import { Button, Modal } from 'animal-island-ui';
import { CreateUserRequest, UserRole } from '@/types/user';

interface CreateUserModalProps {
  visible: boolean;
  form: CreateUserRequest;
  onChange: <K extends keyof CreateUserRequest>(field: K, value: CreateUserRequest[K]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const FORM_ID = 'create-user-form';

const fieldClassName =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-600 dark:disabled:text-gray-400';

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  visible,
  form,
  onChange,
  onSubmit,
  onClose,
}) => {
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const roleRef = React.useRef<HTMLSelectElement>(null);

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
          สร้างผู้ใช้งานใหม่
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
            สร้างผู้ใช้งาน
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              รหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input
              ref={passwordRef}
              type="password"
              value={form.password}
              onChange={(e) => onChange('password', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, roleRef, usernameRef)}
              className={fieldClassName}
              placeholder="กรอกรหัสผ่าน"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">สิทธิ์</label>
            <select
              ref={roleRef}
              value={form.role}
              onChange={(e) => onChange('role', e.target.value as UserRole)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              className={fieldClassName}
            >
              <option value="viewer">ผู้ชม (อ่านอย่างเดียว)</option>
              <option value="user">ผู้ใช้งาน (แก้ไขได้)</option>
              <option value="admin">ผู้ดูแล (สิทธิ์เต็ม)</option>
            </select>
          </div>
        </form>
      </div>
    </Modal>
  );
};
