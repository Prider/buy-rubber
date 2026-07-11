import { test, expect, type Page } from '@playwright/test'
import {
  apiHeaders,
  createMember,
  createPurchaseTransaction,
  deleteMember,
  deletePurchase,
  deleteSale,
  E2E_BASE_URL,
  findOrCreateProductType,
  getAdminToken,
  getProfitLossTotals,
  getStockQuantity,
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

function computeSaleTotal(weight: number, pricePerUnit: number, expenseCost = 0): number {
  const total = weight * pricePerUnit - expenseCost
  return total > 0 ? total : 0
}

test.describe.serial('Sales flow', () => {
  let adminToken: string
  let testMember: { id: string; code: string; name: string }
  let productType: { id: string; code: string; name: string }
  const createdSaleIds: string[] = []
  const createdPurchaseIds: string[] = []

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)

    const suffix = uniqueSuffix()

    productType = await findOrCreateProductType(request, adminToken, {
      code: `ESF-${suffix}`,
      name: `E2E Sales Flow ${suffix}`,
    })

    testMember = await createMember(request, adminToken, {
      name: `E2E Sales ${suffix}`,
    })

    await setDailyPrices(request, adminToken, [{ productTypeId: productType.id, price: 50 }])

    const transaction = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      items: [{ grossWeight: 1010, containerWeight: 10, pricePerUnit: 40 }],
    })
    for (const purchase of transaction.purchases) {
      createdPurchaseIds.push(purchase.id)
    }
  })

  test.afterEach(async ({ request }) => {
    while (createdSaleIds.length > 0) {
      const id = createdSaleIds.pop()!
      await deleteSale(request, id, adminToken)
    }
  })

  test.afterAll(async ({ request }) => {
    while (createdPurchaseIds.length > 0) {
      const id = createdPurchaseIds.pop()!
      await deletePurchase(request, id, adminToken)
    }
    if (testMember?.id) {
      await deleteMember(request, testMember.id, adminToken)
    }
  })

  async function gotoSalesPage(page: Page) {
    const salesReq = page.waitForResponse((r) => r.url().includes('/api/sales') && r.ok())
    const stockReq = page.waitForResponse((r) => r.url().includes('/api/stock/positions') && r.ok())
    const productTypesReq = page.waitForResponse((r) => r.url().includes('/api/product-types') && r.ok())

    await page.goto('/sales')
    await expect(page.getByTestId('sales-form-card')).toBeVisible()
    await Promise.all([salesReq, stockReq, productTypesReq])
  }

  async function expandSalesForm(page: Page) {
    const formCard = page.getByTestId('sales-form-card')
    const isExpanded = await formCard.locator('[aria-expanded="true"]').count()
    if (isExpanded === 0) {
      await formCard.locator('button[id="sales-form-card-toggle"]').click()
    }
  }

  async function fillSalesForm(
    page: Page,
    data: {
      companyName: string
      weight: string
      pricePerUnit: string
      expenseType?: string
      expenseCost?: string
    }
  ) {
    await page.locator('[name="companyName"]').fill(data.companyName)
    await page.locator('[name="productTypeId"]').selectOption({ value: productType.id })
    await page.locator('[name="weight"]').fill(data.weight)
    await page.locator('[name="pricePerUnit"]').fill(data.pricePerUnit)

    if (data.expenseType) {
      await page.locator('[name="expenseType"]').selectOption(data.expenseType)
    }
    if (data.expenseCost) {
      await page.locator('[name="expenseCost"]').fill(data.expenseCost)
    }
  }

  test('REQ-SAL-01: create sale with correct total', async ({ page }) => {
    const suffix = uniqueSuffix()
    const companyName = `E2E SAL01 ${suffix}`
    const weight = 100
    const pricePerUnit = 50
    const expectedTotal = computeSaleTotal(weight, pricePerUnit)

    await gotoSalesPage(page)
    await expandSalesForm(page)
    await fillSalesForm(page, {
      companyName,
      weight: String(weight),
      pricePerUnit: String(pricePerUnit),
    })

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/sales') && r.request().method() === 'POST'
    )
    await page.getByTestId('sales-form-save').click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(201)

    const created = await saveRes.json()
    createdSaleIds.push(created.id)

    expect(created.saleNo).toMatch(/^SAL-\d{6}-\d{6}$/)
    expect(created.totalAmount).toBeCloseTo(expectedTotal, 2)

    const row = page.getByRole('row').filter({ hasText: companyName })
    await expect(row.getByRole('cell', { name: created.saleNo })).toBeVisible()
    await expect(row.getByRole('cell', { name: formatCurrency(expectedTotal) })).toBeVisible()
  })

  test('REQ-SAL-02: sale decreases stock', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `E2E SAL02 ${suffix}`
    const saleWeight = 80

    const stockBefore = await getStockQuantity(request, productType.id, adminToken)

    await gotoSalesPage(page)
    await expandSalesForm(page)
    await fillSalesForm(page, {
      companyName,
      weight: String(saleWeight),
      pricePerUnit: '50',
    })

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/sales') && r.request().method() === 'POST'
    )
    await page.getByTestId('sales-form-save').click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(201)

    const created = await saveRes.json()
    createdSaleIds.push(created.id)
    expect(created.weight).toBeCloseTo(saleWeight, 2)

    const stockAfter = await getStockQuantity(request, productType.id, adminToken)
    expect(stockAfter).toBeCloseTo(stockBefore - saleWeight, 2)
  })

  test('REQ-SAL-03: edit sale recalculates total', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `E2E SAL03 ${suffix}`
    const weight = 100
    const originalPrice = 45
    const updatedPrice = 55

    const createRes = await request.post(`${E2E_BASE_URL}/api/sales`, {
      headers: apiHeaders(adminToken),
      data: {
        date: todayDate(),
        companyName,
        productTypeId: productType.id,
        weight,
        pricePerUnit: originalPrice,
        sellingType: 'จ่ายสด',
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const created = await createRes.json()
    createdSaleIds.push(created.id)

    const originalTotal = computeSaleTotal(weight, originalPrice)
    const updatedTotal = computeSaleTotal(weight, updatedPrice)
    expect(created.totalAmount).toBeCloseTo(originalTotal, 2)

    await gotoSalesPage(page)
    const row = page.getByRole('row').filter({ hasText: companyName })
    await row.getByRole('button', { name: /แก้ไข/i }).click()

    const priceInput = page.locator('[name="pricePerUnit"]')
    await priceInput.fill(String(updatedPrice))

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/sales') && r.request().method() === 'PUT'
    )
    await page.getByTestId('sales-form-save').click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(200)

    const updated = await saveRes.json()
    expect(updated.totalAmount).toBeCloseTo(updatedTotal, 2)
    await expect(row.getByRole('cell', { name: formatCurrency(updatedTotal) })).toBeVisible()
  })

  test('REQ-SAL-04: delete sale reverses stock', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `E2E SAL04 ${suffix}`
    const saleWeight = 60

    const stockBefore = await getStockQuantity(request, productType.id, adminToken)

    const createRes = await request.post(`${E2E_BASE_URL}/api/sales`, {
      headers: apiHeaders(adminToken),
      data: {
        date: todayDate(),
        companyName,
        productTypeId: productType.id,
        weight: saleWeight,
        pricePerUnit: 50,
        sellingType: 'จ่ายสด',
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const created = await createRes.json()
    createdSaleIds.push(created.id)

    const stockAfterSale = await getStockQuantity(request, productType.id, adminToken)
    expect(stockAfterSale).toBeCloseTo(stockBefore - saleWeight, 2)

    await gotoSalesPage(page)
    const row = page.getByRole('row').filter({ hasText: companyName })
    await row.getByRole('button', { name: /ลบ/i }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    await expect(page.getByText(companyName)).not.toBeVisible()

    const idx = createdSaleIds.indexOf(created.id)
    if (idx >= 0) createdSaleIds.splice(idx, 1)

    const stockAfterDelete = await getStockQuantity(request, productType.id, adminToken)
    expect(stockAfterDelete).toBeCloseTo(stockBefore, 2)
  })

  test('REQ-SAL-05: sale expense cost affects profit', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `E2E SAL05 ${suffix}`
    const weight = 100
    const pricePerUnit = 50
    const expenseCost = 500
    const grossRevenue = weight * pricePerUnit
    const netRevenue = computeSaleTotal(weight, pricePerUnit, expenseCost)
    const date = todayDate()

    const profitBefore = await getProfitLossTotals(request, adminToken, {
      startDate: date,
      endDate: date,
      view: 'daily',
    })

    await gotoSalesPage(page)
    await expandSalesForm(page)
    await fillSalesForm(page, {
      companyName,
      weight: String(weight),
      pricePerUnit: String(pricePerUnit),
      expenseType: 'ค่าขนส่ง',
      expenseCost: String(expenseCost),
    })

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/sales') && r.request().method() === 'POST'
    )
    await page.getByTestId('sales-form-save').click()
    const saveRes = await saveReq
    expect(saveRes.ok()).toBeTruthy()

    const created = await saveRes.json()
    createdSaleIds.push(created.id)
    expect(created.totalAmount).toBeCloseTo(netRevenue, 2)
    expect(created.totalAmount).not.toBeCloseTo(grossRevenue, 2)

    const profitAfter = await getProfitLossTotals(request, adminToken, {
      startDate: date,
      endDate: date,
      view: 'daily',
    })

    expect(profitAfter.sales - profitBefore.sales).toBeCloseTo(netRevenue, 2)
    expect(profitAfter.sales - profitBefore.sales).not.toBeCloseTo(grossRevenue, 2)
  })

  test('REQ-SAL-06: sale form shows live total preview', async ({ page }) => {
    const suffix = uniqueSuffix()
    const companyName = `E2E SAL06 ${suffix}`
    const weight = 100
    const pricePerUnit = 50
    const expenseCost = 500
    const expectedPreview = computeSaleTotal(weight, pricePerUnit, expenseCost)

    await gotoSalesPage(page)
    await expandSalesForm(page)

    const formCard = page.getByTestId('sales-form-card')
    await fillSalesForm(page, {
      companyName,
      weight: String(weight),
      pricePerUnit: String(pricePerUnit),
      expenseType: 'ค่าขนส่ง',
      expenseCost: String(expenseCost),
    })

    await expect(formCard.getByText(/ยอดรวมประมาณการ/)).toBeVisible()
    await expect(formCard.getByText(formatCurrency(expectedPreview))).toBeVisible()

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/sales') && r.request().method() === 'POST'
    )
    await page.getByTestId('sales-form-save').click()
    const saveRes = await saveReq
    expect(saveRes.ok()).toBeTruthy()

    const created = await saveRes.json()
    createdSaleIds.push(created.id)

    expect(created.totalAmount).toBeCloseTo(expectedPreview, 2)

    const row = page.getByRole('row').filter({ hasText: companyName })
    await expect(row.getByRole('cell', { name: formatCurrency(expectedPreview) })).toBeVisible()
  })
})
