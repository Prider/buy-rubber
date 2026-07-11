import fs from 'fs'
import path from 'path'
import { test, expect, type Browser, type Page } from '@playwright/test'
import { loginAs } from '../fixtures/auth.fixture'
import {
  createBackupViaApi,
  createMember,
  deleteBackupViaApi,
  deleteMember,
  downloadBackupViaApi,
  ensureViewerUser,
  getAdminToken,
  getMember,
  listBackups,
  restoreBackupViaApi,
  uniqueSuffix,
} from '../fixtures/data.fixture'

async function installElectronMock(page: Page) {
  await page.addInitScript(() => {
    window.electron = { isElectron: true }
  })
}

async function newElectronAdminPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    storageState: 'playwright/.auth/admin.json',
  })
  const page = await context.newPage()
  await installElectronMock(page)
  return page
}

async function gotoBackupPage(page: Page) {
  const backupReq = page.waitForResponse((r) => r.url().includes('/api/backup') && r.ok())
  await page.goto('/backup')
  await backupReq
  await expect(page.getByRole('heading', { name: 'สำรองข้อมูล', exact: true })).toBeVisible()
}

function backupDirectory(): string {
  return path.join(process.cwd(), 'prisma', 'backups')
}

function listBackupFiles(): string[] {
  const dir = backupDirectory()
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((name) => name.endsWith('.db'))
}

function backupRow(page: Page, fileName: string) {
  return page.locator('h4').filter({ hasText: fileName }).locator('..').locator('..').locator('..')
}

