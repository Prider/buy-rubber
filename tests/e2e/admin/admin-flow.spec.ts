import { test, expect, type Page } from '@playwright/test'
import {
  deleteUser,
  E2E_BASE_URL,
  getAdminToken,
  getSlipSettings,
  setSlipSettings,
  uniqueSuffix,
  type SlipSettings,
} from '../fixtures/data.fixture'
import { dismissAlertDialogs } from '../fixtures/ui.fixture'

const E2E_PORT = process.env.PLAYWRIGHT_PORT ?? '3099'

/** apiClient defaults to localhost:3000; proxy those calls to the e2e dev server. */
async function routeMisconfiguredApiClient(page: Page) {
  await page.route(`http://localhost:3000/**`, async (route) => {
    const url = route.request().url().replace('://localhost:3000', `://localhost:${E2E_PORT}`)
    await route.continue({ url })
  })
}

async function gotoAdminPage(page: Page) {
  await page.goto('/admin')
  await expect(page).toHaveURL('/admin')
  await expect(page.getByRole('heading', { name: 'ตั้งค่าระบบ' })).toBeVisible()
}

async function openUsersTab(page: Page) {
  await gotoAdminPage(page)
  await dismissAlertDialogs(page)
  const usersReq = page.waitForResponse((r) => r.url().includes('/api/users') && r.ok())
  await page.getByRole('tab', { name: 'ผู้ใช้งาน' }).click()
  await expect(page.getByRole('heading', { name: 'จัดการผู้ใช้งาน' })).toBeVisible()
  await usersReq
}

async function openSlipTab(page: Page) {
  await routeMisconfiguredApiClient(page)
  await gotoAdminPage(page)
  const slipReq = page.waitForResponse(
    (r) => r.url().startsWith(`${E2E_BASE_URL}/api/slip/settings`) && r.ok()
  )
  await page.getByRole('tab', { name: 'ใบรับซื้อ (Slip)' }).click()
  await expect(page.getByText('ตั้งค่าข้อมูลใบรับซื้อ (Slip)')).toBeVisible()
  await slipReq
}

function createUserModal(page: Page) {
  return page.locator('div.fixed.inset-0').filter({ hasText: 'สร้างผู้ใช้งานใหม่' })
}

function editUserModal(page: Page) {
  return page.locator('div.fixed.inset-0').filter({ hasText: 'แก้ไขผู้ใช้งาน' })
}

function slipPanel(page: Page) {
  return page.locator('#admin-tabpanel-slip')
}

