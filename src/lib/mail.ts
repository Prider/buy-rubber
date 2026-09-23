import nodemailer from 'nodemailer';

export type PasswordResetMail = {
  to: string;
  shopName: string;
  username: string;
  resetUrl: string;
};

function smtpSecure(port: number): boolean {
  const raw = process.env.SMTP_SECURE;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return port === 465;
}

export async function sendPasswordResetEmail(input: PasswordResetMail): Promise<void> {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!user || !pass || !from) {
    throw new Error('SMTP is not configured');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: smtpSecure(port),
    auth: { user, pass },
  });

  const subject = 'รีเซ็ตรหัสผ่าน Punsook Innotech';
  const text = [
    'สวัสดี',
    '',
    `มีการขอรีเซ็ตรหัสผ่านสำหรับร้าน ${input.shopName}`,
    `ชื่อผู้ใช้: ${input.username}`,
    '',
    'เปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ใช้ได้ 1 ชั่วโมง):',
    input.resetUrl,
    '',
    'ถ้าคุณไม่ได้ขอรีเซ็ต กรุณาเพิกเฉยอีเมลนี้',
  ].join('\n');

  const html = `
    <p>สวัสดี</p>
    <p>มีการขอรีเซ็ตรหัสผ่านสำหรับร้าน <strong>${escapeHtml(input.shopName)}</strong><br/>
    ชื่อผู้ใช้: <strong>${escapeHtml(input.username)}</strong></p>
    <p>เปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ใช้ได้ 1 ชั่วโมง):<br/>
    <a href="${escapeHtml(input.resetUrl)}">${escapeHtml(input.resetUrl)}</a></p>
    <p>ถ้าคุณไม่ได้ขอรีเซ็ต กรุณาเพิกเฉยอีเมลนี้</p>
  `;

  await transporter.sendMail({
    from,
    to: input.to,
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
