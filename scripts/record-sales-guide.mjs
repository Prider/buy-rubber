/**
 * Record the sales clip shown on /guide#sales.
 * Run while `yarn dev` is already serving http://localhost:3000.
 *
 * Companies, stock, and past sales in the clip are sample rows answered
 * in this browser only. The save button is pointed at and not clicked.
 * Any write to /api/sales is aborted.
 *
 *   node scripts/record-sales-guide.mjs
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

const product = { id: 'demo-fresh', code: 'FRESH', name: 'น้ำยางสด', isActive: true };
const company = {
  id: 'demo-factory',
  code: 'FAC001',
  name: 'โรงงานตัวอย่าง',
  phone: '',
  address: '',
  isActive: true,
};

function even(value) {
  const rounded = Math.max(2, Math.round(value));
  return rounded - (rounded % 2);
}

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(offset) {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

function sampleSale(saleNo, offset, weight) {
  return {
    id: `demo-${saleNo}`,
    saleNo,
    date: daysAgo(offset),
    companyName: company.name,
    destinationCompanyId: company.id,
    productTypeId: product.id,
    productType: { name: product.name, code: product.code },
    weight,
    rubberPercent: 60,
    pricePerUnit: 50,
    expenseType: null,
    expenseCost: null,
    expenseNote: null,
    expenses: [],
    sellingType: 'จ่ายสด',
    totalAmount: weight * 50,
    unitCostPerKg: 42,
    costOfGoods: weight * 42,
    profitLoss: weight * 8,
  };
}

const demoSales = [sampleSale('SAL-2569-0042', 1, 80), sampleSale('SAL-2569-0038', 3, 40)];

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

async function installSalesRoutes(context) {
  await context.route('**/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.abort();
      return;
    }
    await route.fallback();
  });

  await context.route('**/api/sales**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: demoSales,
        pagination: { page: 1, limit: 10, total: demoSales.length, totalPages: 1 },
      }),
    });
  });

  await context.route('**/api/destination-companies**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        companies: [company],
        pagination: { page: 1, limit: 1000, total: 1, totalPages: 1, hasMore: false },
      }),
    });
  });

  await context.route('**/api/product-types**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([product]),
    });
  });

  await context.route('**/api/stock/positions**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        productTypeId: product.id,
        quantityKg: 120,
        avgCostPerKg: 42,
      }]),
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
const storagePath = path.join(workDir, 'storage-sales.json');
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
await installSalesRoutes(context);
await context.addInitScript((file) => {
  localStorage.setItem('license_file', file);
  localStorage.setItem('license_status', 'valid');
  localStorage.setItem('theme', 'light');
  HTMLInputElement.prototype.showPicker = () => {};
}, licenseFile);

