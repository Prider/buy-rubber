/**
 * Record the first-day setup clip shown on /guide#setup.
 * Run while `yarn dev` is already serving http://localhost:3000.
 *
 * Slip text, stock, members, companies, users, and backups in the clip
 * are sample rows answered in this browser only. Writes are not sent
 * to the shop database.
 *
 *   node scripts/record-setup-guide.mjs
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
const workDir = path.join(os.tmpdir(), 'guide-video-setup');
const licenseFile = await readFile(licensePath, 'utf8');

const blank = '\u200b';

const stockRows = [
  {
    productTypeId: 'demo-sheet',
    productType: {
      id: 'demo-sheet',
      code: 'SHEET',
      name: 'ยางแผ่น',
      description: '',
      isActive: true,
    },
    quantityKg: 0,
    avgCostPerKg: 0,
    avgSellingPricePerKg: null,
    soldKg: 0,
  },
];

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

const members = [
  memberRecord({
    id: 'demo-m1',
    code: 'M001',
    name: 'สมศักดิ์ ตัวอย่าง',
    phone: '0811111111',
  }),
];

const companies = [
  {
    id: 'demo-factory',
    code: 'FAC001',
    name: 'บริษัทตัวอย่าง',
    phone: '',
    address: '',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const users = [
  {
    id: 'demo-admin',
    username: 'admin',
    role: 'admin',
    other: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const backups = [];

function even(value) {
  const rounded = Math.max(2, Math.round(value));
  return rounded - (rounded % 2);
}

function companyPage(list) {
  return {
    companies: list,
    pagination: {
      page: 1,
      limit: 10,
      total: list.length,
      totalPages: 1,
      hasMore: false,
    },
  };
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

async function installDemoRoutes(context) {
  await context.route('**/*', async (route) => {
    const request = route.request();
    const method = request.method();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      await route.fallback();
      return;
    }
    const url = request.url();
    if (url.includes('/_next/') || url.includes('/api/auth') || url.includes('/api/license')) {
      await route.fallback();
      return;
    }
    console.log('blocked', method, url);
    await route.abort();
  });

  await context.route('**/api/slip/settings**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          companyName: blank,
          companyAddress: blank,
          taxId: '',
          footerText: blank,
          fontSize: 'h2',
          paperSize: '80mm',
          template: 'slip',
        }),
      });
      return;
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON() ?? {};
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          companyName: body.companyName ?? '',
          companyAddress: body.companyAddress ?? '',
          taxId: body.taxId ?? '',
          footerText: body.footerText ?? '',
          fontSize: body.fontSize ?? 'h2',
          paperSize: body.paperSize ?? '80mm',
          template: body.template ?? 'slip',
        }),
      });
      return;
    }
    await route.abort();
  });

  await context.route('**/api/product-types**', async (route) => {
    const request = route.request();
    if (request.method() === 'POST' && new URL(request.url()).pathname.replace(/\/$/, '') === '/api/product-types') {
      const body = request.postDataJSON() ?? {};
      const code = String(body.code || 'FRESH').toUpperCase();
      const name = String(body.name || 'น้ำยางสด');
      stockRows.unshift({
        productTypeId: 'demo-fresh',
        productType: {
          id: 'demo-fresh',
          code,
          name,
          description: body.description || '',
          isActive: true,
        },
        quantityKg: 0,
        avgCostPerKg: 0,
        avgSellingPricePerKg: null,
        soldKg: 0,
      });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'demo-fresh', code, name, description: body.description || '', isActive: true }),
      });
      return;
    }
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(stockRows.map((row) => row.productType)),
      });
      return;
    }
    await route.abort();
  });

  await context.route('**/api/stock/positions**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(stockRows),
    });
  });

  await context.route('**/api/members**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/\/$/, '');

    if (pathname.endsWith('/next-code')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'M002' }),
      });
      return;
    }

    if (request.method() === 'POST' && pathname.endsWith('/api/members')) {
      const body = request.postDataJSON() ?? {};
      members.unshift(memberRecord({
        id: 'demo-new-member',
        code: body.code || 'M002',
        name: body.name,
        phone: body.phone,
        address: body.address,
      }));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(members[0]),
      });
      return;
    }

    if (request.method() === 'GET' && pathname.endsWith('/api/members')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          members,
          pagination: {
            page: 1,
            limit: 10,
            total: members.length,
            totalPages: 1,
            hasMore: false,
          },
        }),
      });
      return;
    }

    await route.abort();
  });

  await context.route('**/api/destination-companies**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/\/$/, '');

    if (pathname.endsWith('/next-code')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'FAC002' }),
      });
      return;
    }

    if (request.method() === 'POST' && pathname.endsWith('/api/destination-companies')) {
      const body = request.postDataJSON() ?? {};
      companies.unshift({
        id: 'demo-new-factory',
        code: body.code || 'FAC002',
        name: body.name,
        phone: body.phone || '',
        address: body.address || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(companies[0]),
      });
      return;
    }

    if (request.method() === 'GET' && pathname.endsWith('/api/destination-companies')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(companyPage(companies)),
      });
      return;
    }

    await route.abort();
  });

  await context.route('**/api/users**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname.replace(/\/$/, '');

    if (request.method() === 'POST' && pathname.endsWith('/api/users')) {
      const body = request.postDataJSON() ?? {};
      const created = {
        id: 'demo-staff',
        username: body.username,
        role: body.role || 'viewer',
        other: body.other || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.push(created);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, user: created }),
      });
      return;
    }

    if (request.method() === 'GET' && pathname.endsWith('/api/users')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, users }),
      });
      return;
    }

    await route.abort();
  });

  await context.route('**/api/backup**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname.replace(/\/$/, '');
    if (pathname !== '/api/backup') {
      await route.abort();
      return;
    }

    if (request.method() === 'POST') {
      const created = {
        id: 'demo-backup',
        fileName: 'backup-2569-10-27.db',
        filePath: '/demo/backup-2569-10-27.db',
        fileSize: 262144,
        backupType: 'manual',
        createdAt: new Date().toISOString(),
      };
      backups.unshift(created);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, backup: created }),
      });
      return;
    }

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ backups }),
      });
      return;
    }

    await route.abort();
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
const storagePath = path.join(workDir, 'storage-setup.json');
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
await installDemoRoutes(context);
await context.addInitScript((file) => {
  localStorage.setItem('license_file', file);
  localStorage.setItem('license_status', 'valid');
  localStorage.setItem('theme', 'light');
  localStorage.removeItem('slip_companyName');
  localStorage.removeItem('slip_companyAddress');
  localStorage.removeItem('slip_taxId');
  localStorage.removeItem('slip_footerText');
}, licenseFile);

