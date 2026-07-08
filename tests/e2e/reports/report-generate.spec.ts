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

  test('dashboard refreshes on tab focus', async ({ context }) => {
    const e2ePort = process.env.PLAYWRIGHT_PORT ?? '3099'
    await context.addInitScript((port: string) => {
      localStorage.setItem('client_port', port)
    }, e2ePort)

    const dashboardPage = await context.newPage()
    let dashboardRequests = 0
    dashboardPage.on('request', (req) => {
      if (req.url().includes('/api/dashboard') && req.method() === 'GET') {
        dashboardRequests += 1
      }
    })

    await dashboardPage.goto('/dashboard')
    await expect(dashboardPage.getByRole('heading', { name: /dashboard|แดชบอร์ด/i })).toBeVisible()
    await expect.poll(() => dashboardRequests, { timeout: 15_000 }).toBeGreaterThanOrEqual(1)

    // Dashboard throttles refresh to once every 2 seconds after mount
    await dashboardPage.waitForTimeout(2500)
    const requestsBeforeFocus = dashboardRequests

    // Simulate tab away then back (getter override works when value property does not)
    await dashboardPage.evaluate(() => {
      let visibility: DocumentVisibilityState = document.visibilityState
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get() {
          return visibility
        },
      })
      visibility = 'hidden'
      document.dispatchEvent(new Event('visibilitychange'))
      visibility = 'visible'
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await expect.poll(() => dashboardRequests, { timeout: 10_000 }).toBeGreaterThan(
      requestsBeforeFocus
    )

    await dashboardPage.close()
  })
})
