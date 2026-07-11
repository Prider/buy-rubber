import { test, expect, type Page } from '@playwright/test'
import {
  apiHeaders,
  createMember,
  createPurchaseTransaction,
  createSale,
  deleteMember,
  deletePurchase,
  deleteSale,
  E2E_BASE_URL,
  findOrCreateProductType,
  getAdminToken,
  getStockLedger,
  getStockPosition,
  getStockQuantity,
  setDailyPrices,
  todayDate,
  uniqueSuffix,
} from '../fixtures/data.fixture'

function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount)
}

test.describe.serial('Stock flow', () => {
  let adminToken: string
  let testMember: { id: string; code: string; name: string }
  let productType: { id: string; code: string; name: string }
  const createdPurchaseIds: string[] = []
  const createdSaleIds: string[] = []

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)

    const suffix = uniqueSuffix()

    productType = await findOrCreateProductType(request, adminToken, {
      code: `ESTK-${suffix}`,
      name: `E2E Stock Flow ${suffix}`,
    })

    testMember = await createMember(request, adminToken, {
      name: `E2E Stock ${suffix}`,
    })

    await setDailyPrices(request, adminToken, [{ productTypeId: productType.id, price: 50 }])

    const transaction = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      items: [{ grossWeight: 510, containerWeight: 10, pricePerUnit: 40 }],
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

  async function gotoStockPage(page: Page) {
    const stockReq = page.waitForResponse((r) => r.url().includes('/api/stock/positions') && r.ok())
    const productTypesReq = page.waitForResponse((r) => r.url().includes('/api/product-types') && r.ok())

    await page.goto('/stock')
    await expect(page.getByRole('heading', { name: 'จัดการสต็อกสินค้า' })).toBeVisible()
    await Promise.all([stockReq, productTypesReq])
  }

  async function gotoStockDetailPage(page: Page) {
    const ledgerReq = page.waitForResponse(
      (r) => r.url().includes('/api/stock/ledger') && r.ok()
    )

    await page.goto(`/stock/${productType.id}`)
    await expect(page.getByText(`สต็อกสินค้า: ${productType.code}`)).toBeVisible()
    await ledgerReq
  }

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

  test('REQ-STK-02: view stock by product type', async ({ page, request }) => {
    const position = await getStockPosition(request, productType.id, adminToken)

    await gotoStockPage(page)

    const row = page.getByRole('row').filter({ hasText: productType.code })
    await expect(row.getByRole('cell', { name: productType.code })).toBeVisible()
    await expect(row.getByRole('cell', { name: productType.name })).toBeVisible()
    await expect(row).toContainText(formatNumber(position.quantityKg))
    await expect(row).toContainText(formatCurrency(position.avgCostPerKg))
  })

  test('REQ-STK-03: view stock ledger detail', async ({ page, request }) => {
    const ledger = await getStockLedger(request, productType.id, adminToken)
    expect(ledger.entries.length).toBeGreaterThan(0)

    const purchaseEntry = ledger.entries.find((e) => e.refType === 'PURCHASE')
    expect(purchaseEntry).toBeDefined()

    await gotoStockDetailPage(page)

    await expect(page.getByText(`สต็อกสินค้า: ${productType.code}`)).toBeVisible()
    await expect(page.getByText(productType.name)).toBeVisible()
    await expect(
      page.getByText(`คงเหลือปัจจุบัน: ${formatNumber(ledger.position.quantityKg)}`)
    ).toBeVisible()
    await expect(
      page.getByText(`ต้นทุนเฉลี่ย: ${formatCurrency(ledger.position.avgCostPerKg)}`)
    ).toBeVisible()

    const ledgerRow = page.getByRole('row').filter({ hasText: 'PURCHASE' }).first()
    await expect(ledgerRow).toBeVisible()
    await expect(ledgerRow).toContainText(formatNumber(purchaseEntry!.qtyChangeKg))
    if (purchaseEntry!.refNo) {
      await expect(ledgerRow.getByRole('cell', { name: purchaseEntry!.refNo })).toBeVisible()
    }
  })

  test('REQ-STK-04: stock increases on purchase', async ({ request }) => {
    const purchaseNetKg = 75
    const stockBefore = await getStockQuantity(request, productType.id, adminToken)

    const transaction = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      items: [{ grossWeight: purchaseNetKg + 5, containerWeight: 5, pricePerUnit: 45 }],
    })

    for (const purchase of transaction.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    const stockAfter = await getStockQuantity(request, productType.id, adminToken)
    expect(stockAfter).toBeCloseTo(stockBefore + purchaseNetKg, 2)

    const ledger = await getStockLedger(request, productType.id, adminToken)
    const latestPurchase = ledger.entries.find((e) => e.refType === 'PURCHASE')
    expect(latestPurchase?.qtyChangeKg).toBeCloseTo(purchaseNetKg, 2)
    expect(latestPurchase?.balanceQtyKg).toBeCloseTo(stockAfter, 2)
  })

  test('REQ-STK-05: stock decreases on sale', async ({ request }) => {
    const saleWeight = 50
    const stockBefore = await getStockQuantity(request, productType.id, adminToken)

    const sale = await createSale(request, adminToken, {
      companyName: `E2E STK05 ${uniqueSuffix()}`,
      productTypeId: productType.id,
      weight: saleWeight,
      pricePerUnit: 55,
    })
    createdSaleIds.push(sale.id)

    const stockAfter = await getStockQuantity(request, productType.id, adminToken)
    expect(stockAfter).toBeCloseTo(stockBefore - saleWeight, 2)

    const ledger = await getStockLedger(request, productType.id, adminToken)
    const saleEntry = ledger.entries.find((e) => e.refType === 'SALE' && e.refNo === sale.saleNo)
    expect(saleEntry).toBeDefined()
    expect(saleEntry!.qtyChangeKg).toBeCloseTo(-saleWeight, 2)
    expect(saleEntry!.balanceQtyKg).toBeCloseTo(stockAfter, 2)
  })

  test('REQ-STK-06: prevent sale exceeding available stock', async ({ page, request }) => {
    const stockBefore = await getStockQuantity(request, productType.id, adminToken)
    const oversellWeight = stockBefore + 100

    await gotoSalesPage(page)
    await expandSalesForm(page)

    await page.locator('[name="companyName"]').fill(`E2E STK06 ${uniqueSuffix()}`)
    await page.locator('[name="productTypeId"]').selectOption({ value: productType.id })
    await page.locator('[name="weight"]').fill(String(oversellWeight))
    await page.locator('[name="pricePerUnit"]').fill('50')

    await page.getByTestId('sales-form-save').click()
    await expect(page.getByText('น้ำหนักที่ขายต้องไม่เกินสต็อกคงเหลือ')).toBeVisible()

    const stockAfterUiBlock = await getStockQuantity(request, productType.id, adminToken)
    expect(stockAfterUiBlock).toBeCloseTo(stockBefore, 2)

    const apiRes = await request.post(`${E2E_BASE_URL}/api/sales`, {
      headers: apiHeaders(adminToken),
      data: {
        date: todayDate(),
        companyName: `E2E STK06 API ${uniqueSuffix()}`,
        productTypeId: productType.id,
        weight: oversellWeight,
        pricePerUnit: 50,
        sellingType: 'จ่ายสด',
      },
    })
    expect(apiRes.status()).toBe(400)
    const body = (await apiRes.json()) as { error?: string }
    expect(body.error).toBe('สต็อกไม่พอสำหรับการขายรายการนี้')

    const stockAfterApiBlock = await getStockQuantity(request, productType.id, adminToken)
    expect(stockAfterApiBlock).toBeCloseTo(stockBefore, 2)
  })

  test('REQ-STK-07: maintain average cost per kg', async ({ request }) => {
    const positionBefore = await getStockPosition(request, productType.id, adminToken)
    const firstPurchaseKg = 100
    const firstPrice = 40
    const secondPurchaseKg = 100
    const secondPrice = 60

    const firstTx = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      items: [{ grossWeight: firstPurchaseKg + 5, containerWeight: 5, pricePerUnit: firstPrice }],
    })
    for (const purchase of firstTx.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    const afterFirst = await getStockPosition(request, productType.id, adminToken)
    const expectedAfterFirst =
      (positionBefore.quantityKg * positionBefore.avgCostPerKg + firstPurchaseKg * firstPrice) /
      (positionBefore.quantityKg + firstPurchaseKg)
    expect(afterFirst.avgCostPerKg).toBeCloseTo(expectedAfterFirst, 2)

    const secondTx = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      items: [{ grossWeight: secondPurchaseKg + 5, containerWeight: 5, pricePerUnit: secondPrice }],
    })
    for (const purchase of secondTx.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    const afterSecond = await getStockPosition(request, productType.id, adminToken)
    const expectedAfterSecond =
      (afterFirst.quantityKg * afterFirst.avgCostPerKg + secondPurchaseKg * secondPrice) /
      (afterFirst.quantityKg + secondPurchaseKg)
    expect(afterSecond.avgCostPerKg).toBeCloseTo(expectedAfterSecond, 2)

    const ledger = await getStockLedger(request, productType.id, adminToken)
    const latestPurchase = ledger.entries.find((e) => e.refType === 'PURCHASE')
    expect(latestPurchase?.balanceAvgCostPerKg).toBeCloseTo(expectedAfterSecond, 2)
    expect(latestPurchase?.unitCostPerKg).toBeCloseTo(secondPrice, 2)
  })
})
