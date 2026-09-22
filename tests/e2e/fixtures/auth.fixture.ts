import { test as base, expect, type Page } from '@playwright/test'

export type AuthFixtures = {
  authedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await use(page)
  },
})

export { expect }

export async function submitLogin(
  page: Page,
  username: string,
  password: string,
  slug = 'demo',
) {
  const slugInput = page.getByPlaceholder('เช่น my-shop')
  const usernameInput = page.getByPlaceholder('กรอกชื่อผู้ใช้')
  const passwordInput = page.getByPlaceholder('กรอกรหัสผ่าน')

  await slugInput.waitFor({ state: 'visible' })
  await slugInput.fill(slug)
  await usernameInput.fill(username)
  await passwordInput.fill(password)

  const loginReq = page.waitForResponse(
    (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST'
  )
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
  return loginReq
}

export async function loginAs(
  page: Page,
  username: string,
  password: string,
  slug = 'demo',
): Promise<void> {
  await page.goto('/login')
  const loginRes = await submitLogin(page, username, password, slug)
  expect(loginRes.ok()).toBeTruthy()
  await page.waitForURL('/dashboard')
}
