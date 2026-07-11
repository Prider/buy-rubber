import { test, expect, type Browser, type Page } from '@playwright/test'

/** Sidebar routes visible in web mode (admin session). */
const WEB_NAV_ROUTES: Array<{
  name: string
  href: string
  verify: (page: Page) => Promise<void>
}> = [
  {
    name: 'แดชบอร์ด',
    href: '/dashboard',
    verify: async (page) => {
      await expect(page.getByRole('heading', { name: /แดชบอร์ด/i })).toBeVisible()
    },
  },
  {
    name: 'รับซื้อยาง',
    href: '/purchases',
    verify: async (page) => {
      await expect(page.getByText('บันทึกการรับซื้อ')).toBeVisible()
    },
  },
  {
    name: 'ขายสินค้า',
    href: '/sales',
    verify: async (page) => {
      await expect(page.getByTestId('sales-form-card')).toBeVisible()
    },
  },
  {
    name: 'สต็อกสินค้า',
    href: '/stock',
    verify: async (page) => {
      await expect(page.getByRole('heading', { name: 'จัดการสต็อกสินค้า' })).toBeVisible()
    },
  },
  {
    name: 'ประวัติการรับซื้อ',
    href: '/purchases-list',
    verify: async (page) => {
      await expect(page.getByRole('heading', { name: 'ประวัติการรับซื้อทั้งหมด' })).toBeVisible()
    },
  },
  {
    name: 'สมาชิก',
    href: '/members',
    verify: async (page) => {
      await expect(page.getByRole('heading', { name: 'จัดการสมาชิก' })).toBeVisible()
    },
  },
  {
    name: 'ค่าใช้จ่าย',
    href: '/expenses',
    verify: async (page) => {
      await expect(page.getByRole('heading', { name: 'บันทึกค่าใช้จ่าย', level: 1 })).toBeVisible()
    },
  },
  {
    name: 'รายงาน',
    href: '/reports',
    verify: async (page) => {
      await expect(page.getByRole('heading', { name: 'รายงาน', exact: true })).toBeVisible()
    },
  },
  {
    name: 'กำไร/ขาดทุน',
    href: '/reports/profit-loss',
    verify: async (page) => {
      await expect(page.getByRole('heading', { name: /รายงานกำไร/ })).toBeVisible()
    },
  },
  {
    name: 'ตั้งค่า',
    href: '/admin',
    verify: async (page) => {
      await expect(page.getByRole('heading', { name: 'ตั้งค่าระบบ' })).toBeVisible()
    },
  },
]

async function installElectronMock(page: Page) {
  await page.addInitScript(() => {
    window.electron = { isElectron: true }
  })
}

async function newElectronAdminPage(
  browser: Browser,
  localStorageSeed?: Record<string, string>
): Promise<Page> {
  const context = await browser.newContext({
    storageState: 'playwright/.auth/admin.json',
  })
  const page = await context.newPage()
  await installElectronMock(page)
  if (localStorageSeed) {
    await page.addInitScript((seed) => {
      for (const [key, value] of Object.entries(seed)) {
        localStorage.setItem(key, value)
      }
    }, localStorageSeed)
  }
  return page
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth > doc.clientWidth + 1
  })
  expect(overflow, 'Page should not scroll horizontally at minimum viewport').toBe(false)
}

async function assertThaiGlyphsRender(page: Page) {
  const issues = await page.evaluate(() => {
    const thaiPattern = /[\u0E00-\u0E7F]/
    const selectors = [
      'nav [data-nav-link] span',
      'main h1',
      'main h2',
      'main th',
      'main label',
      'main button',
      'main input[placeholder]',
      'main textarea[placeholder]',
    ]

    const problems: string[] = []

    for (const selector of selectors) {
      for (const el of Array.from(document.querySelectorAll(selector))) {
        const text = (el.textContent ?? '').trim()
        if (!text || !thaiPattern.test(text)) continue

        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          continue
        }

        const rect = el.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) {
          problems.push(`zero-size Thai text: "${text.slice(0, 40)}" (${selector})`)
          continue
        }

        if (text.includes('\uFFFD')) {
          problems.push(`replacement character in: "${text.slice(0, 40)}"`)
        }
      }
    }

    return problems
  })

  expect(issues, `Thai rendering issues: ${issues.join('; ')}`).toEqual([])
}

