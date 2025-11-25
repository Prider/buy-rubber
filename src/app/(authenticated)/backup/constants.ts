/**
 * Constants for Backup page
 */

export const BACKUP_PAGE_SIZE = 10;

export const DEFAULT_BACKUP_SETTINGS = {
  enabled: false,
  frequency: 'daily',
  time: '22:00',
  maxCount: 80,
  autoCleanup: true,
};

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'ทุกวัน' },
  { value: 'weekly', label: 'ทุกสัปดาห์' },
  { value: 'monthly', label: 'ทุกเดือน' },
] as const;

export const MAX_BACKUP_COUNT = {
  MIN: 1,
  MAX: 80,
  DEFAULT: 60,
} as const;

