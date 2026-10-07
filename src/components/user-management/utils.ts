import { UserRole } from '@/types/user';

export const ROLE_SELECT_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'viewer', label: 'พนักงาน' },
  { value: 'user', label: 'ผู้จัดการ' },
  { value: 'accountant', label: 'บัญชี' },
  { value: 'admin', label: 'เจ้าของ' },
];

export const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case 'root':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200';
    case 'admin':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    case 'accountant':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
    case 'user':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    case 'viewer':
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  }
};

export const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'root':
      return 'ผู้ดูแล';
    case 'admin':
      return 'เจ้าของ';
    case 'user':
      return 'ผู้จัดการ';
    case 'accountant':
      return 'บัญชี';
    case 'viewer':
    default:
      return 'พนักงาน';
  }
};
