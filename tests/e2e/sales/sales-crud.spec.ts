import { test, expect } from '@playwright/test'
import { getAdminToken, deleteSale, todayDate, uniqueSuffix } from '../fixtures/data.fixture'

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

  test('create a sale', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `บริษัททดสอบ ${suffix}`

    await page.goto('/sales')

    // Ensure form is open
    const formCard = page.getByTestId('sales-form-card')
    const isExpanded = await formCard.locator('[aria-expanded="true"]').count()
    if (isExpanded === 0) {
      await formCard.locator('button[id="sales-form-card-toggle"]').click()
    }

    // Fill company name
    await page.locator('[name="companyName"]').fill(companyName)

    // Select a product type (first available option)
    const productTypeSelect = page.locator('[name="productTypeId"]')
    await productTypeSelect.selectOption({ index: 1 })

    // Fill weight and price
    await page.locator('[name="weight"]').fill('100')
    await page.locator('[name="pricePerUnit"]').fill('50')

    // Save — wait for the POST request
    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/sales') && r.request().method() === 'POST'
    )
    await page.getByTestId('sales-form-save').click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(200)

    const body = await saveRes.json()
    createdSaleId = body.id ?? body.sale?.id ?? null

    // Sale appears in table
    await expect(page.getByText(companyName)).toBeVisible()
  })

  test('edit a sale price', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `บริษัทแก้ไข ${suffix}`

    // Create via API
    const ptRes = await request.get('http://localhost:3000/api/product-types', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const ptBody = await ptRes.json()
    const productTypeId = ptBody.data?.[0]?.id ?? ptBody[0]?.id

    const createRes = await request.post('http://localhost:3000/api/sales', {
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

    // Click edit on the row
    const row = page.getByRole('row').filter({ hasText: companyName })
    await row.getByRole('button', { name: /แก้ไข/i }).click()

    // Only pricePerUnit is editable in edit mode
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

    const ptRes = await request.get('http://localhost:3000/api/product-types', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const ptBody = await ptRes.json()
    const productTypeId = ptBody.data?.[0]?.id ?? ptBody[0]?.id

    const createRes = await request.post('http://localhost:3000/api/sales', {
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

    // Confirm dialog
    await page.getByRole('button', { name: 'ยืนยัน' }).click()

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

    // Total preview should update (100 * 50 = 5,000)
    await expect(page.getByText(/ยอดรวมประมาณการ/)).toBeVisible()
    await expect(page.getByText(/5,000/)).toBeVisible()
  })
})
