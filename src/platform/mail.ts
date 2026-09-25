import nodemailer, { type Transporter } from 'nodemailer';

const SMTP_TIMEOUT_MS = 10_000;

type Mailer = { key: string; from: string; transporter: Transporter };
let mailer: Mailer | null = null;

export type PasswordResetMail = {
  to: string;
  shopName: string;
  username: string;
  resetUrl: string;
};

export type SignupVerificationMail = {
  to: string;
  shopName: string;
  code: string;
};

export type PaymentApprovedMail = {
  to: string;
  shopName: string;
  slug: string;
  username: string;
  loginUrl: string;
};

export type PaymentRejectedMail = {
  to: string;
  shopName: string;
  slug: string;
  username: string;
  loginUrl: string;
  reason: string;
};

function smtpSecure(port: number): boolean {
  const raw = process.env.SMTP_SECURE;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return port === 465;
}

function getMailer(): Mailer {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!user || !pass || !from) {
    throw new Error('SMTP is not configured');
  }

  const key = `${host}:${port}:${user}`;
  if (mailer?.key === key) return mailer;

  mailer?.transporter.close();
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: smtpSecure(port),
    auth: { user, pass },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });
  mailer = { key, from, transporter };
  return mailer;
}

export async function sendPasswordResetEmail(input: PasswordResetMail): Promise<void> {
  const { from, transporter } = getMailer();

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

export async function sendSignupVerificationEmail(input: SignupVerificationMail): Promise<void> {
  const { from, transporter } = getMailer();
  const subject = 'รหัสยืนยันสมัครใช้งาน Punsook Innotech';
  const text = [
    'สวัสดี',
    '',
    `รหัสยืนยันสำหรับร้าน ${input.shopName}: ${input.code}`,
    '',
    'ใส่รหัสนี้ในหน้าสมัครใช้งาน (ใช้ได้ 15 นาที)',
    '',
    'ถ้าคุณไม่ได้สมัคร กรุณาเพิกเฉยอีเมลนี้',
  ].join('\n');

  const html = `
    <p>สวัสดี</p>
    <p>รหัสยืนยันสำหรับร้าน <strong>${escapeHtml(input.shopName)}</strong></p>
    <p style="font-size:28px;letter-spacing:8px;font-weight:700;">${escapeHtml(input.code)}</p>
    <p>ใส่รหัสนี้ในหน้าสมัครใช้งาน (ใช้ได้ 15 นาที)</p>
    <p>ถ้าคุณไม่ได้สมัคร กรุณาเพิกเฉยอีเมลนี้</p>
  `;

  await transporter.sendMail({
    from,
    to: input.to,
    subject,
    text,
    html,
  });
}

export async function sendPaymentApprovedEmail(input: PaymentApprovedMail): Promise<void> {
  const { from, transporter } = getMailer();
  const subject = 'อนุมัติการใช้งาน Punsook Innotech';
  const text = [
    'สวัสดี',
    '',
    `การชำระเงินสำหรับร้าน ${input.shopName} ได้รับการอนุมัติแล้ว`,
    'เข้าสู่ระบบได้ที่ลิงก์นี้:',
    input.loginUrl,
    '',
    `รหัสร้าน: ${input.slug}`,
    `ชื่อผู้ใช้: ${input.username}`,
  ].join('\n');

  const html = `
    <p>สวัสดี</p>
    <p>การชำระเงินสำหรับร้าน <strong>${escapeHtml(input.shopName)}</strong> ได้รับการอนุมัติแล้ว</p>
    <p>เข้าสู่ระบบได้ที่ลิงก์นี้:<br/>
    <a href="${escapeHtml(input.loginUrl)}">${escapeHtml(input.loginUrl)}</a></p>
    <p>รหัสร้าน: <strong>${escapeHtml(input.slug)}</strong><br/>
    ชื่อผู้ใช้: <strong>${escapeHtml(input.username)}</strong></p>
  `;

  await transporter.sendMail({
    from,
    to: input.to,
    subject,
    text,
    html,
  });
}

export async function sendPaymentRejectedEmail(input: PaymentRejectedMail): Promise<void> {
  const { from, transporter } = getMailer();
  const subject = 'สลิปไม่ผ่านการตรวจสอบ Punsook Innotech';
  const text = [
    'สวัสดี',
    '',
    `สลิปการชำระเงินสำหรับร้าน ${input.shopName} ไม่ผ่านการตรวจสอบ`,
    `เหตุผล: ${input.reason}`,
    '',
    'กรุณาเข้าสู่ระบบแล้วอัปโหลดสลิปใหม่ที่ลิงก์นี้:',
    input.loginUrl,
    '',
    `รหัสร้าน: ${input.slug}`,
    `ชื่อผู้ใช้: ${input.username}`,
    '',
    'ติดต่อเรา',
    'โทร: 0926241010',
    'อีเมล: support@punsookinnotech.co',
    'Line: pawatify',
  ].join('\n');

  const html = `
    <p>สวัสดี</p>
    <p>สลิปการชำระเงินสำหรับร้าน <strong>${escapeHtml(input.shopName)}</strong> ไม่ผ่านการตรวจสอบ</p>
    <p>เหตุผล: <strong>${escapeHtml(input.reason)}</strong></p>
    <p>กรุณาเข้าสู่ระบบแล้วอัปโหลดสลิปใหม่ที่ลิงก์นี้:<br/>
    <a href="${escapeHtml(input.loginUrl)}">${escapeHtml(input.loginUrl)}</a></p>
    <p>รหัสร้าน: <strong>${escapeHtml(input.slug)}</strong><br/>
    ชื่อผู้ใช้: <strong>${escapeHtml(input.username)}</strong></p>
    <p>ติดต่อเรา<br/>
    โทร: 0926241010<br/>
    อีเมล: support@punsookinnotech.co<br/>
    Line: pawatify</p>
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