const page = await context.newPage();
const recordingStarted = Date.now();
const marks = {};
try {
  await page.goto(`${baseURL}/sales`, { waitUntil: 'domcontentloaded' });
  const openForm = page.getByTestId('sales-open-form');
  await openForm.waitFor({ timeout: 20_000 });
  await page.locator('table').getByText('SAL-2569-0042').waitFor({ timeout: 20_000 });
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
    await page.waitForTimeout(220);
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

  await caption('•', 'ขายยางออกไปโรงงานจากหน้านี้ สต็อกจะลดตามน้ำหนักที่ขาย');
  await page.waitForTimeout(1100);

  await caption('1', 'กดบันทึกการขาย');
  await point(openForm);
  await ring(openForm);
  await openForm.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ timeout: 8_000 });
  await page.evaluate(() => {
    const header = document.querySelector('header');
    const top = (header ? header.getBoundingClientRect().bottom : 0) + 8;
    const shell = document.querySelector('[role="dialog"]')?.parentElement;
    if (!shell) return;
    shell.style.alignItems = 'flex-start';
    shell.style.justifyContent = 'flex-start';
    shell.style.paddingTop = `${top}px`;
    shell.style.paddingBottom = '88px';
    shell.style.overflow = 'auto';
  });
  await page.waitForTimeout(400);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateInput = dialog.locator('input[name="date"]');
  await caption('2', 'เลือกวันที่ ค่าเริ่มต้นคือวันนี้ เปลี่ยนได้ถ้าบันทึกย้อนหลัง');
  await point(dateInput);
  await ring(dateInput);
  await dateInput.evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, isoDate(yesterday));
  await page.waitForTimeout(700);

  const companySearch = dialog.getByTestId('sales-company-search');
  await caption('3', 'ค้นชื่อบริษัทปลายทาง แล้วเลือกจากรายการ');
  await point(companySearch);
  await ring(companySearch);
  await companySearch.click();
  await companySearch.pressSequentially('โรงงาน', { delay: 140 });
  const companyOption = dialog.getByTestId('sales-company-option-demo-factory');
  await companyOption.waitFor({ timeout: 8_000 });
  await companySearch.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => {
    const input = document.querySelector('[data-testid="sales-company-search"]');
    return input instanceof HTMLInputElement && input.value.includes('โรงงานตัวอย่าง');
  });
  await page.waitForTimeout(600);

  const sellingType = dialog.locator('select[name="sellingType"]');
  await caption('4', 'เลือกรูปแบบการขาย จ่ายสด ขายล่วง หรือฝาก');
  await point(sellingType);
  await ring(sellingType);
  await sellingType.selectOption('ขายล่วง');
  await page.waitForTimeout(700);

  const productSelect = dialog.locator('select[name="productTypeId"]');
  await caption('5', 'เลือกประเภทสินค้าจากสินค้าที่มีในสต็อก');
  await point(productSelect);
  await ring(productSelect);
  await productSelect.selectOption(product.id);
  await dialog.getByText('คงเหลือ 120 กก.').waitFor({ timeout: 8_000 });
  await page.waitForTimeout(700);

  const rubber = dialog.locator('input[name="rubberPercent"]');
  await caption('6', 'กรอก %ยาง เมื่อต้องระบุเปอร์เซ็นต์เนื้อยางของล็อต');
  await point(rubber);
  await ring(rubber);
  await rubber.fill('60');
  await page.waitForTimeout(500);

  const weight = dialog.locator('input[name="weight"]');
  await caption('7', 'กรอกน้ำหนัก ไม่เกินสต็อกคงเหลือ กดทั้งหมดได้ถ้าขายยกกอง');
  await point(dialog.getByTestId('sales-fill-weight-stock'));
  await ring(dialog.getByTestId('sales-fill-weight-stock'));
  await page.waitForTimeout(500);
  await weight.click();
  await weight.fill('40');
  await weight.blur();
  await page.waitForTimeout(500);

  const price = dialog.locator('input[name="pricePerUnit"]');
  await caption('8', 'กรอกราคาต่อกิโลกรัม เทียบกับต้นทุนเฉลี่ยก่อนตั้งราคาขาย');
  await point(dialog.getByTestId('sales-fill-price-avg-cost'));
  await ring(dialog.getByTestId('sales-fill-price-avg-cost'));
  await page.waitForTimeout(450);
  await price.click();
  await price.fill('50');
  await price.blur();
  await page.waitForTimeout(500);

  const addExpense = dialog.getByTestId('sales-add-expense');
  await caption('9', 'ใส่ค่าใช้จ่ายของการขายได้ เช่น ค่าขนส่ง สูงสุด 4 รายการ');
  await addExpense.scrollIntoViewIfNeeded();
  await point(addExpense);
  await ring(addExpense);
  await addExpense.click();
  const expenseRow = dialog.getByTestId('sales-expense-row-0');
  await expenseRow.waitFor();
  await expenseRow.locator('select').selectOption('ค่าขนส่ง');
  await expenseRow.locator('input[type="number"]').fill('200');
  await expenseRow.getByPlaceholder('เช่น ค่าขนส่ง...').fill('รถไปโรงงาน');
  await page.waitForTimeout(700);

  const saveButton = dialog.getByTestId('sales-form-save');
  await saveButton.scrollIntoViewIfNeeded();
  if (!(await saveButton.isEnabled())) {
    throw new Error('sale form never became ready to save');
  }
  await caption('✓', 'ตรวจยอดรวมและกำไร แล้วกดบันทึก สต็อกจะลดตามน้ำหนัก คลิปนี้ยังไม่กดบันทึก');
  await point(saveButton);
  await ring(saveButton);
  await page.waitForTimeout(1400);
  mark('ready');

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

  const mp4Path = path.join(outDir, 'sales-entry.mp4');
  const posterPath = path.join(outDir, 'sales-entry.jpg');
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
  if (encode.status !== 0) throw new Error('ffmpeg failed to encode the sales clip');

  const posterAt = (marks.ready ?? 8).toFixed(2);
  const poster = spawnSync(ffmpegBin, [
    '-y',
    '-ss', posterAt,
    '-i', mp4Path,
    '-frames:v', '1',
    '-update', '1',
    '-q:v', '3',
    posterPath,
  ], { stdio: 'inherit' });
  if (poster.status !== 0) throw new Error('ffmpeg failed to write the sales poster');

  await rename(webmPath, path.join(workDir, 'sales-entry.webm'));
  console.log('saved', mp4Path);
  console.log('marks', marks, 'poster', posterAt, 'leadIn', leadIn.toFixed(2));
} catch (error) {
  await page.screenshot({ path: path.join(workDir, 'sales-failure.png') }).catch(() => {});
  await context.close();
  throw error;
} finally {
  await browser.close();
}
