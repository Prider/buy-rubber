import { test, expect, type Page } from '@playwright/test'
import {
  apiHeaders,
  deleteExpense,
  E2E_BASE_URL,
  getAdminToken,
  uniqueSuffix,
} from '../fixtures/data.fixture'

const DEFAULT_CATEGORIES = ['ค่าน้ำมัน', 'ค่าซ่อมรถ', 'ค่าคนงาน', 'อื่นๆ'] as const

function parseLocaleNumber(text: string): number {
  return Number(text.replace(/[^\d.-]/g, '')) || 0
}

async function gotoExpensesPage(page: Page) {
  const expensesReq = page.waitForResponse((r) => r.url().includes('/api/expenses') && r.ok())
  await page.goto('/expenses')
  await expect(page.getByRole('heading', { name: 'บันทึกค่าใช้จ่าย', level: 1 })).toBeVisible()
  await expect(expenseForm(page)).toBeVisible()
  await expect(page.getByRole('group', { name: 'ค่าใช้จ่ายวันนี้' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'ค่าใช้จ่ายเดือนนี้' })).toBeVisible()
  await expensesReq
}

function expenseForm(page: Page) {
  return page.getByRole('region', { name: 'แบบฟอร์มบันทึกค่าใช้จ่าย' })
}

async function getTodaySummary(page: Page): Promise<{ total: number; count: number }> {
  const card = page.getByRole('group', { name: 'ค่าใช้จ่ายวันนี้' })
  const totalText = (await card.getByText(/\d[\d,.]*\s*บาท/).textContent()) ?? '0'
  const countText = (await card.getByText(/\d+\s*รายการ/).textContent()) ?? '0'
  return {
    total: parseLocaleNumber(totalText),
    count: parseLocaleNumber(countText),
  }
}

async function submitExpense(
  page: Page,
  data: { category: string; amount: string; description?: string }
): Promise<string | null> {
  const form = expenseForm(page)
  await form.getByPlaceholder(/ระบุประเภท/i).fill(data.category)
  await form.getByPlaceholder('0.00').fill(data.amount)
  if (data.description) {
    await form.locator('textarea[data-expense-description]').fill(data.description)
  }

  const saveReq = page.waitForResponse(
    (r) => r.url().includes('/api/expenses') && r.request().method() === 'POST'
  )
  const reloadReq = page.waitForResponse(
    (r) => r.url().includes('/api/expenses') && r.request().method() === 'GET'
  )
  await form.getByRole('button', { name: 'บันทึกค่าใช้จ่าย' }).click()
  const saveRes = await saveReq
  expect(saveRes.status()).toBe(200)
  await reloadReq

  const body = await saveRes.json()
  return body.id ?? body.expense?.id ?? null
}

test.describe('Expense flow', () => {
  let adminToken: string
  const createdExpenseIds: string[] = []

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)
  })

  test.afterEach(async ({ request }) => {
    while (createdExpenseIds.length > 0) {
      const id = createdExpenseIds.pop()!
      await deleteExpense(request, id, adminToken)
    }
  })

  test('REQ-EXP-01: record daily expense', async ({ page }) => {
    const suffix = uniqueSuffix()
    const category = `ค่าน้ำมัน`
    const amount = '750.50'
    const description = `E2E EXP01 ${suffix}`

    await gotoExpensesPage(page)

    const expenseId = await submitExpense(page, { category, amount, description })
    if (expenseId) createdExpenseIds.push(expenseId)

    const row = page.getByRole('row').filter({ hasText: description })
    await expect(row).toBeVisible()
    await expect(row).toContainText(category)
    await expect(row).toContainText(description)
    await expect(row).toContainText('750.50')
  })

  test("REQ-EXP-02: today's expense summary updates", async ({ page }) => {
    const suffix = uniqueSuffix()
    const category = `ค่าคนงาน`
    const amount = '250'
    const description = `E2E EXP02 ${suffix}`

    await gotoExpensesPage(page)
    const before = await getTodaySummary(page)

    const expenseId = await submitExpense(page, { category, amount, description })
    if (expenseId) createdExpenseIds.push(expenseId)

    const after = await getTodaySummary(page)
    expect(after.total).toBeCloseTo(before.total + 250, 2)
    expect(after.count).toBe(before.count + 1)
  })

  test('REQ-EXP-03: delete expense', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const category = `ค่าซ่อมรถ`
    const amount = 400
    const description = `E2E EXP03 ${suffix}`

    const createRes = await request.post(`${E2E_BASE_URL}/api/expenses`, {
      headers: apiHeaders(adminToken),
      data: {
        category,
        amount,
        description,
        userId: 'admin-placeholder',
        userName: 'admin',
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const created = await createRes.json()
    const expenseId = created.id ?? created.expense?.id
    expect(expenseId).toBeTruthy()

    await gotoExpensesPage(page)
    const before = await getTodaySummary(page)

    const row = page.getByRole('row').filter({ hasText: description })
    await expect(row).toBeVisible()
    const reloadReq = page.waitForResponse(
      (r) => r.url().includes('/api/expenses') && r.request().method() === 'GET'
    )
    await row.getByRole('button', { name: /ลบ/i }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()
    await reloadReq

    await expect(page.getByText(description)).not.toBeVisible()

    const after = await getTodaySummary(page)
    expect(after.total).toBeCloseTo(before.total - amount, 2)
    expect(after.count).toBe(before.count - 1)
  })

  test('REQ-EXP-04: expense categories available', async ({ page }) => {
    await gotoExpensesPage(page)

    const categoryInput = expenseForm(page).getByPlaceholder(/ระบุประเภท/i)
    await categoryInput.focus()

    for (const category of DEFAULT_CATEGORIES) {
      await expect(expenseForm(page).getByRole('button', { name: category, exact: true })).toBeVisible()
    }

    await categoryInput.fill('ค่าน้ำ')
    await expect(expenseForm(page).getByRole('button', { name: 'ค่าน้ำมัน', exact: true })).toBeVisible()
    await expenseForm(page).getByRole('button', { name: 'ค่าน้ำมัน', exact: true }).click()
    await expect(categoryInput).toHaveValue('ค่าน้ำมัน')
  })
})