test.describe('Admin flow', () => {
  let adminToken: string
  let slipSettingsToRestore: SlipSettings | null = null
  const createdUserIds: string[] = []

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)
    slipSettingsToRestore = await getSlipSettings(request)
  })

  test.afterEach(async ({ request }) => {
    while (createdUserIds.length > 0) {
      const id = createdUserIds.pop()!
      await deleteUser(request, id, adminToken)
    }
  })

  test.afterAll(async ({ request }) => {
    if (slipSettingsToRestore) {
      await setSlipSettings(request, slipSettingsToRestore)
    }
  })

  test('REQ-ADM-01: admin manages users (CRUD)', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const username = `e2eadm01${suffix}`
    const updatedUsername = `e2eadm01u${suffix}`

    await openUsersTab(page)
    await page.getByRole('button', { name: 'เพิ่มผู้ใช้งาน' }).click()
    await expect(page.getByRole('heading', { name: 'สร้างผู้ใช้งานใหม่' })).toBeVisible()

    const modal = createUserModal(page)
    await modal.locator('input[type="text"]').fill(username)
    await modal.locator('input[type="password"]').fill('Test@12345')
    await modal.locator('select').selectOption('viewer')

    const createReq = page.waitForResponse(
      (r) => r.url().includes('/api/users') && r.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'สร้างผู้ใช้งาน' }).click()
    const createRes = await createReq
    expect(createRes.status()).toBe(201)

    const created = await createRes.json()
    const userId = created.user?.id ?? created.id
    expect(userId).toBeTruthy()
    createdUserIds.push(userId)

    await expect(page.getByText(username)).toBeVisible()

    const getRes = await request.get(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    expect(getRes.ok()).toBeTruthy()
    const fetched = await getRes.json()
    expect(fetched.user.username).toBe(username)

    const row = page.getByRole('row').filter({ hasText: username })
    await row.getByRole('button', { name: 'แก้ไข' }).click()
    await expect(page.getByRole('heading', { name: 'แก้ไขผู้ใช้งาน' })).toBeVisible()

    const editModal = editUserModal(page)
    await editModal.locator('input[type="text"]').fill(updatedUsername)

    const updateReq = page.waitForResponse(
      (r) => r.url().includes(`/api/users/${userId}`) && r.request().method() === 'PUT'
    )
    await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click()
    await updateReq

    await expect(page.getByText(updatedUsername)).toBeVisible()
    await expect(page.getByText(username)).not.toBeVisible()

    const updatedRow = page.getByRole('row').filter({ hasText: updatedUsername })
    await updatedRow.getByRole('button', { name: 'ลบ' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    await expect(page.getByText(updatedUsername)).not.toBeVisible()

    const deletedIdx = createdUserIds.indexOf(userId)
    if (deletedIdx >= 0) createdUserIds.splice(deletedIdx, 1)
  })

  test('REQ-ADM-02: admin assigns user roles', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const username = `e2eadm02${suffix}`

    await openUsersTab(page)
    await page.getByRole('button', { name: 'เพิ่มผู้ใช้งาน' }).click()

    const modal = createUserModal(page)
    await modal.locator('input[type="text"]').fill(username)
    await modal.locator('input[type="password"]').fill('Test@12345')
    await modal.locator('select').selectOption('viewer')

    const createReq = page.waitForResponse(
      (r) => r.url().includes('/api/users') && r.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'สร้างผู้ใช้งาน' }).click()
    const createRes = await createReq
    const created = await createRes.json()
    const userId = created.user?.id ?? created.id
    createdUserIds.push(userId)

    const row = page.getByRole('row').filter({ hasText: username })
    await expect(row.getByText('ผู้ชม')).toBeVisible()

    await row.getByRole('button', { name: 'แก้ไข' }).click()
    const editModal = editUserModal(page)
    await editModal.locator('select').selectOption('user')

    const updateReq = page.waitForResponse(
      (r) => r.url().includes(`/api/users/${userId}`) && r.request().method() === 'PUT'
    )
    await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click()
    await updateReq

    const updatedRow = page.getByRole('row').filter({ hasText: username })
    await expect(updatedRow.getByText('ผู้ใช้งาน')).toBeVisible()
    await expect(updatedRow.getByText('ผู้ชม')).not.toBeVisible()

    const getRes = await request.get(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const fetched = await getRes.json()
    expect(fetched.user.role).toBe('user')
  })

  test('REQ-ADM-03: persists system settings after save and reload', async ({ page, request }) => {
    const suffix = uniqueSuffix()
    const companyName = `E2E Co ${suffix}`
    const companyAddress = `123 Test Road ${suffix}`

    await openSlipTab(page)

    const panel = slipPanel(page)
    await panel.locator('input[type="text"]').fill(companyName)
    await panel.locator('textarea').fill(companyAddress)

    const saveReq = page.waitForResponse(
      (r) =>
        r.url().startsWith(`${E2E_BASE_URL}/api/slip/settings`) &&
        r.request().method() === 'POST'
    )
    await slipPanel(page).getByRole('button', { name: 'บันทึกข้อมูล' }).click()
    const saveRes = await saveReq
    expect(saveRes.ok()).toBeTruthy()

    const saveBody = await saveRes.json()
    expect(saveBody.companyName).toBe(companyName)
    expect(saveBody.companyAddress).toBe(companyAddress)

    const saved = await getSlipSettings(request)
    expect(saved.companyName).toBe(companyName)
    expect(saved.companyAddress).toBe(companyAddress)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'ตั้งค่าระบบ' })).toBeVisible()

    const slipReq = page.waitForResponse(
      (r) => r.url().startsWith(`${E2E_BASE_URL}/api/slip/settings`) && r.ok()
    )
    await page.getByRole('tab', { name: 'ใบรับซื้อ (Slip)' }).click()
    await slipReq

    const reloadedPanel = slipPanel(page)
    await expect(reloadedPanel.locator('input[type="text"]')).toHaveValue(companyName)
    await expect(reloadedPanel.locator('textarea')).toHaveValue(companyAddress)
  })

  test('REQ-ADM-04: configures slip paper size with live preview and persistence', async ({
    page,
    request,
  }) => {
    await openSlipTab(page)

    const panel = slipPanel(page)
    await panel.getByRole('radio', { name: /104mm/ }).click()

    await expect(page.getByText(/104mm.*393 px/)).toBeVisible()

    const iframe = page.frameLocator('iframe[title="ตัวอย่างใบรับซื้อ"]')
    await expect(iframe.locator('.slip')).toHaveAttribute('data-slip-width', '393')

    const saveReq = page.waitForResponse(
      (r) =>
        r.url().startsWith(`${E2E_BASE_URL}/api/slip/settings`) &&
        r.request().method() === 'POST'
    )
    await slipPanel(page).getByRole('button', { name: 'บันทึกข้อมูล' }).click()
    const saveRes = await saveReq
    expect(saveRes.ok()).toBeTruthy()

    const saveBody = await saveRes.json()
    expect(saveBody.paperSize).toBe('104mm')

    const saved = await getSlipSettings(request)
    expect(saved.paperSize).toBe('104mm')

    await page.reload()
    await page.getByRole('tab', { name: 'ใบรับซื้อ (Slip)' }).click()
    await expect(slipPanel(page).getByRole('radio', { name: /104mm/ })).toBeChecked()
    await expect(page.getByText(/104mm.*393 px/)).toBeVisible()
  })
})
