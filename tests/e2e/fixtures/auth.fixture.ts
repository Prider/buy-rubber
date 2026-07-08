import { test as base, expect, type Page } from '@playwright/test'

export type AuthFixtures = {
  authedPage: Page
}

/**
 * Extends Playwright's base test with an `authedPage` fixture that navigates
 * to /dashboard and verifies the session is alive before each test.
 *
 * storageState (set in playwright.config.ts) restores the localStorage token
 * saved by auth.setup.ts, so no actual login request is made here.
 */
export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await use(page)
  },
})

export { expect }

/**
 * Logs in directly via the UI. Used only in specs that explicitly test
 * the authentication flow (auth/login.spec.ts).
 */
export async function submitLogin(
  page: Page,
  username: string,
  password: string
) {
  await page.getByPlaceholder('กรอกชื่อผู้ใช้').fill(username)
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill(password)

  const loginReq = page.waitForResponse(
    (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST'
  )
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
  return loginReq
}

export async function loginAs(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto('/login')
  const loginRes = await submitLogin(page, username, password)
  expect(loginRes.ok()).toBeTruthy()
  await page.waitForURL('/dashboard')
}
