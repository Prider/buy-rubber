import { test, expect, type Page } from '@playwright/test'
import { loginAs } from '../fixtures/auth.fixture'
import {
  apiHeaders,
  createMember,
  createPurchaseTransaction,
  deleteMember,
  deletePurchase,
  E2E_BASE_URL,
  ensureViewerUser,
  getAdminToken,
  getPurchaseTransactions,
  offsetDate,
  setDailyPrices,
  todayDate,
  uniqueSuffix,
  updatePurchase,
} from '../fixtures/data.fixture'

test.describe('Purchase history', () => {
  let adminToken: string
  let testMember: { id: string; code: string; name: string }
  let otherMember: { id: string; code: string; name: string }
  let productType: { id: string; code: string; name: string }
  const createdPurchaseIds: string[] = []

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)

    const suffix = uniqueSuffix()
    testMember = await createMember(request, adminToken, {
      name: `E2E History A ${suffix}`,
    })
    otherMember = await createMember(request, adminToken, {
      name: `E2E History B ${suffix}`,
    })

    const productTypesRes = await request.get(`${E2E_BASE_URL}/api/product-types`, {
      headers: apiHeaders(adminToken),
    })
    expect(productTypesRes.ok()).toBeTruthy()
    const productTypes = (await productTypesRes.json()) as Array<{
      id: string
      code: string
      name: string
    }>
    expect(productTypes.length).toBeGreaterThan(0)
    productType = productTypes[0]

    await setDailyPrices(request, adminToken, [{ productTypeId: productType.id, price: 50 }])
  })

  test.afterEach(async ({ request }) => {
    while (createdPurchaseIds.length > 0) {
      const id = createdPurchaseIds.pop()!
      await deletePurchase(request, id, adminToken)
    }
  })

  test.afterAll(async ({ request }) => {
    if (otherMember?.id) {
      await deleteMember(request, otherMember.id, adminToken)
    }
    if (testMember?.id) {
      await deleteMember(request, testMember.id, adminToken)
    }
  })

  function trackPurchases(transaction: { purchases: Array<{ id: string }> }) {
    for (const purchase of transaction.purchases) {
      createdPurchaseIds.push(purchase.id)
    }
  }

  async function gotoPurchaseHistory(page: Page) {
    const txReq = page.waitForResponse(
      (r) => r.url().includes('/api/purchases/transactions') && r.ok()
    )
    await page.goto('/purchases-list')
    await expect(page.getByRole('heading', { name: 'ประวัติการรับซื้อทั้งหมด' })).toBeVisible()
    await txReq
  }

  async function searchTransactions(page: Page, term: string) {
    const txReq = page.waitForResponse(
      (r) =>
        r.url().includes('/api/purchases/transactions') &&
        r.url().includes(`search=${encodeURIComponent(term)}`)
    )
    const searchInput = page.getByPlaceholder(
      'ค้นหารายการตามเลขที่รับซื้อ, ชื่อสมาชิก หรือรหัสสมาชิก...'
    )
    await searchInput.fill(term)
    await txReq
  }

  test('REQ-PUR-13: view purchase history list', async ({ page, request }) => {
    const transaction = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      items: [{ grossWeight: 100, containerWeight: 5, pricePerUnit: 50 }],
    })
    trackPurchases(transaction)

    await gotoPurchaseHistory(page)

    await expect(page.getByRole('columnheader', { name: 'เลขที่รับซื้อ' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'วันที่' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'สมาชิก' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'รายการ' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'ยอดรวม' })).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: transaction.purchaseNo })
    await expect(row).toBeVisible()
    await expect(row).toContainText(`${testMember.name} (${testMember.code})`)
    await expect(row).toContainText('รับซื้อ: 1 รายการ')
    await expect(page.getByText(/แสดง\s+\d+\s+จาก\s+\d+\s+รายการ/)).toBeVisible()
  })

  test('REQ-PUR-14: filter purchases by date and member', async ({ page, request }) => {
    const today = todayDate()
    const oldDate = offsetDate(-120)

    const todayTransaction = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      date: today,
      items: [{ grossWeight: 100, containerWeight: 5, pricePerUnit: 50 }],
    })
    trackPurchases(todayTransaction)

    const otherMemberTransaction = await createPurchaseTransaction(request, adminToken, {
      memberId: otherMember.id,
      productTypeId: productType.id,
      date: today,
      items: [{ grossWeight: 80, containerWeight: 3, pricePerUnit: 50 }],
    })
    trackPurchases(otherMemberTransaction)

    const oldTransaction = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      date: oldDate,
      items: [{ grossWeight: 60, containerWeight: 2, pricePerUnit: 50 }],
    })
    trackPurchases(oldTransaction)

    await gotoPurchaseHistory(page)

    await searchTransactions(page, testMember.code)

    const memberRows = page.getByRole('row').filter({ hasText: testMember.name })
    await expect(memberRows.filter({ hasText: todayTransaction.purchaseNo })).toBeVisible()
    await expect(memberRows.filter({ hasText: otherMemberTransaction.purchaseNo })).toHaveCount(0)

    const defaultList = await getPurchaseTransactions(request, adminToken)
    const defaultPurchaseNos = defaultList.transactions.map((tx) => tx.purchaseNo)
    expect(defaultPurchaseNos).toContain(todayTransaction.purchaseNo)
    expect(defaultPurchaseNos).not.toContain(oldTransaction.purchaseNo)

    const dateFiltered = await getPurchaseTransactions(request, adminToken, {
      startDate: oldDate,
      endDate: oldDate,
      memberId: testMember.id,
    })
    const filteredPurchaseNos = dateFiltered.transactions.map((tx) => tx.purchaseNo)
    expect(filteredPurchaseNos).toContain(oldTransaction.purchaseNo)
    expect(filteredPurchaseNos).not.toContain(todayTransaction.purchaseNo)
  })

  test('REQ-PUR-15: admin can edit and delete purchase history', async ({ page, request }) => {
    const transaction = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      items: [{ grossWeight: 100, containerWeight: 5, pricePerUnit: 50 }],
    })
    const purchase = transaction.purchases[0]
    trackPurchases(transaction)

    const updatedGross = 150
    const updatedContainer = 5
    const updatedNet = updatedGross - updatedContainer
    const updated = await updatePurchase(request, adminToken, purchase.id, {
      memberId: testMember.id,
      productTypeId: productType.id,
      date: todayDate(),
      grossWeight: updatedGross,
      containerWeight: updatedContainer,
      pricePerUnit: 50,
    })
    expect(updated.netWeight).toBe(updatedNet)
    expect(updated.totalAmount).toBeCloseTo(updatedNet * 50, 2)

    await gotoPurchaseHistory(page)

    const row = page.getByRole('row').filter({ hasText: transaction.purchaseNo })
    await expect(row).toBeVisible()
    await expect(row.getByRole('button', { name: 'ลบ' })).toBeVisible()

    const formattedAmount = new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(updated.totalAmount)
    await expect(row).toContainText(formattedAmount)

    const deleteReq = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/purchases/${purchase.id}`) && r.request().method() === 'DELETE'
    )
    await row.getByRole('button', { name: 'ลบ' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()
    await deleteReq

    await expect(page.getByRole('row').filter({ hasText: transaction.purchaseNo })).toHaveCount(0)
    await expect(page.getByText(`ลบรายการ ${transaction.purchaseNo} เรียบร้อยแล้ว`)).toBeVisible()

    const index = createdPurchaseIds.indexOf(purchase.id)
    if (index >= 0) createdPurchaseIds.splice(index, 1)
  })

  test('REQ-PUR-15: viewer cannot delete purchase history', async ({ browser, request }) => {
    await ensureViewerUser(request)

    const transaction = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      items: [{ grossWeight: 90, containerWeight: 4, pricePerUnit: 50 }],
    })
    trackPurchases(transaction)

    const context = await browser.newContext()
    const page = await context.newPage()

    await loginAs(page, 'demo', 'demo@123')
    await gotoPurchaseHistory(page)

    const row = page.getByRole('row').filter({ hasText: transaction.purchaseNo })
    await expect(row).toBeVisible()
    await expect(row.getByRole('button', { name: 'ลบ' })).toHaveCount(0)
    await expect(row.getByRole('button', { name: 'พิมพ์' })).toBeVisible()
    await expect(row.getByRole('button', { name: 'PDF' })).toBeVisible()

    await context.close()
  })

  test('REQ-PUR-16: group multi-item transactions', async ({ page, request }) => {
    const item1Net = 100 - 5
    const item2Net = 120 - 10
    const price = 50
    const expectedTotal = item1Net * price + item2Net * price

    const transaction = await createPurchaseTransaction(request, adminToken, {
      memberId: testMember.id,
      productTypeId: productType.id,
      items: [
        { grossWeight: 100, containerWeight: 5, pricePerUnit: price },
        { grossWeight: 120, containerWeight: 10, pricePerUnit: price },
      ],
    })
    trackPurchases(transaction)

    expect(transaction.purchases).toHaveLength(2)
    expect(transaction.purchases.every((p) => p.purchaseNo === transaction.purchaseNo)).toBeTruthy()

    const apiResult = await getPurchaseTransactions(request, adminToken, {
      search: transaction.purchaseNo,
    })
    expect(apiResult.transactions).toHaveLength(1)
    expect(apiResult.transactions[0].purchases).toHaveLength(2)
    expect(apiResult.transactions[0].totalAmount).toBeCloseTo(expectedTotal, 2)

    await gotoPurchaseHistory(page)
    await searchTransactions(page, transaction.purchaseNo)

    const rows = page.getByRole('row').filter({ hasText: transaction.purchaseNo })
    await expect(rows).toHaveCount(1)

    const row = rows.first()
    await expect(row).toContainText('รับซื้อ: 2 รายการ')
    await expect(row).toContainText(`${testMember.name} (${testMember.code})`)

    const formattedTotal = new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(expectedTotal)
    await expect(row).toContainText(formattedTotal)
  })
})
