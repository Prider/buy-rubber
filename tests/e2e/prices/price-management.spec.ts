import { test, expect } from '@playwright/test'

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
})
