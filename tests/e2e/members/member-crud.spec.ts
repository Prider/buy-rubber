import { test, expect } from '@playwright/test'
import { getAdminToken, createMember, deleteMember, uniqueSuffix } from '../fixtures/data.fixture'

test.describe('Members CRUD', () => {
  let createdMemberId: string | null = null
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)
  })

  test.afterEach(async ({ request }) => {
    if (createdMemberId) {
      await deleteMember(request, createdMemberId, adminToken)
      createdMemberId = null
    }
  })

  test('page loads and shows members list', async ({ page }) => {
    await page.goto('/members')
    await expect(page.getByRole('heading', { name: 'จัดการสมาชิก' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'เพิ่มสมาชิก' })).toBeVisible()
  })

  test('create a new member', async ({ page }) => {
    const suffix = uniqueSuffix()
    const memberName = `ทดสอบ ${suffix}`

    await page.goto('/members')
    await page.getByRole('button', { name: 'เพิ่มสมาชิก' }).click()

    // Modal opens
    await expect(page.getByText('เพิ่มสมาชิกใหม่')).toBeVisible()

    // Fill name field
    await page.getByPlaceholder('กรอกชื่อ-นามสกุล').fill(memberName)

    // Phone is optional but fill it
    await page.getByPlaceholder('กรอกเบอร์โทรศัพท์').fill('0812345678')

    // Submit — click the button inside the modal overlay (not the header button)
    const modal = page.locator('.fixed.inset-0')
    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/members') && r.request().method() === 'POST'
    )
    await modal.getByRole('button', { name: 'เพิ่มสมาชิก' }).click()
    const saveRes = await saveReq
    expect(saveRes.status()).toBe(201)

    const created = await saveRes.json()
    createdMemberId = created.id

    // Modal closes and member appears in table
    await expect(page.getByText('เพิ่มสมาชิกใหม่')).not.toBeVisible()
    await expect(page.getByText(memberName)).toBeVisible()
  })

  test('edit a member name', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const originalName = `ทดสอบแก้ไข ${suffix}`
    const updatedName = `ทดสอบแก้ไขแล้ว ${suffix}`

    // Create member via API for isolation
    const created = await createMember(request, adminToken, { name: originalName, phone: '0800000001' })
    createdMemberId = created.id

    await page.goto('/members')
    await expect(page.getByText(originalName)).toBeVisible()

    // Click edit on this member's row
    const row = page.getByRole('row').filter({ hasText: originalName })
    await row.getByRole('button', { name: /แก้ไข/i }).click()

    // Form opens in edit mode
    await expect(page.getByText('แก้ไขสมาชิก')).toBeVisible()

    // Update name
    const nameInput = page.getByPlaceholder('กรอกชื่อ-นามสกุล')
    await nameInput.clear()
    await nameInput.fill(updatedName)

    const saveReq = page.waitForResponse(
      (r) => r.url().includes('/api/members') && r.request().method() === 'PUT'
    )
    await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click()
    await saveReq

    // Modal closes and updated name appears
    await expect(page.getByText('แก้ไขสมาชิก')).not.toBeVisible()
    await expect(page.getByText(updatedName)).toBeVisible()
  })

  test('delete a member', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const memberName = `ทดสอบลบ ${suffix}`

    // Create via API
    const created = await createMember(request, adminToken, { name: memberName, phone: '0800000002' })
    createdMemberId = created.id

    await page.goto('/members')
    const searchInput = page.getByPlaceholder(/ค้นหา/i)
    await searchInput.fill(memberName)
    await page.waitForResponse((r) => r.url().includes('/api/members') && r.ok())
    await expect(page.getByText(memberName)).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: memberName })
    await row.getByRole('button', { name: /ลบ/i }).click()

    // Confirm inside the alertdialog — confirmText is 'ลบ'
    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    // Member disappears from table
    await expect(page.getByText(memberName)).not.toBeVisible()
    createdMemberId = null // already deleted
  })

  test('search filters members by name', async ({ page }) => {
    await page.goto('/members')

    const searchInput = page.getByPlaceholder(/ค้นหา/i)
    await searchInput.fill('M001')

    // Wait for debounce + API
    await page.waitForResponse((r) => r.url().includes('/api/members'))

    const rows = page.getByRole('row').filter({ hasText: 'M001' })
    await expect(rows.first()).toBeVisible()
  })
})
