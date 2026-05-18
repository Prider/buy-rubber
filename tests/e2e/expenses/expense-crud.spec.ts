import { test, expect } from '@playwright/test'
import { getAdminToken, deleteExpense, uniqueSuffix } from '../fixtures/data.fixture'

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
    await expect(page.getByRole('heading', { name: 'บันทึกค่าใช้จ่าย' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'ค่าใช้จ่ายวันนี้' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'ค่าใช้จ่ายเดือนนี้' })).toBeVisible()
  })

  test('create an expense', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const category = `ค่าน้ำมัน${suffix}`

    await page.goto('/expenses')

    const form = page.getByRole('form', { name: 'แบบฟอร์มบันทึกค่าใช้จ่าย' })

    // Fill category
    await form.getByPlaceholder(/ระบุประเภท/i).fill(category)

    // Fill amount
    await form.getByPlaceholder('0.00').fill('500')

    // Submit and wait for API response
    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/expenses') && r.request().method() === 'POST'
    )
    await form.getByRole('button', { name: 'บันทึกค่าใช้จ่าย' }).click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(200)

    const body = await saveRes.json()
    createdExpenseId = body.id ?? body.expense?.id ?? null

    // Entry appears in the expense list
    await expect(page.getByText(category)).toBeVisible()
  })

  test('delete an expense', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const category = `ค่าทดสอบลบ${suffix}`

    // Create via API
    const createRes = await request.post('http://localhost:3000/api/expenses', {
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

    // Confirm dialog
    await page.getByRole('button', { name: 'ลบ' }).last().click()

    await expect(page.getByText(category)).not.toBeVisible()
    createdExpenseId = null
  })

  test('today summary card increments after adding expense', async ({ page }) => {
    await page.goto('/expenses')

    const todayCard = page.getByRole('group', { name: 'ค่าใช้จ่ายวันนี้' })
    const countBefore = await todayCard.getByText(/รายการ/).textContent()

    const form = page.getByRole('form', { name: 'แบบฟอร์มบันทึกค่าใช้จ่าย' })
    const suffix = uniqueSuffix()
    await form.getByPlaceholder(/ระบุประเภท/i).fill(`ค่าทดสอบ${suffix}`)
    await form.getByPlaceholder('0.00').fill('100')

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/expenses') && r.request().method() === 'POST'
    )
    await form.getByRole('button', { name: 'บันทึกค่าใช้จ่าย' }).click()
    const saveRes = await saveReq
    const body = await saveRes.json()
    createdExpenseId = body.id ?? body.expense?.id ?? null

    // Reload to get fresh summary
    await page.reload()
    const countAfter = await todayCard.getByText(/รายการ/).textContent()

    expect(countAfter).not.toBe(countBefore)
  })
})
