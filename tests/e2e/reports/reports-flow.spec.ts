import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import {
  apiHeaders,
  createMember,
  createPurchaseTransaction,
  createSale,
  deleteExpense,
  deleteMember,
  deletePurchase,
  deleteSale,
  E2E_BASE_URL,
  findOrCreateProductType,
  getAdminToken,
  getProfitLossTotals,
  offsetDate,
  setDailyPrices,
  todayDate,
  uniqueSuffix,
} from '../fixtures/data.fixture'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount)
}

function parseLocaleNumber(text: string): number {
  return Number(text.replace(/[^\d.-]/g, '')) || 0
}

async function getPurchasesInRange(
  request: APIRequestContext,
  token: string,
  params: { startDate: string; endDate: string }
): Promise<Array<{ id: string; purchaseNo: string; totalAmount: number; dryWeight: number }>> {
  const qs = new URLSearchParams({ startDate: params.startDate, endDate: params.endDate })
  const res = await request.get(`${E2E_BASE_URL}/api/purchases?${qs}`, {
    headers: apiHeaders(token),
  })
  if (!res.ok()) {
    throw new Error(`Failed to get purchases: ${res.status()}`)
  }
  return res.json()
}

async function gotoReportsPage(page: Page) {
  const productTypesReq = page.waitForResponse((r) => r.url().includes('/api/product-types') && r.ok())
  await page.goto('/reports')
  await expect(page.getByRole('heading', { name: 'รายงาน', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'ตัวกรองรายงาน' })).toBeVisible()
  await productTypesReq
}

async function fillReportDateRange(page: Page, startDate: string, endDate: string) {
  const dateInputs = page.locator('input[type="date"]')
  await dateInputs.first().fill(startDate)
  await dateInputs.last().fill(endDate)
}

async function generatePurchaseReport(page: Page, startDate: string, endDate: string) {
  await fillReportDateRange(page, startDate, endDate)
  const reportReq = page.waitForResponse(
    (r) => r.url().includes('/api/purchases') && r.request().method() === 'GET' && r.ok()
  )
  await page.getByRole('button', { name: 'สร้างรายงาน' }).click()
  await reportReq
}

async function getPurchaseReportSummary(page: Page): Promise<{ count: number; totalAmount: number }> {
  const cards = page.locator('.no-print').filter({ hasText: 'จำนวนรายการ' })
  const countText = (await cards.getByText(/^\d+$/).first().textContent()) ?? '0'
  const amountCard = page.locator('.no-print').filter({ hasText: 'ยอดเงินรวม' })
  const amountText =
    (await amountCard.getByText(/[\d,.]+\s*฿|฿[\d,.]+/).first().textContent()) ?? '0'
  return {
    count: parseLocaleNumber(countText),
    totalAmount: parseLocaleNumber(amountText),
  }
}

