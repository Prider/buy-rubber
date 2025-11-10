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
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => onChange('isActive', e.target.checked)}
              className="form-checkbox text-primary-600"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              เปิดใช้งาน
            </label>
          </div>
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