test.describe.serial('Backup flow', () => {
  test.describe.configure({ timeout: 60_000 })
  let adminToken: string
  let baselineBackupId: string | null = null
  const createdBackupIds: string[] = []
  const createdMemberIds: string[] = []

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)
    const baseline = await createBackupViaApi(request, adminToken, 'manual')
    baselineBackupId = baseline.id
    createdBackupIds.push(baseline.id)
  })

  test.afterEach(async ({ request }) => {
    while (createdMemberIds.length > 0) {
      const id = createdMemberIds.pop()!
      try {
        await deleteMember(request, id, adminToken)
      } catch {
        // Member may already be gone after restore tests
      }
    }
  })

  test.afterAll(async ({ request }) => {
    if (baselineBackupId) {
      await restoreBackupViaApi(request, baselineBackupId, adminToken)
    }
  })

  test('REQ-BKP-01: backup page restricted to Electron admin', async ({ page, browser }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: 'สำรองข้อมูล' })).not.toBeVisible()

    await page.goto('/backup')
    await expect(page).toHaveURL('/dashboard')

    const electronPage = await newElectronAdminPage(browser)
    await electronPage.goto('/dashboard')
    await expect(electronPage.getByRole('link', { name: 'สำรองข้อมูล' })).toBeVisible()

    await gotoBackupPage(electronPage)
    await expect(electronPage.getByRole('button', { name: 'สำรองข้อมูลตอนนี้' })).toBeVisible()
    await electronPage.close()

    await ensureViewerUser(page.request)
    const viewerContext = await browser.newContext()
    const viewerPage = await viewerContext.newPage()
    await installElectronMock(viewerPage)
    await loginAs(viewerPage, 'demo', 'demo@123')
    await viewerPage.goto('/backup')
    await expect(viewerPage).toHaveURL('/dashboard')
    await viewerContext.close()
  })

  test('REQ-BKP-02: create manual database backup', async ({ browser, request }) => {
    const page = await newElectronAdminPage(browser)
    await gotoBackupPage(page)

    const beforeCount = (await listBackups(request, adminToken)).length

    const createReq = page.waitForResponse(
      (r) => r.url().includes('/api/backup') && r.request().method() === 'POST'
    )
    const reloadReq = page.waitForResponse(
      (r) => r.url().includes('/api/backup') && r.request().method() === 'GET'
    )
    await page.getByRole('button', { name: 'สำรองข้อมูลตอนนี้' }).click()

    const createRes = await createReq
    expect(createRes.ok()).toBeTruthy()
    await reloadReq

    const createBody = (await createRes.json()) as {
      success: boolean
      backup: { id: string; fileName: string; filePath: string; backupType: string }
    }
    expect(createBody.success).toBe(true)
    expect(createBody.backup.backupType).toBe('manual')
    createdBackupIds.push(createBody.backup.id)

    await expect(page.getByText(createBody.backup.fileName)).toBeVisible()
    expect(fs.existsSync(createBody.backup.filePath)).toBe(true)

    const afterCount = (await listBackups(request, adminToken)).length
    expect(afterCount).toBe(beforeCount + 1)

    await page.close()
  })

  test('REQ-BKP-03: download backup file', async ({ browser, request }) => {
    const backups = await listBackups(request, adminToken)
    const backup = backups.find((item) => item.backupType === 'manual') ?? backups[0]
    expect(backup).toBeTruthy()

    const download = await downloadBackupViaApi(request, backup.id, adminToken)
    expect(download.status).toBe(200)
    expect(download.contentType).toContain('application/octet-stream')
    expect(download.contentLength).toBeGreaterThan(0)
    expect(download.body.length).toBe(backup.fileSize)

    const page = await newElectronAdminPage(browser)
    await gotoBackupPage(page)

    const downloadButton = backupRow(page, backup.fileName).getByTitle('ดาวน์โหลด')
    await expect(downloadButton).toBeVisible()

    const downloadResponse = page.context().waitForEvent('response', {
      predicate: (response) =>
        response.url().includes(`/api/backup/${backup.id}/download`) && response.ok(),
    })
    await downloadButton.click()
    const response = await downloadResponse
    expect(response.status()).toBe(200)

    await page.close()
  })

  test('REQ-BKP-04: restore from backup with safety copy', async ({ browser, request }) => {
    const suffix = uniqueSuffix()
    const markerMember = await createMember(request, adminToken, {
      name: `E2E BKP04 ${suffix}`,
    })
    createdMemberIds.push(markerMember.id)

    const snapshotBackup = await createBackupViaApi(request, adminToken, 'manual')
    createdBackupIds.push(snapshotBackup.id)

    await deleteMember(request, markerMember.id, adminToken)
    createdMemberIds.pop()

    const filesBeforeRestore = new Set(listBackupFiles())

    const page = await newElectronAdminPage(browser)
    await gotoBackupPage(page)

    await new Promise((resolve) => setTimeout(resolve, 1100))

    const restoreReq = page.waitForResponse(
      (r) => r.url().includes('/api/backup') && r.request().method() === 'PUT'
    )
    await backupRow(page, snapshotBackup.fileName).getByTitle('เรียกคืนข้อมูล').click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'เรียกคืนข้อมูล' }).click()
    const restoreRes = await restoreReq
    expect(restoreRes.ok()).toBeTruthy()

    const restoreBody = (await restoreRes.json()) as { success?: boolean }
    expect(restoreBody.success).toBe(true)

    const newBackupFiles = listBackupFiles().filter((name) => !filesBeforeRestore.has(name))
    expect(newBackupFiles.length).toBeGreaterThan(0)

    const restoredMember = await getMember(request, adminToken, markerMember.id)
    expect(restoredMember.name).toBe(markerMember.name)
    createdMemberIds.push(markerMember.id)

    await page.close()
  })

  test('REQ-BKP-05: restored data visible after restart', async ({ browser, request }) => {
    const suffix = uniqueSuffix()
    const markerMember = await createMember(request, adminToken, {
      name: `E2E BKP05 ${suffix}`,
    })
    createdMemberIds.push(markerMember.id)

    const snapshotBackup = await createBackupViaApi(request, adminToken, 'manual')
    createdBackupIds.push(snapshotBackup.id)

    await deleteMember(request, markerMember.id, adminToken)
    createdMemberIds.pop()

    const page = await newElectronAdminPage(browser)
    await gotoBackupPage(page)

    await new Promise((resolve) => setTimeout(resolve, 1100))

    const restoreReq = page.waitForResponse(
      (r) => r.url().includes('/api/backup') && r.request().method() === 'PUT'
    )
    await backupRow(page, snapshotBackup.fileName).getByTitle('เรียกคืนข้อมูล').click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'เรียกคืนข้อมูล' }).click()
    await restoreReq

    await expect(page.getByText('เรียกคืนข้อมูลเรียบร้อย')).toBeVisible({ timeout: 10_000 })
    await page.waitForLoadState('load', { timeout: 15_000 })

    const restored = await getMember(request, adminToken, markerMember.id)
    expect(restored.name).toBe(markerMember.name)
    createdMemberIds.push(markerMember.id)

    await page.close()
  })

  test('REQ-BKP-06: delete backup file', async ({ browser, request }) => {
    const backup = await createBackupViaApi(request, adminToken, 'manual')

    const page = await newElectronAdminPage(browser)
    await gotoBackupPage(page)
    await expect(page.getByText(backup.fileName)).toBeVisible()

    const deleteReq = page.waitForResponse(
      (r) => r.url().includes('/api/backup') && r.request().method() === 'DELETE'
    )
    const reloadReq = page.waitForResponse(
      (r) => r.url().includes('/api/backup') && r.request().method() === 'GET'
    )

    await backupRow(page, backup.fileName).getByTitle('ลบ').click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'ลบ' }).click()

    const deleteRes = await deleteReq
    expect(deleteRes.ok()).toBeTruthy()
    await reloadReq

    await expect(page.getByText(backup.fileName)).not.toBeVisible()
    expect(fs.existsSync(backup.filePath)).toBe(false)

    const remaining = await listBackups(request, adminToken)
    expect(remaining.some((item) => item.id === backup.id)).toBe(false)

    await page.close()
  })

  test('REQ-BKP-07: backup works on SQLite only', async ({ request }) => {
    const backup = await createBackupViaApi(request, adminToken, 'manual')
    createdBackupIds.push(backup.id)

    expect(backup.fileName.endsWith('.db')).toBe(true)
    expect(fs.existsSync(backup.filePath)).toBe(true)
    expect(backup.filePath).toMatch(/backups[/\\]backup-.*\.db$/)

    const backups = await listBackups(request, adminToken)
    expect(backups.some((item) => item.id === backup.id)).toBe(true)
  })

  test('REQ-BKP-08: corrupt backup handled safely', async ({ request }) => {
    const backup = await createBackupViaApi(request, adminToken, 'manual')
    createdBackupIds.push(backup.id)

    await fs.promises.unlink(backup.filePath)

    const restoreResult = await restoreBackupViaApi(request, backup.id, adminToken)
    expect(restoreResult.ok).toBe(false)
    expect(restoreResult.status).toBe(500)

    const suffix = uniqueSuffix()
    const member = await createMember(request, adminToken, {
      name: `E2E BKP08 ${suffix}`,
    })
    createdMemberIds.push(member.id)
    expect(member.id).toBeTruthy()

    await deleteBackupViaApi(request, backup.id, adminToken)
    const idx = createdBackupIds.indexOf(backup.id)
    if (idx >= 0) createdBackupIds.splice(idx, 1)
  })
})
