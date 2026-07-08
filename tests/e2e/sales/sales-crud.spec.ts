import { test, expect } from '@playwright/test'
import { E2E_BASE_URL, getAdminToken, deleteSale, todayDate, uniqueSuffix } from '../fixtures/data.fixture'

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
    await page.goto('/sales')
    await expect(page.getByTestId('sales-form-card')).toBeVisible()
  })

  test('create a sale', async ({ page }) => {
    const suffix = uniqueSuffix()
    const companyName = `บริษัททดสอบ ${suffix}`

    await page.goto('/sales')

    const formCard = page.getByTestId('sales-form-card')
    const isExpanded = await formCard.locator('[aria-expanded="true"]').count()
    if (isExpanded === 0) {
      await formCard.locator('button[id="sales-form-card-toggle"]').click()
    }

    await page.locator('[name="companyName"]').fill(companyName)

    const productTypeSelect = page.locator('[name="productTypeId"]')
    await productTypeSelect.selectOption({ index: 1 })

    await page.locator('[name="weight"]').fill('100')
    await page.locator('[name="pricePerUnit"]').fill('50')

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

    const ptRes = await request.get(`${E2E_BASE_URL}/api/product-types`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const ptBody = await ptRes.json()
    const productTypeId = ptBody.data?.[0]?.id ?? ptBody[0]?.id

    const createRes = await request.post(`${E2E_BASE_URL}/api/sales`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        date: todayDate(),
        companyName,
        productTypeId,
        weight: 100,
        pricePerUnit: 45,
        sellingType: 'จ่ายสด',
      },
    })
    const created = await createRes.json()
    createdSaleId = created.id ?? created.sale?.id

    await page.goto('/sales')
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

    const ptRes = await request.get(`${E2E_BASE_URL}/api/product-types`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const ptBody = await ptRes.json()
    const productTypeId = ptBody.data?.[0]?.id ?? ptBody[0]?.id

    const createRes = await request.post(`${E2E_BASE_URL}/api/sales`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        date: todayDate(),
        companyName,
        productTypeId,
        weight: 50,
        pricePerUnit: 40,
        sellingType: 'จ่ายสด',
      },
    })
    const created = await createRes.json()
    createdSaleId = created.id ?? created.sale?.id

    await page.goto('/sales')
    await expect(page.getByText(companyName)).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: companyName })
    await row.getByRole('button', { name: /ลบ/i }).click()

    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    await expect(page.getByText(companyName)).not.toBeVisible()
    createdSaleId = null
  })

  test('sales form shows total preview', async ({ page }) => {
    await page.goto('/sales')

    const formCard = page.getByTestId('sales-form-card')
    const isExpanded = await formCard.locator('[aria-expanded="true"]').count()
    if (isExpanded === 0) {
      await formCard.locator('button[id="sales-form-card-toggle"]').click()
    }

    const productTypeSelect = page.locator('[name="productTypeId"]')
    await productTypeSelect.selectOption({ index: 1 })

    await page.locator('[name="weight"]').fill('100')
    await page.locator('[name="pricePerUnit"]').fill('50')

    await expect(page.getByText(/ยอดรวมประมาณการ/)).toBeVisible()
    await expect(formCard.getByText(/5,000/)).toBeVisible()
  })
})
