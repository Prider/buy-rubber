import { describe, expect, it } from 'vitest';
import { paymentRequestLabel, shopPaymentStatus } from '../tenantProfile';

describe('shopPaymentStatus', () => {
  it('marks a pending premium signup as waiting for slip review', () => {
    expect(shopPaymentStatus({ plan: 'premium', tenantStatus: 'pending_payment' })).toEqual({
      key: 'pending',
      label: 'รอตรวจสอบสลิป',
      tone: 'amber',
    });
  });

  it('marks an active premium shop as usable', () => {
    expect(shopPaymentStatus({ plan: 'premium', tenantStatus: 'active' }).key).toBe('premium');
  });

  it('defaults freemium shops to the trial label', () => {
    expect(shopPaymentStatus({ plan: 'freemium', tenantStatus: 'active' }).label).toBe('ทดลองใช้ฟรี');
  });
});

describe('paymentRequestLabel', () => {
  it('maps request statuses to Thai labels', () => {
    expect(paymentRequestLabel('approved')).toBe('อนุมัติแล้ว');
    expect(paymentRequestLabel('rejected')).toBe('ปฏิเสธ');
    expect(paymentRequestLabel('pending')).toBe('รอตรวจสอบ');
  });
});
