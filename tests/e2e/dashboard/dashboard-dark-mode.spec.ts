import { test, expect } from '@playwright/test'

/** WCAG AA minimum contrast for large text (18pt+ or 14pt bold). */
const MIN_LARGE_TEXT_CONTRAST = 3

test.describe('Dashboard dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
  })

  test('Dark mode readable on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /แดชบอร์ด/i })).toBeVisible()

    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true)

    const statValues = page.locator('.text-4xl.font-bold')
    await expect(statValues.first()).toBeVisible()
    expect(await statValues.count()).toBeGreaterThan(0)

    const sectionHeadings = [
      page.getByRole('heading', { name: 'รายการรับซื้อล่าสุด' }),
      page.getByRole('heading', { name: 'ค่าใช้จ่ายล่าสุด' }),
      page.getByRole('heading', { name: 'สมาชิกที่รับซื้อมากที่สุด' }),
    ]
    for (const heading of sectionHeadings) {
      await expect(heading).toBeVisible()
    }

    const contrastResults = await page.evaluate((minContrast) => {
      function parseRgb(color: string): [number, number, number] | null {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (!match) return null
        return [Number(match[1]), Number(match[2]), Number(match[3])]
      }

      function relativeLuminance([r, g, b]: [number, number, number]): number {
        const [rs, gs, bs] = [r, g, b].map((channel) => {
          const s = channel / 255
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
        })
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
      }

      function contrastRatio(fg: string, bg: string): number | null {
        const fgRgb = parseRgb(fg)
        const bgRgb = parseRgb(bg)
        if (!fgRgb || !bgRgb) return null
        const l1 = relativeLuminance(fgRgb)
        const l2 = relativeLuminance(bgRgb)
        const lighter = Math.max(l1, l2)
        const darker = Math.min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)
      }

      function getEffectiveBackground(el: Element): string {
        let current: Element | null = el
        while (current) {
          const bg = window.getComputedStyle(current).backgroundColor
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return bg
          }
          current = current.parentElement
        }
        return window.getComputedStyle(document.body).backgroundColor
      }

      function measureContrast(selector: string) {
        return Array.from(document.querySelectorAll(selector)).map((el) => {
          const style = window.getComputedStyle(el)
          const ratio = contrastRatio(style.color, getEffectiveBackground(el))
          return {
            text: el.textContent?.trim().slice(0, 40) ?? '',
            ratio,
          }
        })
      }

      const samples = [
        ...measureContrast('.text-4xl.font-bold'),
        ...measureContrast('h2.text-base.font-bold'),
        ...measureContrast('h3.text-base.font-bold'),
        ...measureContrast('p.text-sm.text-gray-600'),
      ].filter((sample) => sample.ratio !== null)

      const minRatio = samples.reduce(
        (min, sample) => Math.min(min, sample.ratio as number),
        Infinity
      )

      return {
        minRatio: Number.isFinite(minRatio) ? minRatio : 0,
        failing: samples.filter((sample) => (sample.ratio as number) < minContrast),
      }
    }, MIN_LARGE_TEXT_CONTRAST)

    expect(
      contrastResults.failing,
      `Low-contrast text in dark mode: ${JSON.stringify(contrastResults.failing)}`
    ).toEqual([])
    expect(contrastResults.minRatio).toBeGreaterThanOrEqual(MIN_LARGE_TEXT_CONTRAST)
  })
})

test.describe('Dashboard dark mode persistence', () => {
  test('REQ-UI-01: dark mode persists across reloads', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /แดชบอร์ด/i })).toBeVisible()

    await page.evaluate(() => {
      localStorage.setItem('theme', 'light')
      document.documentElement.classList.remove('dark')
    })
    await page.reload()
    await expect(page.getByRole('heading', { name: /แดชบอร์ด/i })).toBeVisible()

    await page.getByRole('button', { name: 'เปลี่ยนเป็นโหมดมืด' }).click()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('theme')))
      .toBe('dark')

    await page.reload()
    await expect(page.getByRole('heading', { name: /แดชบอร์ด/i })).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('theme')))
      .toBe('dark')

    await page.getByRole('button', { name: 'เปลี่ยนเป็นโหมดสว่าง' }).click()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(false)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('theme')))
      .toBe('light')

    await page.reload()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(false)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('theme')))
      .toBe('light')
  })
})
