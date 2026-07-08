import { test, expect, type Page } from '@playwright/test'
import { loginAs } from '../fixtures/auth.fixture'
import { getAdminToken, deleteUser, uniqueSuffix, ensureViewerUser } from '../fixtures/data.fixture'

async function openUsersTab(page: Page) {
  await page.goto('/admin')
  await page.getByRole('tab', { name: 'ผู้ใช้งาน' }).click()
  await expect(page.getByRole('heading', { name: 'จัดการผู้ใช้งาน' })).toBeVisible()
}

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
    await expect(page.getByRole('tab', { name: 'ผู้ใช้งาน' })).toBeVisible()
  })

  test('admin can switch to user management tab', async ({ page }) => {
    await openUsersTab(page)
    await expect(page.getByRole('button', { name: 'เพิ่มผู้ใช้งาน' })).toBeVisible()
  })

  test('admin can create a new user', async ({ page }) => {
    const suffix = uniqueSuffix()
    const newUsername = `testuser${suffix}`

    await openUsersTab(page)
    await page.getByRole('button', { name: 'เพิ่มผู้ใช้งาน' }).click()

    await expect(page.getByRole('heading', { name: 'สร้างผู้ใช้งานใหม่' })).toBeVisible()

    const modal = page.locator('div.fixed.inset-0').filter({ hasText: 'สร้างผู้ใช้งานใหม่' })
    await modal.locator('input[type="text"]').fill(newUsername)
    await modal.locator('input[type="password"]').fill('Test@12345')

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/users') && r.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'สร้างผู้ใช้งาน' }).click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(201)

    const body = await saveRes.json()
    createdUserId = body.id ?? body.user?.id ?? null

    await expect(page.getByText(newUsername)).toBeVisible()
  })

  test('admin can delete a user', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const username = `deluser${suffix}`

    const createRes = await request.post('/api/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { username, password: 'Delete@123', role: 'viewer' },
    })
    const created = await createRes.json()
    createdUserId = created.id ?? created.user?.id

    await openUsersTab(page)
    await expect(page.getByText(username)).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: username })
    await row.getByRole('button', { name: 'ลบ' }).click()

    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    await expect(page.getByText(username)).not.toBeVisible()
    createdUserId = null
  })
})

test.describe('Role-based access control', () => {
  test.beforeAll(async ({ request }) => {
    await ensureViewerUser(request)
  })

  test('viewer role cannot access admin page', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await loginAs(page, 'demo', 'demo@123')

    await page.goto('/admin')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('tab', { name: 'ผู้ใช้งาน' })).not.toBeVisible()

    await context.close()
  })

  test('viewer can view dashboard', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await loginAs(page, 'demo', 'demo@123')

    await expect(page).toHaveURL('/dashboard')

    await context.close()
  })
})
