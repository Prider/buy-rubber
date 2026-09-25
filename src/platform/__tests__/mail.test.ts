import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn(async () => undefined);
const close = vi.fn();
const createTransport = vi.fn(() => ({ sendMail, close }));

vi.mock('nodemailer', () => ({
  default: { createTransport },
}));

describe('mail transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_USER = 'mailer@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'Punsook <mailer@example.com>';
  });

  it('reuses one transporter and sets send timeouts', async () => {
    vi.resetModules();
    const { sendSignupVerificationEmail } = await import('../mail');

    await sendSignupVerificationEmail({ to: 'a@shop.com', shopName: 'ร้าน', code: '1234' });
    await sendSignupVerificationEmail({ to: 'b@shop.com', shopName: 'ร้าน', code: '5678' });

    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 10_000,
      }),
    );
    expect(sendMail).toHaveBeenCalledTimes(2);
  });
});
