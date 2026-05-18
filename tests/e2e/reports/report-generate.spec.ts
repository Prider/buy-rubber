import { test, expect } from '@playwright/test'
import { todayDate } from '../fixtures/data.fixture'

test.describe('Report generation', () => {
  test('reports page loads with filter card', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: /รายงาน|Report/i })).toBeVisible()
  })

  test('filter by date range and generate report', async ({ page }) => {
    await page.goto('/reports')

    // Set start date to 30 days ago
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10)
    const endDate = todayDate()

    // Fill date inputs — typically named startDate / endDate or use type="date"
    const dateInputs = page.locator('input[type="date"]')
    await dateInputs.first().fill(startDate)
    await dateInputs.last().fill(endDate)

    // Click generate/search button
    const generateBtn = page.getByRole('button', { name: /ค้นหา|สร้างรายงาน|Generate|แสดง/i })
    await generateBtn.click()

    // Wait for report API
    await page.waitForResponse((r) => r.url().includes('/api/reports') || r.url().includes('/api/purchases'))

    // Report table or "no data" message should be visible
    await expect(
      page.getByRole('table').or(page.getByText(/ไม่พบข้อมูล|No data|0 รายการ/i))
    ).toBeVisible()
  })

  test('profit-loss report page loads', async ({ page }) => {
    await page.goto('/reports/profit-loss')
    await expect(page.getByRole('heading', { name: /กำไร|ขาดทุน|Profit/i })).toBeVisible()
  })

  test('PDF export button is present', async ({ page }) => {
    await page.goto('/reports')

    const pdfBtn = page.getByRole('button', { name: /PDF|ดาวน์โหลด|Export/i })
    await expect(pdfBtn).toBeVisible()
  })

  test('dashboard shows key stats', async ({ page }) => {
    await page.goto('/dashboard')

    // Dashboard should show KPI cards
    await expect(page.getByRole('heading', { name: /dashboard|แดชบอร์ด/i })).toBeVisible()
  })

  test('dashboard refreshes on tab focus', async ({ page }) => {
    await page.goto('/dashboard')

    // Simulate visibility change by hiding then showing the page
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/dashboard'),
      { timeout: 5000 }
    )

    // Trigger visibilitychange event
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Dashboard API should be called
    const response = await responsePromise
    expect(response.status()).toBe(200)
  })
})
