/**
 * Capture the screens shown in /guide.
 * Run while `yarn dev` is already serving http://localhost:3000.
 *
 * Pass a JSON file of localStorage entries (license_key, license_file, …)
 * so the capture can open the app. The script masks license keys, API key
 * hints, and long numbers before it writes the images.
 *
 *   GUIDE_STORAGE_FILE=/tmp/guide-storage.json node scripts/capture-guide-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.GUIDE_BASE_URL ?? 'http://localhost:3000';
const outDir = path.join(process.cwd(), 'public/guide');

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
  });
}

async function shoot(page, file) {
  await maskSecrets(page);
  await page.screenshot({
    path: path.join(outDir, file),
    type: 'jpeg',
    quality: 72,
    animations: 'disabled',
  });
  console.log('saved', file);
}

await mkdir(outDir, { recursive: true });

const storageFile = process.env.GUIDE_STORAGE_FILE;
const stored = storageFile
  ? JSON.parse(await readFile(storageFile, 'utf8'))
  : {};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  locale: 'th-TH',
  colorScheme: 'light',
});
await context.addInitScript((entries) => {
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value === 'string') localStorage.setItem(key, value);
  }
  localStorage.setItem('theme', 'light');
}, stored);

const page = await context.newPage();
await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
await page.getByPlaceholder('กรอกชื่อผู้ใช้').waitFor({ timeout: 20_000 });
await page.getByPlaceholder('กรอกชื่อผู้ใช้').fill('admin');
await page.getByPlaceholder('กรอกรหัสผ่าน').fill('admin123');
await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
await page.waitForURL('**/dashboard', { timeout: 20_000 });
await page.getByRole('link', { name: 'แดชบอร์ด' }).first().waitFor();

for (const shot of pages) {
  await page.goto(`${baseURL}${shot.path}`, { waitUntil: 'domcontentloaded' });
  await page.locator('main').waitFor();
  await page.waitForTimeout(900);
  await shoot(page, shot.file);
}

await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'ผู้ช่วยอัจฉริยะ' }).click();
await page.getByRole('heading', { name: 'ถามข้อมูลร้าน' }).waitFor();
await page.waitForTimeout(400);
await shoot(page, 'assistant.jpg');

const licensedOnly = Object.fromEntries(
  Object.entries(stored).filter(([key]) => key.startsWith('license_')),
);

await context.close();

const publicContext = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  locale: 'th-TH',
  colorScheme: 'light',
});
await publicContext.addInitScript((entries) => {
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value === 'string') localStorage.setItem(key, value);
  }
  localStorage.setItem('theme', 'light');
}, licensedOnly);
const loginPage = await publicContext.newPage();
await loginPage.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
await loginPage.getByRole('button', { name: 'เข้าสู่ระบบ' }).waitFor();
await loginPage.getByPlaceholder('กรอกชื่อผู้ใช้').fill('');
await loginPage.getByPlaceholder('กรอกรหัสผ่าน').fill('');
await loginPage.waitForTimeout(300);
await shoot(loginPage, 'login.jpg');

await browser.close();
console.log('done', outDir);
