/**
 * Capture the screens shown in /guide.
 * Run while `yarn dev` is already serving the app.
 *
 *   GUIDE_BASE_URL=http://localhost:3000 node scripts/capture-guide-screenshots.mjs
 *   GUIDE_THEME=dark node scripts/capture-guide-screenshots.mjs
 *
 * The license check is stubbed with a placeholder key so an expired local
 * license cannot block the shots. License keys, API key hints, and long
 * numbers are masked before each image is written.
 *
 * Pass extra localStorage entries when a shot needs them:
 *   GUIDE_STORAGE_FILE=/tmp/guide-storage.json node scripts/capture-guide-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.GUIDE_BASE_URL ?? 'http://localhost:3000';
const theme = process.env.GUIDE_THEME === 'dark' ? 'dark' : 'light';
const outDir = path.join(process.cwd(), theme === 'dark' ? 'public/guide/dark' : 'public/guide');
const PLACEHOLDER_KEY = 'GUIDE-SHOT-0000-0000';

const pages = [
  { file: 'dashboard.jpg', path: '/dashboard' },
  { file: 'stock.jpg', path: '/stock' },
  { file: 'members.jpg', path: '/members' },
  { file: 'purchases.jpg', path: '/purchases' },
  { file: 'history.jpg', path: '/purchases-list' },
  { file: 'sales.jpg', path: '/sales' },
  { file: 'companies.jpg', path: '/destination-companies' },
  { file: 'expenses.jpg', path: '/expenses' },
  { file: 'reports.jpg', path: '/reports' },
  { file: 'settings-slip.jpg', path: '/admin?tab=slip' },
  { file: 'settings-display.jpg', path: '/admin?tab=display' },
  { file: 'settings-users.jpg', path: '/admin?tab=users' },
  { file: 'settings-connection.jpg', path: '/admin?tab=connection' },
  { file: 'settings-backup.jpg', path: '/admin?tab=backup' },
  { file: 'settings-license.jpg', path: '/admin?tab=license' },
  { file: 'settings-assistant.jpg', path: '/admin?tab=assistant' },
];

async function maskSecrets(page) {
  await page.evaluate(() => {
    const rewrite = (input, next) => {
      const proto = input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      setter?.call(input, next);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const license = document.getElementById('admin-tabpanel-license');
    license?.querySelectorAll('.font-mono').forEach((el) => {
      if (el instanceof HTMLInputElement) {
        rewrite(el, '');
        el.placeholder = 'XXXX-XXXX-XXXX-XXXX';
      } else if ((el.textContent || '').trim().length > 4) {
        el.textContent = 'XXXX-XXXX-XXXX-XXXX';
      }
    });

    const assistant = document.getElementById('admin-tabpanel-assistant');
    assistant?.querySelectorAll('.font-mono').forEach((el) => {
      if (el instanceof HTMLInputElement) return;
      const text = el.textContent || '';
      if (/[•*]|\.{2,}|sk-|key/i.test(text)) el.textContent = '••••••••';
    });

    document.querySelectorAll('label').forEach((label) => {
      const name = label.textContent || '';
      if (!/ภาษี|บัตรประชาชน|เลขบัญชี|เบอร์โทร/.test(name)) return;
      const id = label.getAttribute('for');
      const field = id ? document.getElementById(id) : null;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
      if (!field.value.trim()) return;
      rewrite(field, field.value.replace(/\d/g, '0'));
    });

    if (location.pathname === '/members') {
      document.querySelectorAll('[role="cell"]').forEach((cell) => {
        const text = cell.innerText || '';
        if (text.replace(/\D/g, '').length < 8) return;
        cell.innerText = text.replace(/\d/g, '0');
      });
    }
  });
}

async function shoot(page, file) {
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' }).catch(() => {});
  await maskSecrets(page);
  await page.screenshot({
    path: path.join(outDir, file),
    type: 'jpeg',
    quality: 72,
    animations: 'disabled',
  });
  console.log('saved', path.join(theme === 'dark' ? 'dark' : '', file));
}

async function settle(page) {
  await page.locator('main').waitFor({ timeout: 20_000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.waitForFunction(() => {
    const text = document.body?.innerText || '';
    return !text.includes('กำลังโหลด') && !text.includes('กำลังตรวจสอบใบอนุญาต') && !text.includes('กำลังค้นหา');
  }, { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function allowLicense(context) {
  await context.route('**/api/license/validate', async (route) => {
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
    } catch {
      body = {};
    }
    if (body.licenseKey === '__skip_license_check__' && !body.licenseFile) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: true,
        expired: false,
        renewalRequired: false,
        message: 'ใบอนุญาตถูกต้อง',
        expiresAt: '2027-11-12T00:00:00.000Z',
        renewalDate: '2027-05-12T00:00:00.000Z',
        licenseFile: null,
      }),
    });
  });
}

