/**
 * Constants for Backup page
 */

export const BACKUP_PAGE_SIZE = 10;

export const DEFAULT_BACKUP_SETTINGS = {
  enabled: false,
  frequency: 'daily',
  time: '22:00',
  weeklyDay: 1, // Monday
  monthlyDay: 1, // 1st of month
  maxCount: 80,
  autoCleanup: true,
};

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'ทุกวัน' },
  { value: 'weekly', label: 'ทุกสัปดาห์' },
  { value: 'monthly', label: 'ทุกเดือน' },
] as const;

export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'อาทิตย์' },
  { value: 1, label: 'จันทร์' },
  { value: 2, label: 'อังคาร' },
  { value: 3, label: 'พุธ' },
  { value: 4, label: 'พฤหัสบดี' },
  { value: 5, label: 'ศุกร์' },
  { value: 6, label: 'เสาร์' },
] as const;

export const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
}));

export const MAX_BACKUP_COUNT = {
  MIN: 1,
  MAX: 80,
  DEFAULT: 60,
} as const;

