/**
 * Record the stock clip shown on /guide#stock.
 * Run while `yarn dev` is already serving http://localhost:3000.
 *
 * The new product type is only in this browser session. The save request
 * is answered locally and is not written to the shop database.
 *
 *   node scripts/record-stock-guide.mjs
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

function installStockRoutes(context) {
  let demoRow = null;

  return {
    created() {
      return demoRow;
    },
    async install() {
      await context.route('**/api/product-types**', async (route) => {
        const method = route.request().method();
        if (method === 'POST' && route.request().url().endsWith('/api/product-types')) {
          const body = route.request().postDataJSON() ?? {};
          const code = String(body.code || 'FRESH').toUpperCase();
          const name = String(body.name || 'น้ำยางสด');
          demoRow = {
            productTypeId: 'demo-stock-type',
            productType: {
              id: 'demo-stock-type',
              code,
              name,
              description: body.description || '',
              isActive: true,
            },
            quantityKg: 0,
            avgCostPerKg: 0,
            avgSellingPricePerKg: null,
            soldKg: 0,
          };
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'demo-stock-type', code, name, description: body.description || '', isActive: true }),
          });
          return;
        }
        if (method !== 'GET') {
          await route.abort();
          return;
        }
        await route.continue();
      });

      await context.route('**/api/stock/positions**', async (route) => {
        if (route.request().method() !== 'GET') {
          await route.abort();
          return;
        }
        const response = await route.fetch();
        const json = await response.json();
        if (!demoRow || !Array.isArray(json)) {
          await route.fulfill({ response, json });
          return;
        }
        const withoutDemo = json.filter((row) => row.productType?.code !== demoRow.productType.code);
        await route.fulfill({ response, json: [demoRow, ...withoutDemo] });
      });
    },
  };
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
const storagePath = path.join(workDir, 'storage-stock.json');
await probe.storageState({ path: storagePath });
const codes = await probePage.evaluate(async () => {
  const response = await fetch('/api/stock/positions?includeInactive=1');
  const rows = await response.json();
  return Array.isArray(rows) ? rows.map((row) => row.productType?.code).filter(Boolean) : [];
});
await probe.close();

const preferred = ['FRESH', 'DRY', 'SHEET', 'CUP'];
const code = preferred.find((item) => !codes.includes(item)) ?? 'GUIDE';
const typedCode = code.toLowerCase();
console.log('recording product code', code);

const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: 'th-TH',
  colorScheme: 'light',
  storageState: storagePath,
  recordVideo: { dir: workDir, size: { width: 1280, height: 800 } },
});
await allowLocalLicense(context);
await context.addInitScript((file) => {
  localStorage.setItem('license_file', file);
  localStorage.setItem('license_status', 'valid');
  localStorage.setItem('theme', 'light');
}, licenseFile);
const stockRoutes = installStockRoutes(context);
await stockRoutes.install();

const page = await context.newPage();
const recordingStarted = Date.now();
try {
  await page.goto(`${baseURL}/stock`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'เพิ่มประเภทสินค้า' }).waitFor({ timeout: 20_000 });
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
      'z-index:100000',
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
    cursor.style.cssText = 'position:fixed;z-index:100001;width:22px;height:22px;margin-left:-2px;margin-top:-2px;pointer-events:none;transition:left .28s ease,top .28s ease;filter:drop-shadow(0 1px 1px rgb(0 0 0 / .35));';
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

  const addButton = page.getByRole('button', { name: 'เพิ่มประเภทสินค้า' }).first();
  await caption('•', 'แต่ละแถวคือหนึ่งประเภทสินค้า สต็อกคงเหลือเป็นกิโลกรัม อย่าแก้ตัวเลขด้วยมือ');
  await page.waitForTimeout(1400);

  await caption('1', 'กดเพิ่มประเภทสินค้า');
  await point(addButton);
  await addButton.click();
  const codeInput = page.getByPlaceholder('เช่น FRESH, DRY');
  await codeInput.waitFor();
  await page.waitForTimeout(500);

  await caption('2', 'รหัสประเภท พิมพ์ตัวเล็ก ระบบทำให้เป็นตัวพิมพ์ใหญ่');
  await point(codeInput);
  await ring(codeInput);
  await codeInput.click();
  await codeInput.pressSequentially(typedCode, { delay: 160 });
  await page.waitForTimeout(900);
  await codeInput.press('Enter');
  await page.waitForTimeout(400);

  const nameInput = page.getByPlaceholder('เช่น น้ำยางสด, ยางแห้ง');
  await caption('3', 'กรอกชื่อที่พนักงานอ่านออก เช่น น้ำยางสด');
  await point(nameInput);
  await ring(nameInput);
  await nameInput.pressSequentially('น้ำยางสด', { delay: 110 });
  await page.waitForTimeout(800);
  await nameInput.press('Enter');
  await page.waitForTimeout(350);

  const description = page.getByPlaceholder('รายละเอียดเพิ่มเติม (ถ้ามี)');
  await caption('4', 'กรอกคำอธิบายถ้าต้องการ');
  await point(description);
  await ring(description);
  await description.pressSequentially('จากสวน', { delay: 120 });
  await page.waitForTimeout(800);

  const saveButton = page.locator('button[form="product-type-form"]');
  await caption('5', 'กดเพิ่มประเภทสินค้า แถวใหม่ขึ้นในตาราง สต็อกเริ่มที่ 0');
  await point(saveButton);
  await saveButton.click();
  const createdRow = page.locator('tr', { hasText: code });
  await createdRow.waitFor({ timeout: 8_000 });
  await createdRow.scrollIntoViewIfNeeded();
  await ring(createdRow);
  await page.waitForTimeout(1400);

  await caption('↗', 'กดประวัติเพื่อดูความเคลื่อนไหวของสินค้านั้น');
  const historyButton = createdRow.getByRole('button', { name: 'ประวัติ' });
  await point(historyButton);
  await ring(historyButton);
  await page.waitForTimeout(1200);

  await caption('⏸', 'ปิดรับชั่วคราวได้ที่ปุ่มกำลังนำส่ง ประวัติเดิมยังอยู่ และเปิดกลับมาได้');
  const suspendButton = createdRow.getByRole('button', { name: 'กำลังนำส่ง' });
  await point(suspendButton);
  await ring(suspendButton);
  await page.waitForTimeout(1400);

  await caption('✕', 'ถ้ามีประวัติอยู่แล้ว กดลบจะไม่ลบจริง แต่จะปิดการใช้งานแทน');
  const deleteButton = createdRow.getByRole('button', { name: 'ลบ' });
  await point(deleteButton);
  await ring(deleteButton);
  await page.waitForTimeout(1400);

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

  const mp4Path = path.join(outDir, 'stock-entry.mp4');
  const posterPath = path.join(outDir, 'stock-entry.jpg');
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
  if (encode.status !== 0) throw new Error('ffmpeg failed to encode the stock clip');

  const poster = spawnSync(ffmpegBin, [
    '-y',
    '-ss', '8',
    '-i', mp4Path,
    '-frames:v', '1',
    '-update', '1',
    '-q:v', '3',
    posterPath,
  ], { stdio: 'inherit' });
  if (poster.status !== 0) throw new Error('ffmpeg failed to write the stock poster');

  await rename(webmPath, path.join(workDir, 'stock-entry.webm'));
  console.log('saved', mp4Path);
  console.log('created in session only', Boolean(stockRoutes.created()));
} catch (error) {
  await page.screenshot({ path: path.join(workDir, 'stock-failure.png') }).catch(() => {});
  await context.close();
  throw error;
} finally {
  await browser.close();
}
