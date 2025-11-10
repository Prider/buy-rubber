import { UserRole } from '@/types/user';

export const getRoleBadgeColor = (role: UserRole) => {
  return role === 'admin'
    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
};

export const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'ผู้ดูแล';
    case 'user':
      return 'ผู้ใช้งาน';
    case 'viewer':
    default:
      return 'ผู้ชม';
  }
};


