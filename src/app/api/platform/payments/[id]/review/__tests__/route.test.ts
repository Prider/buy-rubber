import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

vi.mock('@/platform/prisma', () => ({
  prisma: {
    paymentRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tenant: { update: vi.fn() },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

vi.mock('@/platform/tenant', () => ({
  requirePlatformAuth: vi.fn(),
}));

vi.mock('@/platform/mail', () => ({
  sendPaymentApprovedEmail: vi.fn(),
  sendPaymentRejectedEmail: vi.fn(),
}));

vi.mock('@/shared/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const admin = {
  id: 'user-1',
  username: 'owner',
  role: 'admin',
  createdAt: new Date('2024-01-01'),
  isActive: true,
};

const payment = {
  id: 'pay-1',
  tenantId: 'tenant-1',
  tenant: {
    id: 'tenant-1',
    slug: 'my-shop',
    name: 'ร้านทดสอบ',
    email: 'owner@shop.com',
    status: 'pending_payment',
    users: [admin],
  },
};

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/platform/payments/pay-1/review', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/platform/payments/[id]/review', () => {
  let prisma: {
    paymentRequest: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    tenant: { update: ReturnType<typeof vi.fn> };
  };
  let requirePlatformAuth: ReturnType<typeof vi.fn>;
  let sendPaymentApprovedEmail: ReturnType<typeof vi.fn>;
  let sendPaymentRejectedEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma = (await import('@/platform/prisma')).prisma as never;
    requirePlatformAuth = (await import('@/platform/tenant')).requirePlatformAuth as never;
    sendPaymentApprovedEmail = (await import('@/platform/mail')).sendPaymentApprovedEmail as never;
    sendPaymentRejectedEmail = (await import('@/platform/mail')).sendPaymentRejectedEmail as never;
    vi.mocked(requirePlatformAuth).mockResolvedValue({
      ok: true,
      auth: { userId: 'platform-1', username: 'platform' },
    });
    vi.mocked(prisma.paymentRequest.findUnique).mockResolvedValue(payment);
    vi.mocked(prisma.paymentRequest.update).mockResolvedValue({});
    vi.mocked(prisma.tenant.update).mockResolvedValue({});
    vi.mocked(sendPaymentApprovedEmail).mockResolvedValue(undefined);
    vi.mocked(sendPaymentRejectedEmail).mockResolvedValue(undefined);
  });

  it('emails the shop login link, store code, and username when approved', async () => {
    const response = await POST(request({ action: 'approve' }), { params: { id: 'pay-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      status: 'approved',
      emailSent: true,
      message: 'อนุมัติแล้ว และส่งอีเมลแจ้งผู้ใช้แล้ว',
    });
    expect(prisma.paymentRequest.findUnique).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      select: {
        id: true,
        tenantId: true,
        tenant: {
          select: {
            slug: true,
            name: true,
            email: true,
            status: true,
            users: {
              where: { isActive: true, role: { in: ['admin', 'root'] } },
              select: { id: true, username: true, role: true, createdAt: true, isActive: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
    expect(sendPaymentApprovedEmail).toHaveBeenCalledWith({
      to: 'owner@shop.com',
      shopName: 'ร้านทดสอบ',
      slug: 'my-shop',
      username: 'owner',
      loginUrl: 'http://localhost:3000/login?slug=my-shop',
    });
  });

  it('keeps the approval when the email cannot be sent', async () => {
    vi.mocked(sendPaymentApprovedEmail).mockRejectedValue(new Error('smtp down'));

    const response = await POST(request({ action: 'approve' }), { params: { id: 'pay-1' } });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.status).toBe('approved');
    expect(data.emailSent).toBe(false);
    expect(prisma.paymentRequest.update).toHaveBeenCalled();
  });

  it('emails the shop to resubmit the slip with the reason and contact details', async () => {
    const response = await POST(request({ action: 'reject', rejectReason: 'สลิปไม่ชัด' }), {
      params: { id: 'pay-1' },
    });
    const data = await response.json();

    expect(data).toEqual({
      success: true,
      status: 'rejected',
      emailSent: true,
      message: 'ปฏิเสธแล้ว และส่งอีเมลให้ผู้ใช้อัปโหลดสลิปใหม่แล้ว',
    });
    expect(sendPaymentApprovedEmail).not.toHaveBeenCalled();
    expect(sendPaymentRejectedEmail).toHaveBeenCalledWith({
      to: 'owner@shop.com',
      shopName: 'ร้านทดสอบ',
      slug: 'my-shop',
      username: 'owner',
      loginUrl: 'http://localhost:3000/login?slug=my-shop',
      reason: 'สลิปไม่ชัด',
    });
  });

  it('uses a default reason when the owner leaves the reason blank', async () => {
    await POST(request({ action: 'reject', rejectReason: '   ' }), { params: { id: 'pay-1' } });

    expect(sendPaymentRejectedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'สลิปไม่ถูกต้อง' }),
    );
  });
});
