'use client';

import { User, isRootRole } from '@/types/user';
import { getRoleBadgeColor, getRoleLabel } from './utils';

interface UsersTableProps {
  users: Omit<User, 'password'>[];
  currentUserId?: string;
  onEdit: (user: Omit<User, 'password'>) => void;
  onDelete: (userId: string) => void;
}

const desktopCols = 'lg:grid-cols-[minmax(0,1.4fr)_7.5rem_7.5rem_8.5rem_8.5rem]';

export const UsersTable: React.FC<UsersTableProps> = ({ users, currentUserId, onEdit, onDelete }) => (
  <div role="table" className="w-full min-w-0 text-sm">
    <div
      role="row"
      className={`hidden bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400 lg:grid ${desktopCols}`}
    >
      <div role="columnheader" className="px-4 py-2 text-left">ชื่อผู้ใช้</div>
      <div role="columnheader" className="px-4 py-2 text-left">สิทธิ์</div>
      <div role="columnheader" className="px-4 py-2 text-left">สถานะ</div>
      <div role="columnheader" className="px-4 py-2 text-left">วันที่สร้าง</div>
      <div role="columnheader" className="px-4 py-2 text-right">การจัดการ</div>
    </div>

    <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-2 lg:block lg:p-0">
      {users.map((user) => {
        const isRoot = isRootRole(user.role);
        return (
          <div
            key={user.id}
            role="row"
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 rounded-xl border border-gray-100 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800/80 lg:items-center lg:gap-0 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:bg-transparent lg:px-0 lg:py-0 lg:dark:bg-transparent ${desktopCols}`}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 lg:contents">
              <div role="cell" className="min-w-0 basis-full lg:basis-auto lg:px-4 lg:py-2">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span>{user.username}</span>
                  {user.id === currentUserId && (
                    <span className="ml-1.5 text-xs font-normal text-gray-500 dark:text-gray-400">(บัญชีของคุณ)</span>
                  )}
                </p>
              </div>

              <div role="cell" className="lg:px-4 lg:py-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <div role="cell" className="lg:px-4 lg:py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {user.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </div>

              <div role="cell" className="text-xs text-gray-500 dark:text-gray-400 lg:px-4 lg:py-2 lg:text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div role="cell" className="lg:px-3 lg:py-1 lg:text-right">
              {isRoot ? (
                <span className="text-xs text-gray-400 dark:text-gray-500">ไม่สามารถแก้ไขได้</span>
              ) : (
                <div className="flex gap-1 lg:justify-end">
                  <button
                    onClick={() => onEdit(user)}
                    className="inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium text-primary-600 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:bg-primary-900/20"
                  >
                    แก้ไข
                  </button>
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => onDelete(user.id)}
                      className="inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
