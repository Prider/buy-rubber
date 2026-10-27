/**
 * Record the history clip shown on /guide#history.
 * Run while `yarn dev` is already serving http://localhost:3000.
 *
 * Bills in the clip are sample rows answered in this browser only.
 * Print is shown in the page instead of the system print dialog.
 * Delete is opened only as far as the confirmation, then cancelled.
 * Any DELETE request is aborted.
 *
 *   node scripts/record-history-guide.mjs
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
const workDir = path.join(os.tmpdir(), 'guide-video');
const licenseFile = await readFile(licensePath, 'utf8');

function even(value) {
  const rounded = Math.max(2, Math.round(value));
  return rounded - (rounded % 2);
}

function daysAgo(offset) {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  date.setHours(9, 15, 0, 0);
  return date.toISOString();
}

function member(code, name) {
  return { id: `demo-${code}`, code, name };
}

function purchase(purchaseNo, when, person, weight, price) {
  return {
    id: `${purchaseNo}-line`,
    purchaseNo,
    date: when,
    member: person,
    productType: { id: 'demo-fresh', code: 'FRESH', name: 'น้ำยางสด' },
    netWeight: weight,
    finalPrice: price,
    totalAmount: Math.round(weight * price),
  };
}

function bill(purchaseNo, offset, person, weight, price) {
  const when = daysAgo(offset);
  const line = purchase(purchaseNo, when, person, weight, price);
  return {
    purchaseNo,
    date: when,
    createdAt: when,
    purchases: [line],
    serviceFees: [],
    totalAmount: line.totalAmount,
    member: person,
  };
}

const somchai = member('M001', 'สมชาย ตัวอย่าง');
const somying = member('M002', 'สมหญิง ตัวอย่าง');
const demoBills = [
  bill('PUR-2569-0108', 1, somchai, 48, 45),
  bill('PUR-2569-0107', 2, somying, 30, 50),
  bill('PUR-2569-0104', 4, somchai, 22, 44),
];

function matchesSearch(row, term) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [row.purchaseNo, row.member?.name, row.member?.code]
    .some((value) => String(value || '').toLowerCase().includes(query));
}

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

async function installHistoryRoutes(context) {
  await context.route('**/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.abort();
      return;
    }
    await route.fallback();
  });

  await context.route('**/api/slip/settings**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        companyName: 'จุดรับซื้อตัวอย่าง',
        companyAddress: 'ตัวอย่าง ที่อยู่จุดรับซื้อ',
        taxId: '',
        footerText: 'กรุณาตรวจสอบยอดก่อนออกจากจุดรับซื้อ',
        fontSize: 'md',
        paperSize: '80mm',
        template: 'slip',
      }),
    });
  });

  await context.route('**/api/purchases/transactions**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.abort();
      return;
    }
    const requestUrl = new URL(route.request().url());
    const term = requestUrl.searchParams.get('search') ?? '';
    const transactions = demoBills.filter((row) => matchesSearch(row, term));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transactions,
        pagination: {
          page: 1,
          limit: 10,
          total: transactions.length,
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

await mkdir(workDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const probe = await browser.newContext({
  viewport: { width: 1280, height: 800 },
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
const storagePath = path.join(workDir, 'storage-history.json');
await probe.storageState({ path: storagePath });
await probe.close();

const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: 'th-TH',
  colorScheme: 'light',
  storageState: storagePath,
  recordVideo: { dir: workDir, size: { width: 1280, height: 800 } },
});
await allowLocalLicense(context);
await installHistoryRoutes(context);
await context.addInitScript((file) => {
  localStorage.setItem('license_file', file);
  localStorage.setItem('license_status', 'valid');
  localStorage.setItem('theme', 'light');

  window.open = () => {
    const backdrop = document.createElement('div');
    backdrop.id = 'demo-print-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgb(17 24 39 / .45);';
    const frame = document.createElement('iframe');
    frame.id = 'demo-print-frame';
    frame.title = 'ตัวอย่างสลิป';
    frame.style.cssText = [
      'position:fixed',
      'top:56px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:360px',
      'height:560px',
      'z-index:100002',
      'border:0',
      'border-radius:16px',
      'background:#fff',
      'box-shadow:0 20px 50px rgb(0 0 0 / .35)',
    ].join(';');
    document.body.append(backdrop, frame);
    const doc = frame.contentDocument;
    return {
      document: doc,
      print() {},
      focus() {},
      close() {
        frame.remove();
        backdrop.remove();
      },
    };
  };
}, licenseFile);

const page = await context.newPage();
const recordingStarted = Date.now();
const marks = {};
try {
  await page.goto(`${baseURL}/purchases-list`, { waitUntil: 'domcontentloaded' });
  const search = page.getByPlaceholder('ค้นหารายการตามเลขที่รับซื้อ, ชื่อสมาชิก หรือรหัสสมาชิก...');
  await search.waitFor({ timeout: 20_000 });
  const table = page.locator('table');
  await table.getByText('PUR-2569-0108').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.style.display = 'none';
    const main = document.querySelector('main');
    const shell = main?.parentElement;
    if (shell) shell.style.paddingLeft = '0px';

    const bar = document.createElement('div');
    bar.id = 'demo-caption';
    bar.style.cssText = [
      'position:fixed',
      'left:16px',
      'right:16px',
      'bottom:16px',
      'z-index:100003',
      'display:flex',
      'align-items:flex-start',
      'gap:12px',
      'padding:12px 14px',
      'border-radius:16px',
      'background:#111827',
      'color:#fff',
      'box-shadow:0 10px 30px rgb(0 0 0 / 0.18)',
    ].join(';');
    bar.innerHTML = '<span id="demo-step" style="display:inline-flex;height:28px;min-width:28px;align-items:center;justify-content:center;border-radius:999px;background:#2563eb;font:700 14px/1 sans-serif;flex:none;"></span><span id="demo-text" style="font:600 15px/1.45 sans-serif;"></span>';
    document.body.appendChild(bar);

    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.cssText = 'position:fixed;z-index:100004;width:22px;height:22px;margin-left:-2px;margin-top:-2px;pointer-events:none;transition:left .28s ease,top .28s ease;filter:drop-shadow(0 1px 1px rgb(0 0 0 / .35));';
    cursor.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#111827" stroke="#fff" stroke-width="1.4" d="M5 2.5l12.8 11.2-5.3.7 3.4 6.3-2.5 1.3-3.4-6.2-5 3.6z"/></svg>';
    document.body.appendChild(cursor);
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

  function mark(name) {
    marks[name] = Math.max(0, (Date.now() - recordingStarted) / 1000 - leadIn);
  }

  await caption('•', 'ค้นได้จากเลขที่รับซื้อ ชื่อสมาชิก หรือรหัสสมาชิก');
  await page.waitForTimeout(1400);

  await caption('1', 'พิมพ์ชื่อสมาชิก รายการที่ตรงจะเหลือในตาราง');
  await point(search);
  await ring(search);
  await search.click();
  await search.pressSequentially('สมชาย', { delay: 180 });
  await page.getByText('2 จาก 2').waitFor({ timeout: 8_000 });
  await table.getByText('สมหญิง ตัวอย่าง').waitFor({ state: 'hidden', timeout: 8_000 });
  const foundRow = table.locator('tr', { hasText: 'PUR-2569-0108' });
  await ring(foundRow);
  await page.waitForTimeout(1200);
  mark('results');

  const printButton = foundRow.getByRole('button', { name: 'พิมพ์' });
  await caption('2', 'กดพิมพ์ เพื่อพิมพ์สลิปอีกครั้ง รูปแบบขึ้นกับที่ตั้งไว้ในตั้งค่าใบรับซื้อ');
  await point(printButton);
  await ring(printButton);
  await printButton.click();
  await page.locator('#demo-print-frame').waitFor({ timeout: 8_000 });
  await page.waitForTimeout(1800);
  mark('slip');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    document.getElementById('demo-print-frame')?.remove();
    document.getElementById('demo-print-backdrop')?.remove();
  });
  await page.waitForTimeout(400);

  const deleteButton = foundRow.getByRole('button', { name: 'ลบ' });
  await caption('3', 'กดลบได้เฉพาะบัญชีเจ้าของ ระบบจะถามยืนยันก่อนลบ');
  await point(deleteButton);
  await ring(deleteButton);
  await deleteButton.click();
  const dialog = page.getByRole('alertdialog');
  await dialog.waitFor({ timeout: 8_000 });
  await page.waitForTimeout(1400);
  mark('confirm');

  const cancel = dialog.getByRole('button', { name: 'ยกเลิก' });
  await caption('✕', 'กดยกเลิกถ้ายังไม่ต้องการลบ การลบมีผลกับสต็อกและรายงาน');
  await point(cancel);
  await ring(cancel);
  await page.waitForTimeout(900);
  await cancel.click();
  await dialog.waitFor({ state: 'hidden', timeout: 8_000 });
  await page.waitForTimeout(900);

  const crop = await page.evaluate(() => {
    const header = document.querySelector('header');
    const top = header ? header.getBoundingClientRect().bottom : 0;
    return { x: 0, y: top, width: window.innerWidth, height: window.innerHeight - top };
  });

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
  if (cropped.y + cropped.h > 800) cropped.h = even(800 - cropped.y);

  const mp4Path = path.join(outDir, 'history-entry.mp4');
  const posterPath = path.join(outDir, 'history-entry.jpg');
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
    '-movflags', '+faststart',
    mp4Path,
  ], { stdio: 'inherit' });
  if (encode.status !== 0) throw new Error('ffmpeg failed to encode the history clip');

  const posterAt = (marks.slip ?? marks.results ?? 4).toFixed(2);
  const poster = spawnSync(ffmpegBin, [
    '-y',
    '-ss', posterAt,
    '-i', mp4Path,
    '-frames:v', '1',
    '-update', '1',
    '-q:v', '3',
    posterPath,
  ], { stdio: 'inherit' });
  if (poster.status !== 0) throw new Error('ffmpeg failed to write the history poster');

  await rename(webmPath, path.join(workDir, 'history-entry.webm'));
  console.log('saved', mp4Path);
  console.log('marks', marks, 'poster', posterAt, 'leadIn', leadIn.toFixed(2));
} catch (error) {
  await page.screenshot({ path: path.join(workDir, 'history-failure.png') }).catch(() => {});
  await context.close();
  throw error;
} finally {
  await browser.close();
}
