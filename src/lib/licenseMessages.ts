import type { LicenseStatus } from '@/types/license';

export const SERVER_LICENSE_MISSING_MESSAGE =
  'เซิร์ฟเวอร์ยังไม่ได้เปิดใช้งานใบอนุญาต กรุณาติดต่อผู้ดูแลที่เครื่องเซิร์ฟเวอร์';

export const SERVER_LICENSE_RENEW_MESSAGE =
  'เซิร์ฟเวอร์ต้องต่ออายุใบอนุญาต กรุณาติดต่อผู้ดูแลที่เครื่องเซิร์ฟเวอร์';

export const SERVER_LICENSE_UNREACHABLE_MESSAGE =
  'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อตรวจสอบใบอนุญาตได้';

export function messageForRemoteLicense(status: LicenseStatus): string {
  if (status === 'missing') return SERVER_LICENSE_MISSING_MESSAGE;
  if (status === 'error' || status === 'unknown') return SERVER_LICENSE_UNREACHABLE_MESSAGE;
  if (status === 'valid') return '';
  return SERVER_LICENSE_RENEW_MESSAGE;
}
