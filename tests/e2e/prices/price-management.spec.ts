import { test, expect } from '@playwright/test'
import { apiHeaders, getAdminToken, todayDate } from '../fixtures/data.fixture'

test.describe('Price management', () => {
  test('page loads with product type management', async ({ page }) => {
    await page.goto('/prices')
    await expect(page.getByRole('heading', { name: 'ประเภทสินค้า' })).toBeVisible()
  })

  test('can open add product type modal', async ({ page }) => {
    await page.goto('/prices')

    const addButton = page.getByRole('button', { name: 'เพิ่มประเภท' })
    if (await addButton.isEnabled()) {
      await addButton.click()
      await expect(page.getByRole('heading', { name: 'เพิ่มประเภทสินค้า' })).toBeVisible()
    } else {
      await expect(page.getByText(/ครบจำนวนสูงสุด|สามารถเพิ่มประเภทสินค้าได้สูงสุด/i)).toBeVisible()
    }
  })

  test('product type cards are listed', async ({ page }) => {
    await page.goto('/prices')
    await expect(page.getByText(/\d+ รายการ/)).toBeVisible()
  })

  test('Set daily price per product type', async ({ request }) => {
    const token = await getAdminToken(request)

    const productTypesRes = await request.get('/api/product-types', {
      headers: apiHeaders(token),
    })
    expect(productTypesRes.ok()).toBeTruthy()

    const productTypes = (await productTypesRes.json()) as Array<{
      id: string
      code: string
      name: string
    }>
    expect(productTypes.length).toBeGreaterThan(0)

    const targetProductType = productTypes[0]
    const targetPrice = 123.45

    const setPriceRes = await request.post('/api/prices/daily', {
      headers: apiHeaders(token),
      data: {
        date: todayDate(),
        prices: [{ productTypeId: targetProductType.id, price: targetPrice }],
      },
    })
    expect(setPriceRes.ok()).toBeTruthy()

    const dailyPricesRes = await request.get(`/api/prices/daily?date=${todayDate()}`, {
      headers: apiHeaders(token),
    })
    expect(dailyPricesRes.ok()).toBeTruthy()

    const dailyPrices = (await dailyPricesRes.json()) as Array<{
      productTypeId: string
      price: number
    }>
    const savedPrice = dailyPrices.find((p) => p.productTypeId === targetProductType.id)

    expect(savedPrice).toBeDefined()
    expect(savedPrice?.price).toBe(targetPrice)

    const dashboardRes = await request.get('/api/dashboard', {
      headers: apiHeaders(token),
    })
    expect(dashboardRes.ok()).toBeTruthy()
    const dashboardData = (await dashboardRes.json()) as {
      todayPrices?: Array<{ productTypeId: string; price: number }>
    }
    const dashboardPrice = dashboardData.todayPrices?.find(
      (p) => p.productTypeId === targetProductType.id
    )
    expect(dashboardPrice?.price).toBe(targetPrice)
  })

  test('View historical prices', async ({ request }) => {
    const token = await getAdminToken(request)

    const productTypesRes = await request.get('/api/product-types', {
      headers: apiHeaders(token),
    })
    expect(productTypesRes.ok()).toBeTruthy()

    const productTypes = (await productTypesRes.json()) as Array<{
      id: string
      code: string
      name: string
    }>
    expect(productTypes.length).toBeGreaterThan(0)

    const targetProductType = productTypes[0]
    const historicalPrice = 77.77

    // Use yesterday so it should be considered "history" even if the UI excludes today.
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    const setPriceRes = await request.post('/api/prices/daily', {
      headers: apiHeaders(token),
      data: {
        date: yesterdayStr,
        prices: [{ productTypeId: targetProductType.id, price: historicalPrice }],
      },
    })
    expect(setPriceRes.ok()).toBeTruthy()

    const historyRes = await request.get('/api/prices/history?days=11', {
      headers: apiHeaders(token),
    })
    expect(historyRes.ok()).toBeTruthy()

    const history = (await historyRes.json()) as Array<{
      productTypeId: string
      price: number
      date: string
    }>

    const savedHistoryRecord = history.find((r) => {
      const rDate = new Date(r.date).toISOString().slice(0, 10)
      return r.productTypeId === targetProductType.id && rDate === yesterdayStr
    })

    expect(savedHistoryRecord).toBeDefined()
    expect(savedHistoryRecord?.price).toBe(historicalPrice)
  })
})