await mkdir(outDir, { recursive: true });

const storageFile = process.env.GUIDE_STORAGE_FILE;
const stored = storageFile
  ? JSON.parse(await readFile(storageFile, 'utf8'))
  : {};

const licenseEntries = {
  license_key: PLACEHOLDER_KEY,
  license_status: 'valid',
  license_expires_at: '2027-11-12T00:00:00.000Z',
  license_renewal_date: '2027-05-12T00:00:00.000Z',
  license_message: 'ใบอนุญาตถูกต้อง',
  ...stored,
  theme,
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  locale: 'th-TH',
  colorScheme: theme,
});
await allowLicense(context);
await context.addInitScript((entries) => {
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value === 'string') localStorage.setItem(key, value);
  }
}, licenseEntries);

const page = await context.newPage();
await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
await page.getByPlaceholder('กรอกชื่อผู้ใช้').waitFor({ timeout: 20_000 });
await page.getByPlaceholder('กรอกชื่อผู้ใช้').fill('owner');
await page.getByPlaceholder('กรอกรหัสผ่าน').fill('owner888');
await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
await page.waitForURL('**/dashboard', { timeout: 30_000 });
await page.getByRole('link', { name: 'แดชบอร์ด' }).first().waitFor();

for (const shot of pages) {
  await page.goto(`${baseURL}${shot.path}`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  if (shot.path === '/dashboard') {
    const month = page.getByRole('button', { name: 'เดือนนี้' });
    if (await month.isVisible().catch(() => false)) {
      await month.click();
      await settle(page);
    }
  }
  if (shot.path === '/reports') {
    const generate = page.getByRole('button', { name: 'สร้างรายงาน' });
    if (await generate.isVisible().catch(() => false)) {
      await generate.click();
      await page.getByText('กำลังสร้าง').waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
      await settle(page);
    }
  }
  await shoot(page, shot.file);
}

await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
await settle(page);
const month = page.getByRole('button', { name: 'เดือนนี้' });
if (await month.isVisible().catch(() => false)) {
  await month.click();
  await settle(page);
}
await page.getByRole('button', { name: 'ผู้ช่วยอัจฉริยะ' }).click();
await page.getByRole('heading', { name: 'ถามข้อมูลร้าน' }).waitFor({ timeout: 15_000 });
await page.waitForTimeout(400);
await shoot(page, 'assistant.jpg');

await context.close();

if (theme === 'light') {
  const loginContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'th-TH',
    colorScheme: 'light',
  });
  await allowLicense(loginContext);
  await loginContext.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      if (typeof value === 'string') localStorage.setItem(key, value);
    }
  }, licenseEntries);
  const loginPage = await loginContext.newPage();
  await loginPage.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
  await loginPage.getByRole('button', { name: 'เข้าสู่ระบบ' }).waitFor();
  await loginPage.getByPlaceholder('กรอกชื่อผู้ใช้').fill('');
  await loginPage.getByPlaceholder('กรอกรหัสผ่าน').fill('');
  await loginPage.waitForTimeout(300);
  await shoot(loginPage, 'login.jpg');
  await loginContext.close();

  const activateContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'th-TH',
    colorScheme: 'light',
  });
  await activateContext.addInitScript(() => {
    localStorage.setItem('theme', 'light');
  });
  const activatePage = await activateContext.newPage();
  await activatePage.goto(`${baseURL}/activate`, { waitUntil: 'domcontentloaded' });
  await activatePage.getByRole('button', { name: 'เปิดใช้งาน', exact: true }).waitFor({ timeout: 20_000 });
  await activatePage.waitForTimeout(400);
  await shoot(activatePage, 'activate.jpg');
  await activateContext.close();
}

await browser.close();
console.log('done', outDir);
