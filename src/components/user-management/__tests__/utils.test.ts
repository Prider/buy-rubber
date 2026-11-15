import { describe, it, expect } from 'vitest';
import { getRoleLabel, ROLE_SELECT_OPTIONS } from '../utils';
import { canAccessAdminPage, canAccessAppPath, canDeletePurchases, canSeeAdminTab, canSeeProfitLoss, homePathForRole } from '@/types/user';

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

describe('purchase delete access', () => {
  it('allows the owner, root, and ผู้จัดการ', () => {
    expect(canDeletePurchases('admin')).toBe(true);
    expect(canDeletePurchases('root')).toBe(true);
    expect(canDeletePurchases('user')).toBe(true);
    expect(canDeletePurchases('viewer')).toBe(false);
    expect(canDeletePurchases('accountant')).toBe(false);
    expect(canDeletePurchases(null)).toBe(false);
  });
});

describe('profit and loss visibility', () => {
  it('shows กำไร/ขาดทุน only to the owner and root', () => {
    expect(canSeeProfitLoss('admin')).toBe(true);
    expect(canSeeProfitLoss('root')).toBe(true);
    expect(canSeeProfitLoss('user')).toBe(false);
    expect(canSeeProfitLoss('viewer')).toBe(false);
    expect(canSeeProfitLoss('accountant')).toBe(false);
    expect(canSeeProfitLoss(null)).toBe(false);
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

describe('viewer app access', () => {
  it('hides dashboard, stock, reports, sales, destination companies, and expenses', () => {
    expect(homePathForRole('viewer')).toBe('/purchases');
    expect(canAccessAppPath('viewer', '/purchases')).toBe(true);
    expect(canAccessAppPath('viewer', '/members')).toBe(true);
    expect(canAccessAppPath('viewer', '/guide')).toBe(true);
    expect(canAccessAppPath('viewer', '/expenses')).toBe(false);
    expect(canAccessAppPath('viewer', '/dashboard')).toBe(false);
    expect(canAccessAppPath('viewer', '/stock')).toBe(false);
    expect(canAccessAppPath('viewer', '/stock/type-1')).toBe(false);
    expect(canAccessAppPath('viewer', '/reports')).toBe(false);
    expect(canAccessAppPath('viewer', '/reports/profit-loss')).toBe(false);
    expect(canAccessAppPath('viewer', '/sales')).toBe(false);
    expect(canAccessAppPath('viewer', '/destination-companies')).toBe(false);
    expect(canAccessAppPath('user', '/sales')).toBe(true);
    expect(canAccessAppPath('admin', '/dashboard')).toBe(true);
  });
});

describe('manager app access', () => {
  it('hides dashboard and reports, and opens purchases', () => {
    expect(homePathForRole('user')).toBe('/purchases');
    expect(canAccessAppPath('user', '/purchases')).toBe(true);
    expect(canAccessAppPath('user', '/stock')).toBe(true);
    expect(canAccessAppPath('user', '/sales')).toBe(true);
    expect(canAccessAppPath('user', '/members')).toBe(true);
    expect(canAccessAppPath('user', '/destination-companies')).toBe(true);
    expect(canAccessAppPath('user', '/expenses')).toBe(true);
    expect(canAccessAppPath('user', '/guide')).toBe(true);
    expect(canAccessAppPath('user', '/admin')).toBe(true);
    expect(canAccessAdminPage('user')).toBe(true);
    expect(canAccessAdminPage('admin')).toBe(true);
    expect(canAccessAdminPage('root')).toBe(true);
    expect(canAccessAdminPage('viewer')).toBe(false);
    expect(canAccessAdminPage('accountant')).toBe(false);
    expect(canSeeAdminTab('user', 'slip')).toBe(true);
    expect(canSeeAdminTab('user', 'users')).toBe(false);
    expect(canSeeAdminTab('user', 'activity')).toBe(false);
    expect(canSeeAdminTab('user', 'backup')).toBe(true);
    expect(canSeeAdminTab('user', 'assistant')).toBe(false);
    expect(canSeeAdminTab('user', 'connection')).toBe(true);
    expect(canSeeAdminTab('admin', 'users')).toBe(true);
    expect(canSeeAdminTab('admin', 'activity')).toBe(true);
    expect(canSeeAdminTab('root', 'backup')).toBe(true);
    expect(canAccessAppPath('user', '/dashboard')).toBe(false);
    expect(canAccessAppPath('user', '/reports')).toBe(false);
    expect(canAccessAppPath('user', '/reports/profit-loss')).toBe(false);
  });
});
