import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import {
  E2E_BASE_URL,
  apiHeaders,
  createMember,
  createPurchaseTransaction,
  deleteMember,
  getAdminToken,
  deleteSale,
  todayDate,
  uniqueSuffix,
} from '../fixtures/data.fixture'

async function ensureProductTypeWithStock(
  request: APIRequestContext,
  token: string,
  minKg = 100
): Promise<string> {
  const stockRes = await request.get(`${E2E_BASE_URL}/api/stock/positions`, {
    headers: apiHeaders(token),
  })
  const positions = (await stockRes.json()) as Array<{ productTypeId: string; quantityKg: number }>
  const inStock = positions.find((row) => row.quantityKg >= minKg)
  if (inStock) return inStock.productTypeId

  const ptRes = await request.get(`${E2E_BASE_URL}/api/product-types`, {
    headers: apiHeaders(token),
  })
  const productTypes = (await ptRes.json()) as Array<{ id: string; code: string }>
  const productTypeId =
    productTypes.find((pt) => pt.code === 'RUBER1')?.id ?? productTypes[0]?.id
  if (!productTypeId) {
    throw new Error('No product types available for sales tests')
  }

  const member = await createMember(request, token, {
    name: `E2E Sales Stock ${uniqueSuffix()}`,
  })
  try {
    await createPurchaseTransaction(request, token, {
      memberId: member.id,
      productTypeId,
      items: [{ grossWeight: minKg + 10, containerWeight: 0, pricePerUnit: 40 }],
    })
  } finally {
    await deleteMember(request, member.id, token)
  }

  return productTypeId
}

async function selectProductTypeWithStock(
  page: Page,
  request: APIRequestContext,
  token: string,
  minKg = 100
) {
  const productTypeId = await ensureProductTypeWithStock(request, token, minKg)
  await page.locator('[name="productTypeId"]').selectOption(productTypeId)
}

async function gotoSalesPage(page: Page) {
  const salesReq = page.waitForResponse((r) => r.url().includes('/api/sales') && r.ok())
  const stockReq = page.waitForResponse((r) => r.url().includes('/api/stock/positions') && r.ok())
  const productTypesReq = page.waitForResponse((r) => r.url().includes('/api/product-types') && r.ok())

  await page.goto('/sales')
  await Promise.all([salesReq, stockReq, productTypesReq])
  await expect(page.getByTestId('sales-form-card')).toBeVisible()
}

async function expandSalesForm(page: Page) {
  const toggle = page.locator('#sales-form-card-toggle')
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click()
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
}

test.describe('Sales CRUD', () => {
  let createdSaleId: string | null = null
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)
  })

  test.afterEach(async ({ request }) => {
    if (createdSaleId) {
      await deleteSale(request, createdSaleId, adminToken)
      createdSaleId = null
    }
  })

  test('page loads with sales form and table', async ({ page }) => {
    await gotoSalesPage(page)
    await expect(page.getByTestId('sales-form-card')).toBeVisible()
  })

  test('create a sale', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `บริษัททดสอบ ${suffix}`

    await gotoSalesPage(page)
    await expandSalesForm(page)

    await page.locator('[name="companyName"]').fill(companyName)

    await selectProductTypeWithStock(page, request, adminToken)

    await page.locator('[name="weight"]').fill('100')
    await page.locator('[name="pricePerUnit"]').fill('50')

    await expect(page.getByTestId('sales-form-save')).toBeEnabled()

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/sales') && r.request().method() === 'POST'
    )
    await page.getByTestId('sales-form-save').click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(201)

    const body = await saveRes.json()
    createdSaleId = body.id ?? body.sale?.id ?? null

    await expect(page.getByText(companyName)).toBeVisible()
  })

  test('edit a sale price', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `บริษัทแก้ไข ${suffix}`
    const weight = 100

    const productTypeId = await ensureProductTypeWithStock(request, adminToken, weight)

    const createRes = await request.post(`${E2E_BASE_URL}/api/sales`, {
      headers: apiHeaders(adminToken),
      data: {
        date: todayDate(),
        companyName,
        productTypeId,
        weight,
        pricePerUnit: 45,
        sellingType: 'จ่ายสด',
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const created = await createRes.json()
    createdSaleId = created.id ?? created.sale?.id

    await gotoSalesPage(page)
    await expect(page.getByText(companyName)).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: companyName })
    await row.getByRole('button', { name: /แก้ไข/i }).click()

    const priceInput = page.locator('[name="pricePerUnit"]')
    await priceInput.fill('55')

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/sales') && r.request().method() === 'PUT'
    )
    await page.getByTestId('sales-form-save').click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(200)
  })

  test('delete a sale', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `บริษัทลบ ${suffix}`
    const weight = 50

    const productTypeId = await ensureProductTypeWithStock(request, adminToken, weight)

    const createRes = await request.post(`${E2E_BASE_URL}/api/sales`, {
      headers: apiHeaders(adminToken),
      data: {
        date: todayDate(),
        companyName,
        productTypeId,
        weight,
        pricePerUnit: 40,
        sellingType: 'จ่ายสด',
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const created = await createRes.json()
    createdSaleId = created.id ?? created.sale?.id

    await gotoSalesPage(page)
    await expect(page.getByText(companyName)).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: companyName })
    await row.getByRole('button', { name: /ลบ/i }).click()

    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    await expect(page.getByText(companyName)).not.toBeVisible()
    createdSaleId = null
  })

  test('sales form shows total preview', async ({ page, request }) => {
    await gotoSalesPage(page)
    await expandSalesForm(page)

    const formCard = page.getByTestId('sales-form-card')

    await selectProductTypeWithStock(page, request, adminToken)

    await page.locator('[name="weight"]').fill('100')
    await page.locator('[name="pricePerUnit"]').fill('50')

    await expect(page.getByText(/ยอดรวมประมาณการ/)).toBeVisible()
    await expect(formCard.getByText(/5,000/)).toBeVisible()
  })
})
