'use client';

import { UpdateUserRequest, UserRole } from '@/types/user';

interface EditUserModalProps {
  visible: boolean;
  form: UpdateUserRequest;
  onChange: <K extends keyof UpdateUserRequest>(field: K, value: UpdateUserRequest[K]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  visible,
  form,
  onChange,
  onSubmit,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">แก้ไขผู้ใช้งาน</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">ชื่อผู้ใช้</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => onChange('username', e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">รหัสผ่านใหม่</label>
            <input
              type="password"
              value={form.password ?? ''}
              onChange={(e) => onChange('password', e.target.value)}
              className="input"
              placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              เว้นว่างไว้หากต้องการใช้รหัสผ่านเดิม
            </p>
          </div>
          <div>
            <label className="label">สิทธิ์</label>
            <select
              value={form.role}
              onChange={(e) => onChange('role', e.target.value as UserRole)}
              className="input"
            >
              <option value="viewer">ผู้ชม (อ่านอย่างเดียว)</option>
              <option value="user">ผู้ใช้งาน (แก้ไขได้)</option>
              <option value="admin">ผู้ดูแล (สิทธิ์เต็ม)</option>
            </select>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            id="isActive"
            onClick={() => onChange('isActive', !form.isActive)}
            className={`w-full flex items-center justify-between gap-4 rounded-lg border-2 px-4 py-3.5 text-left transition-colors ${
              form.isActive
                ? 'border-green-500 bg-green-50 dark:border-green-500 dark:bg-green-950/40'
                : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40'
            }`}
          >
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                สถานะบัญชี
              </p>
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
          <div className="flex space-x-3">
            <button type="submit" className="btn btn-primary flex-1">
              บันทึกการแก้ไข
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


