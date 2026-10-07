import { describe, it, expect } from 'vitest';
import { getRoleLabel, ROLE_SELECT_OPTIONS } from '../utils';
import { canAccessAppPath, homePathForRole } from '@/types/user';

describe('user management role options', () => {
  it('does not include Root in the create/edit role dropdown', () => {
    expect(ROLE_SELECT_OPTIONS.map((option) => option.value)).toEqual([
      'viewer',
      'user',
      'accountant',
      'admin',
    ]);
  });

  it('shows the renamed role labels, including the report-only accountant role', () => {
    expect(getRoleLabel('viewer')).toBe('พนักงาน');
    expect(getRoleLabel('user')).toBe('ผู้จัดการ');
    expect(getRoleLabel('admin')).toBe('เจ้าของ');
    expect(getRoleLabel('root')).toBe('ผู้ดูแล');
    expect(getRoleLabel('accountant')).toBe('บัญชี');
  });
});

describe('accountant app access', () => {
  it('opens only the reports page', () => {
    expect(homePathForRole('accountant')).toBe('/reports');
    expect(canAccessAppPath('accountant', '/reports')).toBe(true);
    expect(canAccessAppPath('accountant', '/reports/profit-loss')).toBe(true);
    expect(canAccessAppPath('accountant', '/dashboard')).toBe(false);
    expect(canAccessAppPath('accountant', '/admin')).toBe(false);
    expect(homePathForRole('admin')).toBe('/dashboard');
    expect(canAccessAppPath('viewer', '/purchases')).toBe(true);
  });
});
