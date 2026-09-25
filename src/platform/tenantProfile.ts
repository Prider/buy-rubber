import type { TenantPlan, TenantStatus } from '@/platform/auth';

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export function shopPaymentStatus(input: {
  plan: TenantPlan | string;
  tenantStatus: TenantStatus | string;
}): { key: string; label: string; tone: 'green' | 'amber' | 'red' | 'gray' } {
  if (input.tenantStatus === 'not_yet_payment') {
    return { key: 'unpaid', label: 'ยังไม่ชำระเงิน', tone: 'gray' };
  }
  if (input.tenantStatus === 'pending_payment') {
    return { key: 'pending', label: 'รอตรวจสอบสลิป', tone: 'amber' };
  }
  if (input.tenantStatus === 'rejected') {
    return { key: 'rejected', label: 'สลิปไม่ผ่าน', tone: 'red' };
  }
  if (input.plan === 'premium' && input.tenantStatus === 'active') {
    return { key: 'premium', label: 'Premium ใช้งานได้', tone: 'green' };
  }
  return { key: 'freemium', label: 'ทดลองใช้ฟรี', tone: 'gray' };
}

export function paymentRequestLabel(status: string): string {
  if (status === 'approved') return 'อนุมัติแล้ว';
  if (status === 'rejected') return 'ปฏิเสธ';
  return 'รอตรวจสอบ';
}
