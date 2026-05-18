import { test, expect } from '@playwright/test'
import { getAdminToken, deleteUser, uniqueSuffix } from '../fixtures/data.fixture'

test.describe('Admin — user management', () => {
  let createdUserId: string | null = null
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)
  })

  test.afterEach(async ({ request }) => {
    if (createdUserId) {
      await deleteUser(request, createdUserId, adminToken)
      createdUserId = null
    }
  })

  test('admin can navigate to admin page', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin')
  })

  test('admin page shows user management tab', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('button', { name: 'จัดการผู้ใช้งาน' })).toBeVisible()
  })

  test('admin can switch to user management tab', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('button', { name: 'จัดการผู้ใช้งาน' }).click()
    await expect(page.getByRole('button', { name: 'เพิ่มผู้ใช้งาน' })).toBeVisible()
  })

  test('admin can create a new user', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const newUsername = `testuser${suffix}`

    await page.goto('/admin')
    await page.getByRole('button', { name: 'จัดการผู้ใช้งาน' }).click()
    await page.getByRole('button', { name: 'เพิ่มผู้ใช้งาน' }).click()

    // Create user modal opens
    await expect(page.getByText('สร้างผู้ใช้งานใหม่')).toBeVisible()

    // Fill form
    await page.getByLabel('ชื่อผู้ใช้').fill(newUsername)
    await page.getByLabel('รหัสผ่าน').fill('Test@12345')

    // Role defaults to user — leave it

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/users') && r.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'สร้างผู้ใช้งาน' }).click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(200)

    const body = await saveRes.json()
    createdUserId = body.id ?? body.user?.id ?? null

    // New user appears in the list
    await expect(page.getByText(newUsername)).toBeVisible()
  })

  test('admin can delete a user', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const username = `deluser${suffix}`

    // Create user via API
    const createRes = await request.post('http://localhost:3000/api/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { username, password: 'Delete@123', role: 'viewer' },
    })
    const created = await createRes.json()
    createdUserId = created.id ?? created.user?.id

    await page.goto('/admin')
    await page.getByRole('button', { name: 'จัดการผู้ใช้งาน' }).click()

    await expect(page.getByText(username)).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: username })
    await row.getByRole('button', { name: /ลบ/i }).click()

    // Confirm
    await page.getByRole('button', { name: 'ยืนยัน' }).click()

    await expect(page.getByText(username)).not.toBeVisible()
    createdUserId = null
  })
})

test.describe('Role-based access control', () => {
  test('viewer role cannot access admin page', async ({ browser }) => {
    // Create a new context — log in as viewer (demo/demo@123)
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/login')
    await page.getByPlaceholder('กรอกชื่อผู้ใช้').fill('demo')
    await page.getByPlaceholder('กรอกรหัสผ่าน').fill('demo@123')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await page.waitForURL('/dashboard')

    // Attempt to visit /admin
    await page.goto('/admin')

    // Should be redirected away or shown an access denied message
    const url = page.url()
    const isDenied =
      !url.includes('/admin') ||
      (await page.getByText(/ไม่มีสิทธิ์|Access Denied|Unauthorized/i).count()) > 0

    expect(isDenied).toBe(true)

    await context.close()
  })

  test('viewer can view dashboard', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/login')
    await page.getByPlaceholder('กรอกชื่อผู้ใช้').fill('demo')
    await page.getByPlaceholder('กรอกรหัสผ่าน').fill('demo@123')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await page.waitForURL('/dashboard')

    await expect(page).toHaveURL('/dashboard')

    await context.close()
  })
})
