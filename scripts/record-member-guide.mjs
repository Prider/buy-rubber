/**
 * Record the add-member clip shown on /guide#members.
 * Run while `yarn dev` is already serving http://localhost:3000.
 *
 * Uses the local offline license file so the fresh browser can open the app.
 * The member list is replaced with sample people, and the save is not written.
 *
 *   node scripts/record-member-guide.mjs
 */
import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rename } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const baseURL = process.env.GUIDE_BASE_URL ?? 'http://localhost:3000';
const licensePath = process.env.GUIDE_LICENSE_FILE
  ?? path.join(process.env.HOME ?? '', 'Library/Application Support/pos.punsook.innotech/license.lkey');
const outDir = path.join(process.cwd(), 'public/guide');
const workDir = path.join(os.tmpdir(), 'guide-video-members');

const licenseFile = await readFile(licensePath, 'utf8');

function thaiNationalId(body12) {
  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(body12[index]) * (13 - index);
  }
  const check = (11 - (sum % 11)) % 10;
  return `${body12}${check}`;
}

function memberRecord(partial) {
  const now = new Date().toISOString();
  return {
    idCard: '',
    phone: '',
    address: '',
    bankName: '',
    bankAccount: '',
    ownerPercent: 100,
    tapperPercent: 0,
    tapperName: '',
    advanceBalance: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

const roster = [
  memberRecord({
    id: 'demo-m1',
    code: 'M001',
    name: 'สมศักดิ์ ตัวอย่าง',
    phone: '0811111111',
    bankName: 'ธนาคารกรุงไทย',
    bankAccount: '1112223334',
  }),
  memberRecord({
    id: 'demo-m2',
    code: 'M002',
    name: 'มาลี ตัวอย่าง',
    phone: '0822222222',
  }),
  memberRecord({
    id: 'demo-m3',
    code: 'M003',
    name: 'วิชัย ตัวอย่าง',
    phone: '0833333333',
    bankName: 'ธนาคารกรุงเทพ',
    bankAccount: '4445556667',
  }),
];

const demo = {
  code: 'M004',
  name: 'สมหญิง ตัวอย่าง',
  phone: '0812345678',
  idCard: thaiNationalId('123456789012'),
  address: '99 หมู่ 1 ตำบลตัวอย่าง',
  bankName: 'ธนาคารกสิกรไทย',
  bankAccount: '1234567890',
};

async function allowLocalLicense(context) {
  await context.route('**/api/license/validate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: true,
        expired: false,
        renewalRequired: false,
        message: 'ok',
        expiresAt: '2027-12-31T00:00:00.000Z',
        renewalDate: '2027-12-31T00:00:00.000Z',
      }),
    });
  });
}

async function installDemoRoutes(context) {
  await context.route('**/api/members**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/\/$/, '');

    if (pathname.endsWith('/next-code')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: demo.code }),
      });
      return;
    }

    if (request.method() === 'POST' && pathname.endsWith('/api/members')) {
      const body = request.postDataJSON();
      roster.unshift(memberRecord({
        id: 'demo-new',
        code: body.code || demo.code,
        name: body.name,
        phone: body.phone,
        idCard: body.idCard,
        address: body.address,
        bankName: body.bankName,
        bankAccount: body.bankAccount,
        ownerPercent: body.ownerPercent ?? 100,
        tapperPercent: body.tapperPercent ?? 0,
        tapperName: body.tapperName ?? '',
        createdAt: new Date().toISOString(),
      }));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(roster[0]),
      });
      return;
    }

    if (request.method() !== 'GET' || !pathname.endsWith('/api/members')) {
      await route.abort();
      return;
    }

    const search = (url.searchParams.get('search') || '').trim();
    const matched = search
      ? roster.filter((member) => [member.code, member.name, member.phone, member.idCard, member.bankName, member.bankAccount]
        .some((value) => String(value || '').includes(search)))
      : roster;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        members: matched,
        pagination: {
          page: 1,
          limit: 10,
          total: matched.length,
          totalPages: 1,
          hasMore: false,
        },
      }),
    });
  });
}

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('กรอกชื่อผู้ใช้').waitFor({ timeout: 20_000 });
  await page.getByPlaceholder('กรอกชื่อผู้ใช้').fill('admin');
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill('admin123');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForURL('**/dashboard', { timeout: 20_000 });
}

function even(value) {
  const rounded = Math.max(2, Math.round(value));
  return rounded - (rounded % 2);
}

await mkdir(workDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const probe = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'th-TH',
  colorScheme: 'light',
});
await allowLocalLicense(probe);
await probe.addInitScript((file) => {
  localStorage.setItem('license_file', file);
  localStorage.setItem('license_status', 'valid');
  localStorage.setItem('theme', 'light');
}, licenseFile);
const probePage = await probe.newPage();
await login(probePage);
const storagePath = path.join(workDir, 'storage.json');
await probe.storageState({ path: storagePath });
await probe.close();

