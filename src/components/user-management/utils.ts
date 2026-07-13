import { UserRole } from '@/types/user';

export const getRoleBadgeColor = (role: UserRole) => {
  if (role === 'root') {
    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200';
  }
  return role === 'admin'
    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
};

export const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'root':
      return 'Root';
    case 'admin':
      return 'ผู้ดูแล';
    case 'user':
      return 'ผู้ใช้งาน';
    case 'viewer':
    default:
      return 'ผู้ชม';
  }
};
