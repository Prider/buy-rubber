/**
 * Record the purchase-entry clip shown on /guide#purchase.
 * Run while `yarn dev` is already serving http://localhost:3000.
 *
 * Uses the local offline license file so the fresh browser can open the app.
 * Member names in the clip are replaced with a sample name.
 *
 *   node scripts/record-purchase-guide.mjs
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

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

async function installDemoRoutes(context, sample) {
  await context.route('**/api/members**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const json = await response.json();
    const members = Array.isArray(json.members) ? json.members : [];
    const source = members.find((member) => member.id === sample.memberId) ?? members[0] ?? {};
    const demo = {
      ...source,
      id: sample.memberId || source.id,
      code: 'M001',
      name: 'สมชาย ตัวอย่าง',
      phone: '',
      idCard: '',
      address: '',
      bankName: '',
      bankAccount: '',
      tapperName: '',
      group: null,
    };
    await route.fulfill({
      response,
      json: {
        ...json,
        members: [demo],
        pagination: {
          ...(json.pagination ?? {}),
          page: 1,
          total: 1,
          totalPages: 1,
          hasMore: false,
        },
      },
    });
  });

  await context.route('**/api/purchases**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.abort();
      return;
    }
    const response = await route.fetch();
    const json = await response.json();
    const requestUrl = new URL(route.request().url());
    if (!Array.isArray(json)) {
      await route.fulfill({ response, json });
      return;
    }
    let rows = json;
    if (requestUrl.searchParams.get('productTypeId') && requestUrl.searchParams.get('memberId') && rows.length === 0) {
      rows = [{
        id: 'demo-recent-price',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        basePrice: 45,
        productTypeId: requestUrl.searchParams.get('productTypeId'),
        memberId: requestUrl.searchParams.get('memberId'),
      }];
    }
    console.log('recent prices', rows.length, 'for', requestUrl.searchParams.get('productTypeId') ? 'product' : 'list');
    await route.fulfill({
      response,
      json: rows.map((row) => ({
        ...row,
        member: row.member
          ? {
              ...row.member,
              name: 'สมชาย ตัวอย่าง',
              code: 'M001',
              phone: '',
              idCard: '',
              address: '',
              bankAccount: '',
              tapperName: '',
            }
          : row.member,
      })),
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
const storagePath = path.join(workDir, 'storage.json');
await probe.storageState({ path: storagePath });
const sample = await probePage.evaluate(async () => {
  const purchasesResponse = await fetch('/api/purchases?limit=30');
  const purchases = purchasesResponse.ok ? await purchasesResponse.json() : [];
  const hit = Array.isArray(purchases)
    ? purchases.find((row) => row.memberId && row.productType?.code && Number(row.basePrice) > 0)
    : null;
  if (hit) {
    return {
      memberId: hit.memberId,
      productCode: hit.productType.code,
      productName: hit.productType.name,
    };
  }
  const [membersResponse, typesResponse] = await Promise.all([
    fetch('/api/members?active=true&limit=100'),
    fetch('/api/product-types'),
  ]);
  const membersJson = membersResponse.ok ? await membersResponse.json() : {};
  const types = typesResponse.ok ? await typesResponse.json() : [];
  const member = (membersJson.members || membersJson)[0];
  const product = Array.isArray(types) ? types.find((type) => type.isActive !== false) || types[0] : null;
  if (!member || !product) return null;
  return { memberId: member.id, productCode: product.code, productName: product.name };
});
await probe.close();

if (!sample?.memberId || !sample.productCode) {
  await browser.close();
  throw new Error('Need at least one member and one product type to record the guide clip');
}
console.log('recording with product', sample.productCode);

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

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
await installDemoRoutes(context, sample);

const page = await context.newPage();
const recordingStarted = Date.now();
try {
  await page.goto(`${baseURL}/purchases`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="date"]').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    const form = document.querySelector('form');
    const card = form?.closest('[class*="rounded-2xl"]');
    if (!card || !form) return;
    const fee = [...card.querySelectorAll('h3')].find((node) => node.textContent?.includes('บันทึกค่าบริการ'));
    let feeBlock = fee instanceof HTMLElement ? fee : null;
    while (feeBlock && feeBlock.parentElement && feeBlock.parentElement !== card) {
      feeBlock = feeBlock.parentElement;
    }
    if (feeBlock && feeBlock !== card) feeBlock.style.display = 'none';

    card.style.alignSelf = 'start';
    card.style.height = 'auto';
    card.style.maxHeight = 'none';
    card.style.overflow = 'visible';
    const scroller = form.parentElement;
    if (scroller) {
      scroller.style.overflow = 'visible';
      scroller.style.maxHeight = 'none';
    }

    const bar = document.createElement('div');
    bar.id = 'demo-caption';
    bar.style.cssText = [
      'display:flex',
      'align-items:flex-start',
      'gap:12px',
      'margin:12px',
      'padding:12px 14px',
      'border-radius:16px',
      'background:#111827',
      'color:#fff',
      'box-shadow:0 10px 30px rgb(0 0 0 / 0.18)',
    ].join(';');
    bar.innerHTML = '<span id="demo-step" style="display:inline-flex;height:28px;min-width:28px;align-items:center;justify-content:center;border-radius:999px;background:#2563eb;font:700 14px/1 sans-serif;flex:none;"></span><span id="demo-text" style="font:600 15px/1.45 sans-serif;"></span>';
    card.appendChild(bar);

    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.cssText = 'position:fixed;z-index:10000;width:22px;height:22px;margin-left:-2px;margin-top:-2px;pointer-events:none;transition:left .28s ease,top .28s ease;filter:drop-shadow(0 1px 1px rgb(0 0 0 / .35));';
    cursor.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#111827" stroke="#fff" stroke-width="1.4" d="M5 2.5l12.8 11.2-5.3.7 3.4 6.3-2.5 1.3-3.4-6.2-5 3.6z"/></svg>';
    document.body.appendChild(cursor);

    const style = document.createElement('style');
    style.textContent = '[data-member-option]:focus,[data-product-type-option]:focus{background:#dbeafe !important;outline:2px solid #2563eb;outline-offset:-2px;}';
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

  const dateInput = page.locator('input[name="date"]');
  const memberInput = page.getByPlaceholder('ค้นหาสมาชิกตามชื่อหรือรหัส');
  const productInput = page.getByPlaceholder('ค้นหาตามชื่อหรือรหัส...');
  const grossInput = page.locator('input[name="grossWeight"]');
  const containerInput = page.locator('input[name="containerWeight"]');
  const priceInput = page.locator('input[name="pricePerUnit"]');
  const addButton = page.locator('form').getByRole('button', { name: 'เพิ่มลงตะกร้า' });
  const resetButton = page.locator('form').getByRole('button', { name: 'รีเซ็ต' });

  await caption('1', 'วันที่รับซื้อ ค่าเริ่มต้นคือวันนี้ เปลี่ยนได้ถ้าบันทึกย้อนหลัง');
  await point(dateInput);
  await ring(dateInput);
  await dateInput.click();
  await page.waitForTimeout(500);
  await dateInput.fill(isoDate(yesterday));
  await page.waitForTimeout(1200);

  await caption('2', 'สมาชิก พิมพ์ชื่อหรือรหัส แล้วกดลูกศรลงเพื่อเลือก');
  await point(memberInput);
  await ring(memberInput);
  await memberInput.click();
  await memberInput.pressSequentially('สมชาย', { delay: 90 });
  await page.locator('[data-member-option]').first().waitFor();
  await page.waitForTimeout(450);
  await memberInput.press('ArrowDown');
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);

  await caption('3', 'ประเภทสินค้า พิมพ์ชื่อหรือรหัสแล้วเลือก');
  await point(productInput);
  await ring(productInput);
  await productInput.click();
  await productInput.pressSequentially(sample.productCode, { delay: 90 });
  await page.locator('[data-product-type-option]').first().waitFor();
  await page.waitForTimeout(450);
  await productInput.press('ArrowDown');
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);

  await caption('4', 'น้ำหนักรวมภาชนะ น้ำหนักทั้งถังหรือทั้งตะกร้า หน่วยกิโลกรัม');
  await point(grossInput);
  await ring(grossInput);
  await grossInput.click();
  await grossInput.pressSequentially('50', { delay: 140 });
  await page.waitForTimeout(500);

  await caption('↵', 'กด Enter เพื่อเลื่อนไปช่องถัดไป โดยไม่ต้องใช้เมาส์');
  await grossInput.press('Enter');
  await page.waitForTimeout(600);

  await caption('5', 'น้ำหนักภาชนะ น้ำหนักถังเปล่า ใส่ 0 ได้ถ้าชั่งสุทธิมาแล้ว');
  await point(containerInput);
  await ring(containerInput);
  await containerInput.pressSequentially('2', { delay: 140 });
  await page.waitForTimeout(800);

  await caption('6', 'น้ำหนักสุทธิ ระบบคำนวณให้ เป็นน้ำหนักรวมภาชนะลบน้ำหนักภาชนะ');
  await ring(page.locator('input[name="netWeight"]'));
  await page.waitForTimeout(1100);

  await caption('7', 'ราคาต่อหน่วย กดปุ่มราคาล่าสุดเพื่อใส่ให้เลย');
  const priceChip = page.getByRole('button', { name: /บาท\/กก/ }).first();
  const chipShown = await priceChip.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false);
  if (chipShown) {
    await priceInput.click();
    await priceInput.fill('');
    await page.waitForTimeout(400);
    await point(priceChip);
    await priceChip.click();
  } else {
    console.log('latest price chip did not appear');
    await point(priceInput);
    await ring(priceInput);
    await priceInput.click();
    await priceInput.pressSequentially('45', { delay: 120 });
  }
  await page.waitForTimeout(1000);

  await caption('8', 'ยอดเงินรวม คำนวณจากน้ำหนักสุทธิคูณราคาต่อหน่วย');
  await ring(page.locator('input[name="totalAmount"]'));
  await page.waitForTimeout(1200);

  await caption('✓', 'กดเพิ่มลงตะกร้า ฟอร์มพร้อมรายการถัดไปของคนเดิม');
  await point(addButton);
  await addButton.click();
  await page.getByText('บันทึกการรับซื้อ').click();
  await page.waitForTimeout(1600);

  await caption('↺', 'กรอกผิด กดรีเซ็ตเพื่อเริ่มแถวนั้นใหม่');
  await point(grossInput);
  await ring(grossInput);
  await grossInput.click();
  await grossInput.pressSequentially('9', { delay: 120 });
  await page.waitForTimeout(500);
  await point(resetButton);
  await resetButton.click();
  await page.waitForTimeout(1400);

  const crop = await page.evaluate(() => {
    const grid = document.querySelector('main .grid');
    const left = grid?.children[0]?.getBoundingClientRect();
    const right = grid?.children[1]?.getBoundingClientRect();
    if (!left || !right) return null;
    const x = Math.min(left.x, right.x);
    const y = Math.min(left.y, right.y);
    return {
      x,
      y,
      width: Math.max(left.right, right.right) - x,
      height: Math.max(left.bottom, right.bottom) - y,
    };
  });
  if (!crop) throw new Error('Could not measure the form card');

  const video = page.video();
  await context.close();
  const webmPath = await video.path();
  const cropped = {
    x: even(Math.max(0, crop.x - 6)),
    y: even(Math.max(0, crop.y - 6)),
    w: even(crop.width + 12),
    h: even(crop.height + 12),
  };
  if (cropped.x + cropped.w > 1280) cropped.w = even(1280 - cropped.x);
  if (cropped.y + cropped.h > 800) cropped.h = even(800 - cropped.y);

  const mp4Path = path.join(outDir, 'purchase-entry.mp4');
  const posterPath = path.join(outDir, 'purchase-entry.jpg');
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
    '-ss', '8',
    '-i', mp4Path,
    '-frames:v', '1',
    '-q:v', '3',
    posterPath,
  ], { stdio: 'inherit' });
  if (poster.status !== 0) {
    throw new Error('ffmpeg failed to write the poster frame');
  }

  const staged = path.join(workDir, 'purchase-entry.webm');
  await rename(webmPath, staged);
  console.log('saved', mp4Path);
  console.log('crop', cropped);
} catch (error) {
  await page.screenshot({ path: path.join(workDir, 'failure.png') }).catch(() => {});
  await context.close();
  throw error;
} finally {
  await browser.close();
}