const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'th-TH',
  colorScheme: 'light',
  storageState: storagePath,
  recordVideo: { dir: workDir, size: { width: 1280, height: 900 } },
});
await allowLocalLicense(context);
await context.addInitScript((file) => {
  localStorage.setItem('license_file', file);
  localStorage.setItem('license_status', 'valid');
  localStorage.setItem('theme', 'light');
}, licenseFile);
await installDemoRoutes(context);

const page = await context.newPage();
const recordingStarted = Date.now();
try {
  await page.goto(`${baseURL}/members`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'จัดการสมาชิก' }).waitFor({ timeout: 20_000 });
  await page.getByText('สมศักดิ์ ตัวอย่าง').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.style.display = 'none';
    const column = document.querySelector('main')?.parentElement;
    if (column instanceof HTMLElement) column.style.paddingLeft = '0';

    const bar = document.createElement('div');
    bar.id = 'demo-caption';
    bar.style.cssText = [
      'position:fixed',
      'left:16px',
      'right:16px',
      'bottom:16px',
      'z-index:10001',
      'display:flex',
      'align-items:flex-start',
      'gap:12px',
      'padding:12px 14px',
      'border-radius:16px',
      'background:#111827',
      'color:#fff',
      'box-shadow:0 10px 30px rgb(0 0 0 / 0.18)',
    ].join(';');
    bar.innerHTML = '<span id="demo-step" style="display:inline-flex;height:28px;min-width:28px;align-items:center;justify-content:center;border-radius:999px;background:#2563eb;font:700 14px/1 sans-serif;flex:none;">1</span><span id="demo-text" style="font:600 15px/1.45 sans-serif;">กดเพิ่มสมาชิก</span>';
    document.body.appendChild(bar);

    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.cssText = 'position:fixed;z-index:10002;width:22px;height:22px;margin-left:-2px;margin-top:-2px;pointer-events:none;transition:left .28s ease,top .28s ease;filter:drop-shadow(0 1px 1px rgb(0 0 0 / .35));';
    cursor.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#111827" stroke="#fff" stroke-width="1.4" d="M5 2.5l12.8 11.2-5.3.7 3.4 6.3-2.5 1.3-3.4-6.2-5 3.6z"/></svg>';
    document.body.appendChild(cursor);

    const style = document.createElement('style');
    style.textContent = '[class*="animal-mask"]{align-items:flex-start !important;padding:72px 16px 96px !important;}';
    document.head.appendChild(style);
  });
  const leadIn = Math.max(0, (Date.now() - recordingStarted) / 1000);

  async function caption(step, text) {
    await page.evaluate(({ step, text }) => {
      const stepNode = document.getElementById('demo-step');
      const textNode = document.getElementById('demo-text');
      if (stepNode) stepNode.textContent = step;
      if (textNode) textNode.textContent = text;
    }, { step, text });
  }

  async function point(locator) {
    const box = await locator.boundingBox();
    if (!box) return;
    await page.evaluate(({ x, y }) => {
      const cursor = document.getElementById('demo-cursor');
      if (!cursor) return;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    }, { x: box.x + Math.min(28, box.width / 2), y: box.y + box.height / 2 });
    await page.waitForTimeout(280);
  }

  async function ring(locator) {
    await locator.evaluate((element) => {
      document.querySelectorAll('[data-demo-ring]').forEach((node) => {
        node.style.boxShadow = '';
        node.removeAttribute('data-demo-ring');
      });
      element.setAttribute('data-demo-ring', '');
      element.style.boxShadow = '0 0 0 3px #2563eb';
    });
  }

  async function fillField(locator, value) {
    await point(locator);
    await ring(locator);
    await locator.click();
    await locator.pressSequentially(value, { delay: 70 });
  }

  const openButton = page.getByRole('button', { name: 'เพิ่มสมาชิก' });
  await point(openButton);
  await ring(openButton);
  await page.waitForTimeout(700);
  await openButton.click();

  const nameInput = page.getByPlaceholder('กรอกชื่อ-นามสกุล');
  const codeInput = page.getByPlaceholder('รหัสสมาชิก');
  const phoneInput = page.getByPlaceholder('กรอกเบอร์โทรศัพท์');
  const idInput = page.getByPlaceholder('กรอกเลขบัตรประชาชน 13 หลัก');
  const addressInput = page.getByPlaceholder('กรอกที่อยู่');
  const bankInput = page.getByPlaceholder('เลือกหรือกรอกชื่อธนาคาร');
  const accountInput = page.getByPlaceholder('กรอกเลขบัญชี');
  const saveButton = page.locator('button[form="member-form"]');

  await nameInput.waitFor({ timeout: 10_000 });
  await page.waitForTimeout(450);

  await caption('2', 'กรอกชื่อ-นามสกุล ให้ครบ เพราะเป็นช่องที่ต้องมี');
  await fillField(nameInput, demo.name);
  await page.waitForTimeout(600);

  await caption('3', 'รหัสสมาชิก สร้างให้อัตโนมัติ แก้เองไม่ได้');
  await point(codeInput);
  await ring(codeInput);
  await page.waitForTimeout(1400);

  await caption('4', 'เบอร์โทร ระบบรับเฉพาะตัวเลข');
  await fillField(phoneInput, demo.phone);
  await page.waitForTimeout(450);

  await caption('4', 'เลขบัตรประชาชน 13 หลัก');
  await fillField(idInput, demo.idCard);
  await page.waitForTimeout(450);

  await caption('4', 'ที่อยู่ กรอกตามที่มี');
  await fillField(addressInput, demo.address);
  await page.waitForTimeout(600);

  await caption('5', 'เลือกหรือพิมพ์ชื่อธนาคาร');
  await fillField(bankInput, demo.bankName);
  await page.waitForTimeout(450);

  await caption('5', 'เลขบัญชี เป็นตัวเลข ไม่เกิน 15 หลัก');
  await fillField(accountInput, demo.bankAccount);
  await page.waitForTimeout(800);

  await caption('6', 'กดเพิ่มสมาชิก รายการใหม่ขึ้นในหน้ารายชื่อ');
  await point(saveButton);
  await ring(saveButton);
  await page.waitForTimeout(400);
  await saveButton.click();
  await page.getByRole('heading', { name: 'เพิ่มสมาชิกใหม่' }).waitFor({ state: 'hidden', timeout: 10_000 });
  const createdRow = page.getByRole('row').filter({ hasText: demo.name });
  await createdRow.waitFor({ timeout: 10_000 });
  await point(createdRow);
  await ring(createdRow);
  await page.waitForTimeout(1600);

  const crop = await page.evaluate(() => {
    const card = document.querySelector('main .rounded-2xl')?.getBoundingClientRect();
    const caption = document.getElementById('demo-caption')?.getBoundingClientRect();
    if (!card) return null;
    const x = Math.max(0, Math.min(card.x, caption?.x ?? card.x));
    const y = 0;
    const right = Math.max(card.right, caption?.right ?? card.right);
    const bottom = Math.max(card.bottom, caption?.bottom ?? card.bottom);
    return { x, y, width: right - x, height: bottom - y };
  });
  if (!crop) throw new Error('Could not measure the members card');

  const video = page.video();
  await context.close();
  const webmPath = await video.path();
  const cropped = {
    x: even(Math.max(0, crop.x)),
    y: even(Math.max(0, crop.y)),
    w: even(crop.width),
    h: even(crop.height),
  };
  if (cropped.x + cropped.w > 1280) cropped.w = even(1280 - cropped.x);
  if (cropped.y + cropped.h > 900) cropped.h = even(900 - cropped.y);

  const mp4Path = path.join(outDir, 'member-entry.mp4');
  const posterPath = path.join(outDir, 'member-entry.jpg');
  const ffmpegBin = process.env.FFMPEG ?? 'ffmpeg';
  const encode = spawnSync(ffmpegBin, [
    '-y',
    '-ss', leadIn.toFixed(2),
    '-i', webmPath,
    '-an',
    '-vf', `crop=${cropped.w}:${cropped.h}:${cropped.x}:${cropped.y}`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '24',
    '-preset', 'medium',
    '-movflags', '+faststart',
    mp4Path,
  ], { stdio: 'inherit' });
  if (encode.status !== 0) {
    throw new Error('ffmpeg failed to encode the guide clip');
  }

  const poster = spawnSync(ffmpegBin, [
    '-y',
    '-ss', '15',
    '-i', mp4Path,
    '-frames:v', '1',
    '-q:v', '3',
    posterPath,
  ], { stdio: 'inherit' });
  if (poster.status !== 0) {
    throw new Error('ffmpeg failed to write the poster frame');
  }

  const staged = path.join(workDir, 'member-entry.webm');
  await rename(webmPath, staged);
  console.log('saved', mp4Path);
  console.log('crop', cropped);
  console.log('leadIn', leadIn.toFixed(2));
} catch (error) {
  await page.screenshot({ path: path.join(workDir, 'failure.png'), fullPage: true }).catch(() => {});
  await context.close().catch(() => {});
  throw error;
} finally {
  await browser.close();
}
