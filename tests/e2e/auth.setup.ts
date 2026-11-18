import { test as setup, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH_FILE = path.join(__dirname, '../../playwright/.auth/admin.json')

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login')

  // The web version pre-fills demo credentials — overwrite with owner
  await page.getByPlaceholder('กรอกชื่อผู้ใช้').fill('owner')
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill('owner888')
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()

  await page.waitForURL('/dashboard')
  await expect(page).toHaveURL('/dashboard')

  // Persist auth_token and auth_user from localStorage into storageState
  await page.context().storageState({ path: ADMIN_AUTH_FILE })
})