test.describe.serial('Reports flow', () => {
  let adminToken: string
  let testMember: { id: string; code: string; name: string }
  let productType: { id: string; code: string; name: string }
  const createdPurchaseIds: string[] = []
  const createdSaleIds: string[] = []
  const createdExpenseIds: string[] = []

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)

    const suffix = uniqueSuffix()
    productType = await findOrCreateProductType(request, adminToken, {
      code: `ERPT-${suffix}`,
      name: `E2E Reports Flow ${suffix}`,
    })

    testMember = await createMember(request, adminToken, {
      name: `E2E Reports ${suffix}`,
    })

    await setDailyPrices(request, adminToken, [{ productTypeId: productType.id, price: 50 }])
  })

  test.afterEach(async ({ request }) => {
    while (createdExpenseIds.length > 0) {
      const id = createdExpenseIds.pop()!
      await deleteExpense(request, id, adminToken)
    }
    while (createdSaleIds.length > 0) {
      const id = createdSaleIds.pop()!
      await deleteSale(request, id, adminToken)
    }
    while (createdPurchaseIds.length > 0) {
      const id = createdPurchaseIds.pop()!
      await deletePurchase(request, id, adminToken)
    }
  })

  test.afterAll(async ({ request }) => {
    if (testMember?.id) {
      await deleteMember(request, testMember.id, adminToken)
    }
  })

  test('REQ-RPT-01: filter reports by date range', async ({ page, request }) => {
    const inRangeDate = offsetDate(-12)
    const outOfRangeDate = offsetDate(-5)

    const inRangeTxn = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      date: inRangeDate,
      items: [{ grossWeight: 110, containerWeight: 10, pricePerUnit: 40 }],
    })
    for (const purchase of inRangeTxn.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    const outOfRangeTxn = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      date: outOfRangeDate,
      items: [{ grossWeight: 210, containerWeight: 10, pricePerUnit: 45 }],
    })
    for (const purchase of outOfRangeTxn.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    await gotoReportsPage(page)
    await generatePurchaseReport(page, inRangeDate, inRangeDate)

    await expect(page.getByText(inRangeTxn.purchaseNo)).toBeVisible()
    await expect(page.getByText(outOfRangeTxn.purchaseNo)).not.toBeVisible()

    const filtered = await getPurchasesInRange(request, adminToken, {
      startDate: inRangeDate,
      endDate: inRangeDate,
    })
    const filteredNos = new Set(filtered.map((p) => p.purchaseNo))
    expect(filteredNos.has(inRangeTxn.purchaseNo)).toBe(true)
    expect(filteredNos.has(outOfRangeTxn.purchaseNo)).toBe(false)
  })

  test('REQ-RPT-02: purchase report totals accurate', async ({ page, request }) => {
    const reportDate = offsetDate(-11)
    const txn = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      date: reportDate,
      items: [
        { grossWeight: 310, containerWeight: 10, pricePerUnit: 42 },
        { grossWeight: 160, containerWeight: 10, pricePerUnit: 38 },
      ],
    })
    for (const purchase of txn.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    const createdTotal = txn.purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0)
    expect(createdTotal).toBeGreaterThan(0)

    const apiPurchases = await getPurchasesInRange(request, adminToken, {
      startDate: reportDate,
      endDate: reportDate,
    })
    const expectedFromApi = apiPurchases.reduce(
      (acc, purchase) => ({
        count: acc.count + 1,
        totalAmount: acc.totalAmount + purchase.totalAmount,
      }),
      { count: 0, totalAmount: 0 }
    )

    await gotoReportsPage(page)
    await generatePurchaseReport(page, reportDate, reportDate)

    const summary = await getPurchaseReportSummary(page)
    expect(summary.count).toBe(expectedFromApi.count)
    expect(summary.totalAmount).toBeCloseTo(expectedFromApi.totalAmount, 2)
    await expect(page.getByText(formatCurrency(expectedFromApi.totalAmount))).toBeVisible()

    for (const purchase of txn.purchases) {
      await expect(page.getByText(purchase.purchaseNo).first()).toBeVisible()
    }
  })

  test('REQ-RPT-03: export report as PDF', async ({ page, request }) => {
    test.setTimeout(60_000)

    const reportDate = offsetDate(-10)
    const txn = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      date: reportDate,
      items: [{ grossWeight: 120, containerWeight: 10, pricePerUnit: 40 }],
    })
    for (const purchase of txn.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    await gotoReportsPage(page)
    await generatePurchaseReport(page, reportDate, reportDate)
    await expect(page.getByText(txn.purchaseNo)).toBeVisible()

    const pdfBtn = page.getByRole('button', { name: 'ดาวน์โหลด PDF' })
    await expect(pdfBtn).toBeEnabled()

    const downloadPromise = page.waitForEvent('download')
    await pdfBtn.click()
    const download = await downloadPromise

    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.pdf$/)
    const path = await download.path()
    expect(path).toBeTruthy()
  })

  test('REQ-RPT-04: profit/loss report accurate', async ({ page, request }) => {
    const reportDate = offsetDate(-9)
    const expenseAmount = 250

    const purchaseTxn = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      date: reportDate,
      items: [{ grossWeight: 510, containerWeight: 10, pricePerUnit: 40 }],
    })
    for (const purchase of purchaseTxn.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    const sale = await createSale(request, adminToken, {
      companyName: `E2E RPT04 ${uniqueSuffix()}`,
      productTypeId: productType.id,
      weight: 100,
      pricePerUnit: 55,
      date: reportDate,
    })
    createdSaleIds.push(sale.id)

    const expenseRes = await request.post(`${E2E_BASE_URL}/api/expenses`, {
      headers: apiHeaders(adminToken),
      data: {
        category: 'ค่าน้ำมัน',
        amount: expenseAmount,
        description: `E2E RPT04 ${uniqueSuffix()}`,
        date: `${reportDate}T10:00`,
        userId: 'admin-placeholder',
        userName: 'admin',
      },
    })
    expect(expenseRes.ok()).toBeTruthy()
    const expense = await expenseRes.json()
    const expenseId = expense.id ?? expense.expense?.id
    expect(expenseId).toBeTruthy()
    createdExpenseIds.push(expenseId)

    const expected = await getProfitLossTotals(request, adminToken, {
      startDate: reportDate,
      endDate: reportDate,
      view: 'daily',
    })

    const plReq = page.waitForResponse(
      (r) => r.url().includes('/api/reports/profit-loss') && r.ok()
    )
    await page.goto('/reports/profit-loss')
    await expect(page.getByRole('heading', { name: /รายงานกำไร/ })).toBeVisible()
    await plReq

    await page.locator('select').selectOption('daily')
    await fillReportDateRange(page, reportDate, reportDate)

    const refreshReq = page.waitForResponse(
      (r) => r.url().includes('/api/reports/profit-loss') && r.ok()
    )
    await page.getByRole('button', { name: 'อัปเดตรายงาน' }).click()
    await refreshReq

    const totalRow = page.locator('table tbody tr').filter({ hasText: 'Total' })
    await expect(totalRow).toBeVisible()
    await expect(totalRow).toContainText(formatCurrency(expected.sales))
    await expect(totalRow).toContainText(formatCurrency(expected.purchases))
    await expect(totalRow).toContainText(formatCurrency(expected.expenses))
    await expect(totalRow).toContainText(formatCurrency(expected.net))

    const netLabel = expected.net >= 0 ? 'Profit:' : 'Loss:'
    await expect(page.getByText(new RegExp(`${netLabel}\\s*${formatCurrency(expected.net).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))).toBeVisible()
  })

  test('REQ-RPT-05: empty report range handled', async ({ page }) => {
    const emptyStart = offsetDate(-400)
    const emptyEnd = offsetDate(-395)

    await gotoReportsPage(page)
    await generatePurchaseReport(page, emptyStart, emptyEnd)

    const summary = await getPurchaseReportSummary(page)
    expect(summary.count).toBe(0)
    expect(summary.totalAmount).toBe(0)

    await expect(page.getByRole('button', { name: 'ดาวน์โหลด PDF' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'ดูตัวอย่าง PDF' })).toBeDisabled()
    await expect(page.locator('table tbody tr')).toHaveCount(0)

    await fillReportDateRange(page, todayDate(), offsetDate(-1))
    await expect(page.getByRole('button', { name: 'สร้างรายงาน' })).toBeDisabled()
  })
})
