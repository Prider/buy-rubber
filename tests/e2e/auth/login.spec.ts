import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth.fixture'

// This spec intentionally does NOT use storageState — it tests the login UI itself.

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('shows the login form', async ({ page }) => {
    await expect(page.getByPlaceholder('กรอกชื่อผู้ใช้')).toBeVisible()
    await expect(page.getByPlaceholder('กรอกรหัสผ่าน')).toBeVisible()
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeVisible()
  })

  test('shows demo credentials banner', async ({ page }) => {
    await expect(page.getByText('demo', { exact: true })).toBeVisible()
    await expect(page.getByText('demo@123')).toBeVisible()
  })

  test('pre-fills demo credentials on web', async ({ page }) => {
    const usernameInput = page.getByPlaceholder('กรอกชื่อผู้ใช้')
    await expect(usernameInput).toHaveValue('demo')
  })

  test('successful login as admin redirects to dashboard', async ({ page }) => {
    await loginAs(page, 'admin', 'admin123')
    await expect(page).toHaveURL('/dashboard')
  })

  test('successful login as viewer redirects to dashboard', async ({ page }) => {
    await loginAs(page, 'demo', 'demo@123')
    await expect(page).toHaveURL('/dashboard')
  })

  test('wrong password shows error message', async ({ page }) => {
    await loginAs(page, 'admin', 'wrongpassword')
    await expect(page.getByText('Invalid username or password')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('empty username shows validation', async ({ page }) => {
    await page.getByPlaceholder('กรอกชื่อผู้ใช้').fill('')
    await page.getByPlaceholder('กรอกรหัสผ่าน').fill('admin123')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    // HTML5 required validation keeps user on login page
    await expect(page).toHaveURL('/login')
  })

  test('toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('กรอกรหัสผ่าน')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'แสดงรหัสผ่าน' }).click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    await page.getByRole('button', { name: 'ซ่อนรหัสผ่าน' }).click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

test.describe('Authenticated session', () => {
  test('unauthenticated user visiting /dashboard is redirected to /login', async ({ page }) => {
    // No storageState — fresh browser context
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('logout clears session and redirects to /login', async ({ page }) => {
    // Log in first
    await loginAs(page, 'admin', 'admin123')
    await page.waitForURL('/dashboard')

    // Find and click logout button
    const logoutBtn = page.getByRole('button', { name: /ออกจากระบบ|logout/i })
    await logoutBtn.click()

    await expect(page).toHaveURL('/login')

    // Confirm localStorage is cleared
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBeNull()
  })
})
