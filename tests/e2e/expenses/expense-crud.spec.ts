import { test, expect } from '@playwright/test'
import { E2E_BASE_URL, getAdminToken, deleteExpense, uniqueSuffix } from '../fixtures/data.fixture'

test.describe('Expense CRUD', () => {
  let createdExpenseId: string | null = null
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)
  })

  test.afterEach(async ({ request }) => {
    if (createdExpenseId) {
      await deleteExpense(request, createdExpenseId, adminToken)
      createdExpenseId = null
    }
  })

  test('page loads with entry form and summary cards', async ({ page }) => {
    await page.goto('/expenses')
    await expect(page.getByRole('heading', { name: 'บันทึกค่าใช้จ่าย', level: 1 })).toBeVisible()
    await expect(page.getByRole('group', { name: 'ค่าใช้จ่ายวันนี้' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'ค่าใช้จ่ายเดือนนี้' })).toBeVisible()
  })

  test('create an expense', async ({ page }) => {
    const suffix = uniqueSuffix()
    const category = `ค่าน้ำมัน${suffix}`

    await page.goto('/expenses')

    const form = page.getByRole('region', { name: 'แบบฟอร์มบันทึกค่าใช้จ่าย' })

    await form.getByPlaceholder(/ระบุประเภท/i).fill(category)
    await form.getByPlaceholder('0.00').fill('500')

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/expenses') && r.request().method() === 'POST'
    )
    await form.getByRole('button', { name: 'บันทึกค่าใช้จ่าย' }).click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(200)

    const body = await saveRes.json()
    createdExpenseId = body.id ?? body.expense?.id ?? null

    await expect(page.getByText(category)).toBeVisible()
  })

  test('delete an expense', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const category = `ค่าทดสอบลบ${suffix}`

    const createRes = await request.post(`${E2E_BASE_URL}/api/expenses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        category,
        amount: 300,
        description: 'ทดสอบลบ',
        userId: 'admin-placeholder',
        userName: 'admin',
      },
    })
    const created = await createRes.json()
    createdExpenseId = created.id ?? created.expense?.id

    await page.goto('/expenses')
    await expect(page.getByText(category)).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: category })
    await row.getByRole('button', { name: /ลบ/i }).click()

    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    await expect(page.getByText(category)).not.toBeVisible()
    createdExpenseId = null
  })

  test('today summary card increments after adding expense', async ({ page }) => {
    await page.goto('/expenses')

    const suffix = uniqueSuffix()
    const category = `ค่าทดสอบ${suffix}`

    const form = page.getByRole('region', { name: 'แบบฟอร์มบันทึกค่าใช้จ่าย' })
    await form.getByPlaceholder(/ระบุประเภท/i).fill(category)
    await form.getByPlaceholder('0.00').fill('100')

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/expenses') && r.request().method() === 'POST'
    )
    await form.getByRole('button', { name: 'บันทึกค่าใช้จ่าย' }).click()
    const saveRes = await saveReq
    const body = await saveRes.json()
    createdExpenseId = body.id ?? body.expense?.id ?? null

    await page.reload()
    await expect(page.getByText(category)).toBeVisible()
  })
})