const page = await context.newPage();
const recordingStarted = Date.now();
const marks = {};
try {
  await page.goto(`${baseURL}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const blank = (value) => value.replace(/[\s\u200b\u200c\u200d\ufeff]/g, '') === '';
    const name = document.getElementById('slip-company-name');
    const address = document.getElementById('slip-company-address');
    return name instanceof HTMLInputElement
      && address instanceof HTMLTextAreaElement
      && !name.disabled
      && blank(name.value)
      && blank(address.value);
  }, null, { timeout: 20_000 });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    const bar = document.createElement('div');
    bar.id = 'demo-caption';
    bar.style.cssText = [
      'position:fixed',
      'left:208px',
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

    const style = document.createElement('style');
    style.textContent = '[class*="animal-mask"]{align-items:flex-start !important;padding:72px 16px 120px !important;}';
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
    await page.waitForTimeout(240);
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

  async function fillField(locator, value) {
    await locator.scrollIntoViewIfNeeded();
    await point(locator);
    await ring(locator);
    await locator.click();
    await locator.press('Meta+A');
    await locator.pressSequentially(value, { delay: 38 });
  }

  async function acknowledge() {
    const ok = page.getByRole('button', { name: 'ตกลง' });
    const appeared = await ok.waitFor({ state: 'visible', timeout: 2_500 }).then(() => true).catch(() => false);
    if (!appeared) return;
    await point(ok);
    await page.waitForTimeout(180);
    await ok.click();
    await ok.waitFor({ state: 'hidden', timeout: 5_000 });
  }

  async function showCreated(locator) {
    await acknowledge();
    await locator.waitFor({ timeout: 8_000 });
    await point(locator);
    await ring(locator);
    await page.waitForTimeout(700);
  }

  async function openNav(name, ready) {
    const link = page.getByRole('navigation').getByRole('link', { name });
    await link.scrollIntoViewIfNeeded();
    await point(link);
    await ring(link);
    await page.waitForTimeout(280);
    await link.click();
    await ready();
    await page.waitForTimeout(350);
  }

  await caption('1', 'ตั้งค่าระบบ → ใบรับซื้อ ใส่ชื่อจุดรับซื้อ');
  const shopName = page.locator('#slip-company-name');
  await fillField(shopName, 'จุดรับซื้อตัวอย่าง');
  await page.waitForTimeout(280);

  await caption('1', 'ใส่ที่อยู่');
  await fillField(page.locator('#slip-company-address'), '99 หมู่ 1 ตำบลตัวอย่าง');
  await page.waitForTimeout(240);

  await caption('1', 'ใส่เลขประจำตัวผู้เสียภาษี');
  await fillField(page.locator('#slip-tax-id'), '1234567890123');
  await page.waitForTimeout(240);

  await caption('1', 'ใส่ข้อความท้ายสลิป แล้วกดบันทึก');
  await fillField(page.locator('#slip-footer-text'), 'ขอบคุณที่ใช้บริการ');
  const saveSlip = page.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' });
  await saveSlip.scrollIntoViewIfNeeded();
  await point(saveSlip);
  await ring(saveSlip);
  mark('slip');
  await page.waitForTimeout(500);
  await saveSlip.click();
  await page.getByText('บันทึกการตั้งค่าสลิปเรียบร้อยแล้ว').waitFor({ timeout: 8_000 });
  await acknowledge();
  await page.waitForTimeout(400);

  await caption('2', 'เปิดเมนูสต็อกสินค้า แล้วเพิ่มประเภทที่จะรับซื้อ');
  await openNav('สต็อกสินค้า', async () => {
    await page.getByRole('heading', { name: 'สต็อกคงเหลือ' }).waitFor({ timeout: 20_000 });
    await page.getByRole('row').filter({ hasText: 'ยางแผ่น' }).first().waitFor({ timeout: 20_000 });
  });
  const addProduct = page.getByRole('button', { name: 'เพิ่มประเภทสินค้า' });
  await point(addProduct);
  await ring(addProduct);
  await addProduct.click();
  const productDialog = page.getByRole('dialog').filter({ hasText: 'รหัสประเภท' });
  await productDialog.waitFor({ timeout: 8_000 });
  await caption('2', 'กรอกรหัสประเภทและชื่อ เช่น น้ำยางสด');
  await fillField(productDialog.getByPlaceholder('เช่น FRESH, DRY'), 'FRESH');
  await fillField(productDialog.getByPlaceholder('เช่น น้ำยางสด, ยางแห้ง'), 'น้ำยางสด');
  const saveProduct = productDialog.getByRole('button', { name: 'เพิ่มประเภทสินค้า' });
  await point(saveProduct);
  await ring(saveProduct);
  await page.waitForTimeout(280);
  await saveProduct.click();
  await productDialog.waitFor({ state: 'hidden', timeout: 8_000 });
  await showCreated(page.getByRole('row', { name: /น้ำยางสด/ }));

  await caption('3', 'เปิดเมนูสมาชิก แล้วเพิ่มชาวสวนที่จะมาขาย');
  await openNav('สมาชิก', async () => {
    await page.getByRole('heading', { name: 'จัดการสมาชิก' }).waitFor({ timeout: 20_000 });
    await page.getByRole('row').filter({ hasText: 'สมศักดิ์ ตัวอย่าง' }).first().waitFor({ timeout: 20_000 });
  });
  const addMember = page.getByRole('button', { name: 'เพิ่มสมาชิก' });
  await point(addMember);
  await ring(addMember);
  await addMember.click();
  const memberDialog = page.getByRole('dialog').filter({ hasText: 'เพิ่มสมาชิกใหม่' });
  await memberDialog.getByPlaceholder('กรอกชื่อ-นามสกุล').waitFor({ timeout: 8_000 });
  await caption('3', 'กรอกชื่อ-นามสกุล แล้วกดเพิ่มสมาชิก');
  await fillField(memberDialog.getByPlaceholder('กรอกชื่อ-นามสกุล'), 'สมหญิง ตัวอย่าง');
  const saveMember = memberDialog.locator('button[form="member-form"]');
  await point(saveMember);
  await ring(saveMember);
  await page.waitForTimeout(280);
  await saveMember.click();
  await memberDialog.waitFor({ state: 'hidden', timeout: 8_000 });
  await showCreated(page.getByRole('row').filter({ hasText: 'สมหญิง ตัวอย่าง' }).first());

  await caption('4', 'เปิดเมนูบริษัทปลายทาง แล้วเพิ่มโรงงานที่ขายต่อ');
  await openNav('บริษัทปลายทาง', async () => {
    await page.getByRole('heading', { name: 'บริษัทปลายทาง' }).waitFor({ timeout: 20_000 });
    await page.getByRole('row').filter({ hasText: 'บริษัทตัวอย่าง' }).first().waitFor({ timeout: 20_000 });
  });
  const addCompany = page.getByRole('button', { name: 'เพิ่มบริษัท' });
  await point(addCompany);
  await ring(addCompany);
  await addCompany.click();
  const companyDialog = page.getByRole('dialog').filter({ hasText: 'เพิ่มบริษัทปลายทาง' });
  await companyDialog.getByPlaceholder('เช่น บริษัท ยางไทย จำกัด').waitFor({ timeout: 8_000 });
  await caption('4', 'กรอกชื่อโรงงาน แล้วกดเพิ่มบริษัท');
  await fillField(companyDialog.getByPlaceholder('เช่น บริษัท ยางไทย จำกัด'), 'โรงงานตัวอย่าง');
  const saveCompany = companyDialog.locator('button[form="destination-company-form"]');
  await point(saveCompany);
  await ring(saveCompany);
  await page.waitForTimeout(280);
  await saveCompany.click();
  await companyDialog.waitFor({ state: 'hidden', timeout: 8_000 });
  await showCreated(page.getByRole('row').filter({ hasText: 'โรงงานตัวอย่าง' }).first());

  await caption('5', 'กลับไปตั้งค่าระบบ แล้วเปิดแท็บผู้ใช้งาน');
  const settingsLink = page.getByRole('link', { name: 'ไปที่หน้าตั้งค่าระบบ' });
  await point(settingsLink);
  await ring(settingsLink);
  await page.waitForTimeout(280);
  await settingsLink.click();
  await page.getByRole('heading', { name: 'ตั้งค่าระบบ' }).waitFor({ timeout: 20_000 });
  const usersTab = page.getByRole('tab', { name: 'ผู้ใช้งาน' });
  await point(usersTab);
  await ring(usersTab);
  await usersTab.click();
  await page.getByRole('heading', { name: 'ผู้ใช้และสิทธิ์' }).waitFor({ timeout: 20_000 });
  await page.getByRole('row').filter({ hasText: 'admin' }).first().waitFor({ timeout: 20_000 });
  await caption('5', 'สร้างบัญชีให้พนักงาน อย่าใช้บัญชีเจ้าของร่วมกัน');
  const addUser = page.getByRole('button', { name: 'เพิ่มผู้ใช้งาน' });
  await point(addUser);
  await ring(addUser);
  await addUser.click();
  const userDialog = page.getByRole('dialog').filter({ hasText: 'สร้างผู้ใช้งานใหม่' });
  await userDialog.getByPlaceholder('กรอกชื่อผู้ใช้').waitFor({ timeout: 8_000 });
  await fillField(userDialog.getByPlaceholder('กรอกชื่อผู้ใช้'), 'staff01');
  await fillField(userDialog.getByPlaceholder('กรอกรหัสผ่าน'), 'staff1234');
  const roleSelect = userDialog.locator('select');
  await point(roleSelect);
  await ring(roleSelect);
  await roleSelect.selectOption('viewer');
  await page.waitForTimeout(400);
  const saveUser = userDialog.getByRole('button', { name: 'สร้างผู้ใช้งาน' });
  await point(saveUser);
  await ring(saveUser);
  await page.waitForTimeout(280);
  await saveUser.click();
  await userDialog.waitFor({ state: 'hidden', timeout: 8_000 });
  await showCreated(page.getByRole('row').filter({ hasText: 'staff01' }).first());

  await caption('6', 'เปิดแท็บสำรองข้อมูล แล้วกดสำรองข้อมูลตอนนี้');
  const backupTab = page.getByRole('tab', { name: 'สำรองข้อมูล' });
  await point(backupTab);
  await ring(backupTab);
  await backupTab.click();
  await page.getByText('ยังไม่มีไฟล์สำรองข้อมูล').waitFor({ timeout: 20_000 });
  const backupButton = page.getByRole('button', { name: 'สำรองข้อมูลตอนนี้' });
  await point(backupButton);
  await ring(backupButton);
  await page.waitForTimeout(400);
  await backupButton.click();
  const backupFile = page.getByText('backup-2569-10-27.db');
  await backupFile.waitFor({ timeout: 8_000 });
  await acknowledge();
  await point(backupFile);
  await ring(backupFile);
  await caption('6', 'นำไฟล์ไปเก็บไว้นอกเครื่อง กันบิลหายถ้าเครื่องมีปัญหา');
  await page.waitForTimeout(1400);
  mark('ready');

  const video = page.video();
  await context.close();
  const webmPath = await video.path();
  const mp4Path = path.join(outDir, 'setup-entry.mp4');
  const posterPath = path.join(outDir, 'setup-entry.jpg');
  const ffmpegBin = process.env.FFMPEG ?? 'ffmpeg';
  const encode = spawnSync(ffmpegBin, [
    '-y',
    '-ss', leadIn.toFixed(2),
    '-i', webmPath,
    '-an',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '24',
    '-movflags', '+faststart',
    mp4Path,
  ], { stdio: 'inherit' });
  if (encode.status !== 0) throw new Error('ffmpeg failed to encode the setup clip');

  const posterAt = (marks.slip ?? 4).toFixed(2);
  const poster = spawnSync(ffmpegBin, [
    '-y',
    '-ss', posterAt,
    '-i', mp4Path,
    '-frames:v', '1',
    '-update', '1',
    '-q:v', '3',
    posterPath,
  ], { stdio: 'inherit' });
  if (poster.status !== 0) throw new Error('ffmpeg failed to write the setup poster');

  await rename(webmPath, path.join(workDir, 'setup-entry.webm'));
  console.log('saved', mp4Path);
  console.log('marks', marks, 'poster', posterAt, 'leadIn', leadIn.toFixed(2));
} catch (error) {
  await page.screenshot({ path: path.join(workDir, 'setup-failure.png'), fullPage: true }).catch(() => {});
  await context.close().catch(() => {});
  throw error;
} finally {
  await browser.close();
}
