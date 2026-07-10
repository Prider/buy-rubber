import { test, expect, type Page } from '@playwright/test'
import {
  apiHeaders,
  createMember,
  deleteMember,
  deletePurchase,
  deleteServiceFee,
  E2E_BASE_URL,
  getAdminToken,
  getSlipSettings,
  setDailyPrices,
  setSlipSettings,
  uniqueSuffix,
} from '../fixtures/data.fixture'

test.describe('Purchase flow', () => {
  let adminToken: string
  let testMember: { id: string; code: string; name: string }
  let productType: { id: string; code: string; name: string }
  const createdPurchaseIds: string[] = []
  const createdServiceFeeIds: string[] = []
  let slipSettingsToRestore: Awaited<ReturnType<typeof getSlipSettings>> | null = null

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)

    testMember = await createMember(request, adminToken, {
      name: `E2E Purchase ${uniqueSuffix()}`,
    })

    const productTypesRes = await request.get(`${E2E_BASE_URL}/api/product-types`, {
      headers: apiHeaders(adminToken),
    })
    expect(productTypesRes.ok()).toBeTruthy()
    const productTypes = (await productTypesRes.json()) as Array<{
      id: string
      code: string
      name: string
    }>
    expect(productTypes.length).toBeGreaterThan(0)
    productType = productTypes[0]

    await setDailyPrices(request, adminToken, [
      { productTypeId: productType.id, price: 50 },
    ])
  })

  test.afterEach(async ({ request }) => {
    if (slipSettingsToRestore) {
      await request.post(`${E2E_BASE_URL}/api/slip/settings`, { data: slipSettingsToRestore })
      slipSettingsToRestore = null
    }
    while (createdServiceFeeIds.length > 0) {
      const id = createdServiceFeeIds.pop()!
      await deleteServiceFee(request, id, adminToken)
    }
    while (createdPurchaseIds.length > 0) {
      const id = createdPurchaseIds.pop()!
      await deletePurchase(request, id, adminToken)
    }
  })

  test.afterAll(async ({ request }) => {
    if (testMember?.id) {
      await deleteMember(request, testMember.id, adminToken)
    }
  })

  async function gotoPurchasesPage(page: Page) {
    const membersReq = page.waitForResponse((r) => r.url().includes('/api/members') && r.ok())
    const productTypesReq = page.waitForResponse((r) => r.url().includes('/api/product-types') && r.ok())
    const pricesReq = page.waitForResponse((r) => r.url().includes('/api/prices/daily') && r.ok())
    const slipSettingsReq = page.waitForResponse(
      (r) => r.url().includes('/api/slip/settings') && r.ok()
    )

    await page.goto('/purchases')
    await expect(page.getByText('บันทึกการรับซื้อ')).toBeVisible()
    await Promise.all([membersReq, productTypesReq, pricesReq, slipSettingsReq])
  }

  async function selectMember(page: Page) {
    const memberSearch = page.getByPlaceholder('ค้นหาสมาชิกตามชื่อหรือรหัส')
    await memberSearch.click()
    await memberSearch.fill(testMember.code)
    await page.getByRole('button', { name: new RegExp(`${testMember.code} - ${testMember.name}`) }).click()
  }

  async function selectProductType(page: Page) {
    const productSearch = page.getByPlaceholder('ค้นหาตามชื่อหรือรหัส...')
    await productSearch.click()
    await productSearch.fill(productType.code)
    await page.getByRole('button', { name: new RegExp(`${productType.code} - ${productType.name}`) }).click()
  }

  async function fillWeights(page: Page, gross: string, container: string) {
    await page.locator('input[name="grossWeight"]').fill(gross)
    await page.locator('input[name="containerWeight"]').fill(container)
  }

  function purchaseForm(page: Page) {
    return page.locator('form').filter({ has: page.locator('input[name="grossWeight"]') })
  }

  function serviceFeeForm(page: Page) {
    return page.locator('form').filter({ has: page.locator('input[name="category"]') })
  }

  async function addServiceFeeItem(page: Page, category: string, amount: string) {
    const form = serviceFeeForm(page)
    await form.locator('input[name="category"]').fill(category)
    await form.locator('input[name="amount"]').fill(amount)
    await expect(form.getByRole('button', { name: 'เพิ่มลงตะกร้า' })).toBeEnabled()
    await form.getByRole('button', { name: 'เพิ่มลงตะกร้า' }).click()
  }

  async function addPurchaseItem(
    page: Page,
    gross: string,
    container: string,
    options?: { includeMember?: boolean }
  ) {
    if (options?.includeMember) {
      await selectMember(page)
    }
    await selectProductType(page)
    await fillWeights(page, gross, container)
    await expect(purchaseForm(page).getByRole('button', { name: 'เพิ่มลงตะกร้า' })).toBeEnabled()
    await purchaseForm(page).getByRole('button', { name: 'เพิ่มลงตะกร้า' }).click()
  }

  test('page loads with purchase form and cart', async ({ page }) => {
    await gotoPurchasesPage(page)
    await expect(page.getByRole('heading', { name: 'ตะกร้า' })).toBeVisible()
    await expect(page.locator('input[name="grossWeight"]')).toBeVisible()
    await expect(page.locator('input[name="netWeight"]')).toBeVisible()
  })

  test('auto-calculates net weight from gross minus container', async ({ page }) => {
    await gotoPurchasesPage(page)

    await fillWeights(page, '100', '5')

    await expect(page.locator('input[name="netWeight"]')).toHaveValue('95.00')
  })

  test('applies daily price when product type is selected', async ({ page }) => {
    await gotoPurchasesPage(page)

    await selectProductType(page)

    await expect(page.locator('input[name="pricePerUnit"]')).toHaveValue('50')
  })

  test('shows validation error when container weight is invalid', async ({ page }) => {
    await gotoPurchasesPage(page)

    await fillWeights(page, '100', '100')

    await expect(page.getByText('น้ำหนักภาชนะต้องน้อยกว่าน้ำหนักรวมภาชนะ')).toBeVisible()
    await expect(purchaseForm(page).getByRole('button', { name: 'เพิ่มลงตะกร้า' })).toBeDisabled()
  })

  test('submits multi-item purchase transaction', async ({ page }) => {
    await gotoPurchasesPage(page)

    await addPurchaseItem(page, '100', '5', { includeMember: true })

    await expect(page.getByText('รายการรับซื้อที่รอการบันทึก (1 รายการ)')).toBeVisible()

    await addPurchaseItem(page, '120', '10')

    await expect(page.getByText('รายการรับซื้อที่รอการบันทึก (2 รายการ)')).toBeVisible()

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/purchases') && r.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'บันทึกข้อมูล' }).click()
    const saveRes = await saveReq
    expect(saveRes.ok()).toBeTruthy()

    const body = (await saveRes.json()) as {
      purchaseNo?: string
      purchases?: Array<{ id: string; purchaseNo?: string; netWeight?: number }>
    }

    expect(body.purchaseNo).toBeTruthy()
    expect(body.purchases?.length).toBe(2)
    expect(body.purchases?.[0]?.purchaseNo).toBe(body.purchaseNo)
    expect(body.purchases?.[1]?.purchaseNo).toBe(body.purchaseNo)

    for (const purchase of body.purchases ?? []) {
      if (purchase.id) createdPurchaseIds.push(purchase.id)
    }

    await expect(page.getByText('บันทึกข้อมูลเรียบร้อยแล้ว')).toBeVisible()
    await page.getByRole('button', { name: 'ปิด' }).click()
    await expect(page.getByText('ตะกร้าว่าง - เพิ่มรายการรับซื้อเพื่อเริ่มต้น')).toBeVisible()
  })

  test('attaches service fee to purchase transaction', async ({ page, request }) => {
    const feeCategory = `ค่าขนส่ง E2E ${uniqueSuffix()}`

    await gotoPurchasesPage(page)

    await addPurchaseItem(page, '100', '5', { includeMember: true })
    await addServiceFeeItem(page, feeCategory, '150')

    await expect(page.getByText('รายการรับซื้อที่รอการบันทึก (2 รายการ)')).toBeVisible()
    await expect(page.getByText(feeCategory)).toBeVisible()
    await expect(page.getByRole('table').getByText('ค่าใช้จ่าย', { exact: true })).toBeVisible()

    const purchaseReq = page.waitForResponse(
      (r) => r.url().includes('/api/purchases') && r.request().method() === 'POST'
    )
    const serviceFeeReq = page.waitForResponse(
      (r) => r.url().includes('/api/servicefees') && r.request().method() === 'POST'
    )

    await page.getByRole('button', { name: 'บันทึกข้อมูล' }).click()

    const purchaseRes = await purchaseReq
    const serviceFeeRes = await serviceFeeReq
    expect(purchaseRes.ok()).toBeTruthy()
    expect(serviceFeeRes.ok()).toBeTruthy()

    const purchaseBody = (await purchaseRes.json()) as {
      purchaseNo?: string
      purchases?: Array<{ id: string }>
    }
    const serviceFeeBody = (await serviceFeeRes.json()) as {
      serviceFees?: Array<{ id: string; purchaseNo?: string; category: string; amount: number }>
    }

    expect(purchaseBody.purchaseNo).toBeTruthy()
    expect(serviceFeeBody.serviceFees?.length).toBe(1)
    expect(serviceFeeBody.serviceFees?.[0]?.purchaseNo).toBe(purchaseBody.purchaseNo)
    expect(serviceFeeBody.serviceFees?.[0]?.category).toBe(feeCategory)
    expect(serviceFeeBody.serviceFees?.[0]?.amount).toBe(150)

    for (const purchase of purchaseBody.purchases ?? []) {
      if (purchase.id) createdPurchaseIds.push(purchase.id)
    }
    for (const serviceFee of serviceFeeBody.serviceFees ?? []) {
      if (serviceFee.id) createdServiceFeeIds.push(serviceFee.id)
    }

    const linkedFeesRes = await request.get(
      `${E2E_BASE_URL}/api/servicefees?purchaseNo=${purchaseBody.purchaseNo}`,
      { headers: apiHeaders(adminToken) }
    )
    expect(linkedFeesRes.ok()).toBeTruthy()
    const linkedFeesBody = (await linkedFeesRes.json()) as {
      serviceFees?: Array<{ category: string; purchaseNo?: string }>
    }
    expect(
      linkedFeesBody.serviceFees?.some(
        (fee) => fee.category === feeCategory && fee.purchaseNo === purchaseBody.purchaseNo
      )
    ).toBeTruthy()

    await expect(page.getByText('บันทึกข้อมูลเรียบร้อยแล้ว')).toBeVisible()
    await page.getByRole('button', { name: 'ปิด' }).click()
    await expect(page.getByText('ตะกร้าว่าง - เพิ่มรายการรับซื้อเพื่อเริ่มต้น')).toBeVisible()
  })

  test('REQ-PUR-10: respects slip paper size setting in purchase slip preview', async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000)

    slipSettingsToRestore = await getSlipSettings(request)
    const slipSettings = await setSlipSettings(request, { paperSize: '58mm' })
    expect(slipSettings.paperSize).toBe('58mm')

    await gotoPurchasesPage(page)

    await addPurchaseItem(page, '100', '5', { includeMember: true })

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/purchases') && r.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'บันทึกข้อมูล' }).click()
    const saveRes = await saveReq
    expect(saveRes.ok()).toBeTruthy()

    const purchaseBody = (await saveRes.json()) as {
      purchases?: Array<{ id: string }>
    }
    for (const purchase of purchaseBody.purchases ?? []) {
      if (purchase.id) createdPurchaseIds.push(purchase.id)
    }

    await expect(page.getByText('บันทึกข้อมูลเรียบร้อยแล้ว')).toBeVisible()

    // Mirror admin save: persist paper size to localStorage for slipGenerator.
    await page.evaluate((paperSize) => {
      localStorage.setItem('slip_paperSize', paperSize)
    }, slipSettings.paperSize)

    const [previewPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'ดูตัวอย่าง PDF' }).click(),
    ])
    await previewPage.waitForLoadState('domcontentloaded')

    await expect(previewPage.locator('.slip')).toHaveAttribute('data-slip-width', '219')
    const previewHtml = await previewPage.content()
    expect(previewHtml).toContain('width: 219px')

    await previewPage.close()
  })
})
