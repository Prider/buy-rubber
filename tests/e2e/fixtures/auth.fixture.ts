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
async function waitForLoginPrefill(page: Page) {
  const usernameInput = page.getByPlaceholder('กรอกชื่อผู้ใช้')
  await usernameInput.waitFor({ state: 'visible' })
  // Web login pre-fills demo credentials in useEffect; wait so fill() does not race it.
  await page.waitForFunction(
    () => {
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder="กรอกชื่อผู้ใช้"]'
      )
      if (!input) return false
      const isElectron =
        typeof window !== 'undefined' &&
        (window as Window & { electron?: { isElectron?: boolean } }).electron?.isElectron ===
          true
      return isElectron || input.value.length > 0
    },
    { timeout: 5000 }
  )
}

export async function submitLogin(
  page: Page,
  username: string,
  password: string
) {
  await waitForLoginPrefill(page)

  const usernameInput = page.getByPlaceholder('กรอกชื่อผู้ใช้')
  const passwordInput = page.getByPlaceholder('กรอกรหัสผ่าน')

  if ((await usernameInput.inputValue()) !== username) {
    await usernameInput.fill(username)
  }
  if ((await passwordInput.inputValue()) !== password) {
    await passwordInput.fill(password)
  }

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
