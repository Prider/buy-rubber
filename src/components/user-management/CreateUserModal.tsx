'use client';

import { CreateUserRequest, UserRole } from '@/types/user';

interface CreateUserModalProps {
  visible: boolean;
  form: CreateUserRequest;
  onChange: <K extends keyof CreateUserRequest>(field: K, value: CreateUserRequest[K]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">สร้างผู้ใช้งานใหม่</h3>
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
            <label className="label">รหัสผ่าน</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => onChange('password', e.target.value)}
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
          <div className="flex space-x-3">
            <button type="submit" className="btn btn-primary flex-1">
              สร้างผู้ใช้งาน
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