test.describe('UI flow', () => {
  test('REQ-UI-02: sidebar navigation routes to every page', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /แดชบอร์ด/i })).toBeVisible()

    for (const route of WEB_NAV_ROUTES) {
      const link = page.locator(`[data-nav-link="${route.href}"]`)
      await expect(link, `Nav link missing: ${route.name}`).toBeVisible()
      await Promise.all([page.waitForURL(route.href), link.click()])
      await route.verify(page)
    }
  })

  test('REQ-UI-03: Electron-only nav items hidden on web', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /แดชบอร์ด/i })).toBeVisible()

    await expect(page.locator('[data-nav-link="/backup"]')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'สำรองข้อมูล' })).toHaveCount(0)
  })

  test('REQ-UI-04: Thai text renders correctly in navigation, forms, and tables', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await assertThaiGlyphsRender(page)

    await page.locator('[data-nav-link="/members"]').click()
    await expect(page.getByRole('heading', { name: 'จัดการสมาชิก' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'รหัส' })).toBeVisible()
    await assertThaiGlyphsRender(page)

    await page.locator('[data-nav-link="/purchases"]').click()
    await expect(page.getByText('บันทึกการรับซื้อ')).toBeVisible()
    await expect(page.getByPlaceholder('ค้นหาสมาชิกตามชื่อหรือรหัส')).toBeVisible()
    await assertThaiGlyphsRender(page)

    await page.locator('[data-nav-link="/expenses"]').click()
    await expect(page.getByRole('heading', { name: 'บันทึกค่าใช้จ่าย', level: 1 })).toBeVisible()
    await assertThaiGlyphsRender(page)
  })

  test('REQ-UI-05: layout usable at minimum window size (1024×768)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })

    const pagesToCheck = ['/dashboard', '/purchases', '/members', '/reports'] as const

    for (const path of pagesToCheck) {
      await page.goto(path)
      await expect(page.locator('main')).toBeVisible()
      await expect(page.getByTitle(/โหมด/i)).toBeVisible()
      await expect(page.locator('[data-nav-link="/dashboard"]')).toBeVisible()
      await assertNoHorizontalOverflow(page)
    }

    await page.goto('/dashboard')
    const sidebarToggle = page.getByRole('button', { name: 'Close sidebar' })
    await sidebarToggle.click()
    await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    await assertNoHorizontalOverflow(page)
  })

  test('REQ-UI-06: app mode switcher works in Electron', async ({ browser }) => {
    const serverPage = await newElectronAdminPage(browser, {
      app_mode: 'server',
      server_port: '3001',
    })

    try {
      await serverPage.goto('/dashboard')
      await expect(serverPage.getByRole('heading', { name: /แดชบอร์ด/i })).toBeVisible()

      const serverSwitcher = serverPage.getByRole('button', { name: /เซิร์ฟเวอร์/ })
      await expect(serverSwitcher).toBeVisible()
      await serverSwitcher.click()

      await expect(serverPage.getByText('สถานะโหมดการทำงาน')).toBeVisible()
      await expect(serverPage.getByText('โหมดปัจจุบัน:')).toBeVisible()
      await expect(serverPage.getByText('พอร์ต:')).toBeVisible()
      await expect(serverPage.getByText('3001')).toBeVisible()
      await expect(serverPage.getByRole('link', { name: 'จัดการการตั้งค่า' })).toBeVisible()
    } finally {
      await serverPage.context().close()
    }

    const clientPage = await newElectronAdminPage(browser, {
      app_mode: 'client',
      server_url: 'http://localhost:3001',
    })

    try {
      await clientPage.goto('/dashboard')
      await expect(
        clientPage.getByRole('button', { name: /ไคลเอนต์ \(http:\/\/localhost:3001\)/ })
      ).toBeVisible()

      await clientPage.getByRole('button', { name: /ไคลเอนต์/ }).click()
      await expect(clientPage.getByText('เซิร์ฟเวอร์:')).toBeVisible()
      await expect(
        clientPage.locator('.absolute.right-0').getByText('http://localhost:3001', { exact: true })
      ).toBeVisible()
    } finally {
      await clientPage.context().close()
    }
  })

  test('REQ-UI-03 (Electron): backup nav visible when running in Electron', async ({
    browser,
  }) => {
    const page = await newElectronAdminPage(browser)

    try {
      await page.goto('/dashboard')
      const backupLink = page.locator('[data-nav-link="/backup"]')
      await expect(backupLink).toBeVisible()
      await backupLink.click()
      await expect(page).toHaveURL('/backup')
      await expect(page.getByRole('heading', { name: 'สำรองข้อมูล', exact: true })).toBeVisible()
    } finally {
      await page.context().close()
    }
  })
})
