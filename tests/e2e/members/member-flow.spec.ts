import { test, expect, type Page } from '@playwright/test'
import {
  apiHeaders,
  createMember,
  createPurchaseTransaction,
  deleteMember,
  deletePurchase,
  E2E_BASE_URL,
  getAdminToken,
  getMember,
  setDailyPrices,
  uniqueSuffix,
  updateMember,
} from '../fixtures/data.fixture'

test.describe('Member flow', () => {
  let adminToken: string
  let productType: { id: string; code: string; name: string }
  const createdMemberIds: string[] = []
  const createdPurchaseIds: string[] = []

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)

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

    await setDailyPrices(request, adminToken, [{ productTypeId: productType.id, price: 50 }])
  })

  test.afterEach(async ({ request }) => {
    while (createdPurchaseIds.length > 0) {
      const id = createdPurchaseIds.pop()!
      await deletePurchase(request, id, adminToken)
    }
    while (createdMemberIds.length > 0) {
      const id = createdMemberIds.pop()!
      await deleteMember(request, id, adminToken)
    }
  })

  async function gotoMembersPage(page: Page) {
    const membersReq = page.waitForResponse((r) => r.url().includes('/api/members') && r.ok())
    await page.goto('/members')
    await expect(page.getByRole('heading', { name: 'จัดการสมาชิก' })).toBeVisible()
    await membersReq
  }

  async function searchMembers(page: Page, term: string) {
    const searchInput = page.getByPlaceholder(/ค้นหาสมาชิก/i)
    const membersReq = page.waitForResponse(
      (r) => {
        if (!r.url().includes('/api/members') || !r.ok()) return false
        return new URL(r.url()).searchParams.get('search') === term
      },
      { timeout: 15_000 }
    )
    await searchInput.fill(term)
    await membersReq
  }

  function memberModal(page: Page) {
    return page.locator('.fixed.inset-0').filter({ hasText: /เพิ่มสมาชิกใหม่|แก้ไขสมาชิก/ })
  }

  test('REQ-MEM-01: create member with auto-generated code', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const memberName = `E2E MEM01 ${suffix}`

    await gotoMembersPage(page)
    await page.getByRole('button', { name: 'เพิ่มสมาชิก' }).click()
    await expect(page.getByText('เพิ่มสมาชิกใหม่')).toBeVisible()

    const codeInput = page.getByPlaceholder('รหัสสมาชิก')
    await expect(codeInput).toBeDisabled()
    const autoCode = await codeInput.inputValue()
    expect(autoCode).toMatch(/^M\d{3}$/)

    await page.getByPlaceholder('กรอกชื่อ-นามสกุล').fill(memberName)
    await page.getByPlaceholder('กรอกเบอร์โทรศัพท์').fill('0811111111')

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/members') && r.request().method() === 'POST'
    )
    await memberModal(page).getByRole('button', { name: 'เพิ่มสมาชิก' }).click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(201)

    const created = await saveRes.json()
    createdMemberIds.push(created.id)

    expect(created.code).toBe(autoCode)
    expect(created.name).toBe(memberName)

    await expect(page.getByText('เพิ่มสมาชิกใหม่')).not.toBeVisible()
    await expect(page.getByText(memberName)).toBeVisible()
    await expect(page.getByText(autoCode)).toBeVisible()

    const fetched = await getMember(request, adminToken, created.id)
    expect(fetched.code).toBe(autoCode)
    expect(fetched.name).toBe(memberName)
  })

  test('REQ-MEM-02: edit member details', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const originalName = `E2E MEM02 ${suffix}`
    const updatedName = `E2E MEM02 Updated ${suffix}`
    const updatedPhone = '0899999999'
    const updatedAddress = `ที่อยู่ทดสอบ ${suffix}`

    const created = await createMember(request, adminToken, {
      name: originalName,
      phone: '0800000001',
    })
    createdMemberIds.push(created.id)

    await gotoMembersPage(page)
    const row = page.getByRole('row').filter({ hasText: originalName })
    await row.getByRole('button', { name: /แก้ไข/i }).click()
    await expect(page.getByText('แก้ไขสมาชิก')).toBeVisible()

    await page.getByPlaceholder('กรอกชื่อ-นามสกุล').fill(updatedName)
    await page.getByPlaceholder('กรอกเบอร์โทรศัพท์').fill(updatedPhone)
    await page.getByPlaceholder('กรอกที่อยู่').fill(updatedAddress)

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/members') && r.request().method() === 'PUT'
    )
    await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click()
    await saveReq

    await expect(page.getByText('แก้ไขสมาชิก')).not.toBeVisible()
    await expect(page.getByText(updatedName)).toBeVisible()

    const fetched = await getMember(request, adminToken, created.id)
    expect(fetched.name).toBe(updatedName)
    expect(fetched.phone).toBe(updatedPhone)
    expect(fetched.address).toBe(updatedAddress)
  })

  test('REQ-MEM-03: delete member without purchases', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const memberName = `E2E MEM03 Hard ${suffix}`

    const created = await createMember(request, adminToken, { name: memberName })
    createdMemberIds.push(created.id)

    await gotoMembersPage(page)
    await expect(page.getByText(memberName)).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: memberName })
    await row.getByRole('button', { name: /ลบ/i }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    await expect(page.getByText(memberName)).not.toBeVisible()

    const idx = createdMemberIds.indexOf(created.id)
    if (idx >= 0) createdMemberIds.splice(idx, 1)
  })

  test('REQ-MEM-03: soft-deletes member with purchase history', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const memberName = `E2E MEM03 Soft ${suffix}`

    const created = await createMember(request, adminToken, { name: memberName })
    createdMemberIds.push(created.id)

    const transaction = await createPurchaseTransaction(request, adminToken, {
      memberId: created.id,
      productTypeId: productType.id,
      items: [{ grossWeight: 100, containerWeight: 5, pricePerUnit: 50 }],
    })
    for (const purchase of transaction.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    await gotoMembersPage(page)
    const row = page.getByRole('row').filter({ hasText: memberName })
    await row.getByRole('button', { name: /ลบ/i }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    const deactivatedRow = page.getByRole('row').filter({ hasText: memberName })
    await expect(deactivatedRow).toBeVisible()
    await expect(deactivatedRow.getByRole('button', { name: /เปิดใช้งาน/i })).toBeVisible()

    const fetched = await getMember(request, adminToken, created.id)
    expect(fetched.isActive).toBe(false)
  })

  test('REQ-MEM-04: search members by name and code', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const memberName = `E2E MEM04 ${suffix}`

    const created = await createMember(request, adminToken, {
      name: memberName,
      phone: '0822222222',
    })
    createdMemberIds.push(created.id)

    await gotoMembersPage(page)

    await searchMembers(page, memberName)
    await expect(page.getByRole('row').filter({ hasText: memberName })).toBeVisible()

    await searchMembers(page, created.code)
    await expect(page.getByRole('row').filter({ hasText: created.code })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: memberName })).toBeVisible()

    await searchMembers(page, `ZZZ-NOMATCH-${suffix}`)
    await expect(page.getByRole('row').filter({ hasText: memberName })).not.toBeVisible()
    await expect(page.getByText('ยังไม่มีสมาชิก')).toBeVisible()
  })

  test('REQ-MEM-05: configure owner/tapper split percentages', async ({ request }) => {
    const suffix = uniqueSuffix()
    const memberName = `E2E MEM05 ${suffix}`

    const created = await createMember(request, adminToken, {
      name: memberName,
      ownerPercent: 70,
      tapperPercent: 30,
      tapperName: 'คนตัดทดสอบ',
    })
    createdMemberIds.push(created.id)

    const fetched = await getMember(request, adminToken, created.id)
    expect(fetched.ownerPercent).toBe(70)
    expect(fetched.tapperPercent).toBe(30)
    expect(fetched.tapperName).toBe('คนตัดทดสอบ')

    const updated = await updateMember(request, adminToken, created.id, {
      name: memberName,
      ownerPercent: 60,
      tapperPercent: 40,
      tapperName: 'คนตัดใหม่',
    })
    expect(updated.ownerPercent).toBe(60)
    expect(updated.tapperPercent).toBe(40)
    expect(updated.tapperName).toBe('คนตัดใหม่')

    const defaultMember = await createMember(request, adminToken, {
      name: `E2E MEM05 Default ${suffix}`,
    })
    createdMemberIds.push(defaultMember.id)

    const defaultFetched = await getMember(request, adminToken, defaultMember.id)
    expect(defaultFetched.ownerPercent).toBe(100)
    expect(defaultFetched.tapperPercent).toBe(0)
  })

  test('REQ-MEM-06: track advance balance baseline', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const memberName = `E2E MEM06 ${suffix}`

    await gotoMembersPage(page)
    await page.getByRole('button', { name: 'เพิ่มสมาชิก' }).click()
    await page.getByPlaceholder('กรอกชื่อ-นามสกุล').fill(memberName)

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/members') && r.request().method() === 'POST'
    )
    await memberModal(page).getByRole('button', { name: 'เพิ่มสมาชิก' }).click()
    const saveRes = await saveReq
    const created = await saveRes.json()
    createdMemberIds.push(created.id)

    const fetched = await getMember(request, adminToken, created.id)
    expect(fetched.advanceBalance).toBe(0)
  })

  test('REQ-MEM-07: view member purchase history', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const memberName = `E2E MEM07 ${suffix}`

    const created = await createMember(request, adminToken, { name: memberName })
    createdMemberIds.push(created.id)

    const transaction = await createPurchaseTransaction(request, adminToken, {
      memberId: created.id,
      productTypeId: productType.id,
      items: [{ grossWeight: 120, containerWeight: 10, pricePerUnit: 50 }],
    })
    for (const purchase of transaction.purchases) {
      createdPurchaseIds.push(purchase.id)
    }

    const netWeight = 110
    const totalAmount = netWeight * 50

    await gotoMembersPage(page)

    const row = page.getByRole('row').filter({ hasText: memberName })
    const historyReq = page.waitForResponse(
      (r) => r.url().includes(`/api/members/${created.id}/purchases`) && r.ok()
    )
    await row.getByRole('button', { name: /ประวัติ/i }).click()
    await historyReq

    const historyModal = page
      .locator('.fixed.inset-0')
      .filter({ has: page.getByRole('heading', { name: 'ประวัติการรับซื้อ' }) })

    await expect(historyModal).toBeVisible()
    await expect(historyModal.getByText(`${memberName} (${created.code})`)).toBeVisible()
    await expect(historyModal.getByText('ยอดรวมทั้งหมด')).toBeVisible()
    await expect(historyModal.getByText('จำนวนครั้ง')).toBeVisible()
    await expect(historyModal.getByText('น้ำหนักรวม')).toBeVisible()

    await expect(historyModal.getByRole('cell', { name: transaction.purchaseNo })).toBeVisible()
    await expect(historyModal.getByRole('cell', { name: productType.name })).toBeVisible()
    await expect(historyModal.getByRole('cell', { name: `${netWeight.toFixed(2)} กก.` })).toBeVisible()

    const formattedTotal = new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(totalAmount)
    await expect(historyModal.getByRole('cell', { name: formattedTotal })).toBeVisible()
  })
})
