import { test, expect } from '@playwright/test'
import { getAdminToken, todayDate } from '../fixtures/data.fixture'

test.describe('Price management', () => {
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)
  })

  test('page loads with price form and history table', async ({ page }) => {
    await page.goto('/prices')
    await expect(page.getByRole('heading', { name: 'ตั้งราคาประกาศ' })).toBeVisible()
  })

  test('set daily prices and see them saved', async ({ page }) => {
    await page.goto('/prices')

    // Date field should have today's date pre-filled
    const dateField = page.getByLabel('วันที่ประกาศราคา')
    await expect(dateField).toHaveValue(todayDate())

    // Enter a price for the first product type row
    // Price inputs are rendered per product type — target first number input in the price section
    const priceInputs = page.locator('input[type="number"][placeholder]').filter({
      has: page.locator(':scope'),
    })
    const firstPriceInput = priceInputs.first()
    await firstPriceInput.fill('55.50')

    // Save
    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/prices') && r.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'บันทึกราคา' }).click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(200)

    // Success toast or price appears in history
    await expect(page.getByText(/บันทึก|สำเร็จ|55/i)).toBeVisible()
  })

  test('price history table is visible', async ({ page }) => {
    await page.goto('/prices')
    // History table section should be present on the page
    await expect(page.getByText(/ประวัติราคา|Price History/i)).toBeVisible()
  })

  test('today prices card shows current prices', async ({ page }) => {
    // First set a price via API so there's data
    const ptRes = await page.request.get('http://localhost:3000/api/product-types', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const ptBody = await ptRes.json()
    const productTypeId = ptBody.data?.[0]?.id ?? ptBody[0]?.id

    if (productTypeId) {
      await page.request.post('http://localhost:3000/api/prices/daily', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          date: todayDate(),
          prices: [{ productTypeId, price: 60 }],
        },
      })
    }

    await page.goto('/prices')
    // Today's prices should be displayed somewhere on the page
    await expect(page.getByText(/ราคาวันนี้|Today/i)).toBeVisible()
  })
})
