import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth.fixture'
import {
  apiHeaders,
  createMember,
  deleteMember,
  deleteUser,
  E2E_BASE_URL,
  ensureViewerUser,
  generateExpiredToken,
  getAdminToken,
  getStoredPasswordHash,
  getViewerToken,
  uniqueSuffix,
} from '../fixtures/data.fixture'

test.describe('Security requirements', () => {
  let adminToken: string
  let viewerToken: string
  let createdUserId: string | null = null
  const createdMemberIds: string[] = []

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request)
    await ensureViewerUser(request)
    viewerToken = await getViewerToken(request)
  })

  test.afterEach(async ({ request }) => {
    if (createdUserId) {
      await deleteUser(request, createdUserId, adminToken)
      createdUserId = null
    }
    while (createdMemberIds.length > 0) {
      const id = createdMemberIds.pop()!
      await deleteMember(request, id, adminToken)
    }
  })

  test('REQ-SEC-01: passwords stored hashed, never returned in API responses', async ({
    request,
  }) => {
    const suffix = uniqueSuffix()
    const username = `sechash${suffix}`
    const plainPassword = `HashTest@${suffix}`

    const createRes = await request.post(`${E2E_BASE_URL}/api/users`, {
      headers: apiHeaders(adminToken),
      data: { username, password: plainPassword, role: 'viewer' },
    })
    expect(createRes.status()).toBe(201)
    const created = await createRes.json()
    createdUserId = created.user?.id ?? created.id

    const storedHash = await getStoredPasswordHash(username)
    expect(storedHash).toBeTruthy()
    expect(storedHash).not.toBe(plainPassword)

    const loginRes = await request.post(`${E2E_BASE_URL}/api/auth/login`, {
      data: { slug: 'demo', username, password: plainPassword },
    })
    expect(loginRes.ok()).toBeTruthy()
    const loginBody = await loginRes.json()
    expect(loginBody.user?.password).toBeUndefined()
    expect(loginBody.token).toBeTruthy()

    const listRes = await request.get(`${E2E_BASE_URL}/api/users`, {
      headers: apiHeaders(adminToken),
    })
    expect(listRes.ok()).toBeTruthy()
    const listBody = await listRes.json()
    const listedUser = listBody.users?.find((u: { username: string }) => u.username === username)
    expect(listedUser).toBeTruthy()
    expect(listedUser.password).toBeUndefined()
  })

  test('REQ-SEC-02: expired JWT requires re-login', async ({ page, request }) => {
    const loginRes = await request.post(`${E2E_BASE_URL}/api/auth/login`, {
      data: { slug: 'demo', username: 'admin', password: 'admin123' },
    })
    const loginBody = await loginRes.json()
    const expiredToken = generateExpiredToken({
      userId: loginBody.user.id,
      username: loginBody.user.username,
      role: loginBody.user.role,
    })

    await page.goto('/login')
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(user))
      },
      { token: expiredToken, user: loginBody.user }
    )

    try {
      await page.goto('/dashboard')
    } catch {
      // redirectToLogin() aborts the in-flight dashboard navigation
    }
    await expect(page).toHaveURL('/login')

    const tokenAfterRedirect = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(tokenAfterRedirect).toBeNull()

    const protectedRes = await request.post(`${E2E_BASE_URL}/api/purchases`, {
      headers: apiHeaders(expiredToken),
      data: { items: [] },
    })
    expect(protectedRes.status()).toBe(401)
  })

  test('REQ-SEC-03: protected APIs require authentication', async ({ request }) => {
    const unauthenticatedCases = [
      {
        label: 'GET /api/users',
        call: () => request.get(`${E2E_BASE_URL}/api/users`),
      },
      {
        label: 'POST /api/users',
        call: () =>
          request.post(`${E2E_BASE_URL}/api/users`, {
            data: { username: 'blocked', password: 'Blocked@123', role: 'viewer' },
          }),
      },
      {
        label: 'POST /api/purchases',
        call: () =>
          request.post(`${E2E_BASE_URL}/api/purchases`, {
            data: { items: [] },
          }),
      },
      {
        label: 'POST /api/sales',
        call: () =>
          request.post(`${E2E_BASE_URL}/api/sales`, {
            data: { companyName: 'Test Co', productTypeId: 'x', weight: 1, pricePerUnit: 1 },
          }),
      },
      {
        label: 'POST /api/expenses',
        call: () =>
          request.post(`${E2E_BASE_URL}/api/expenses`, {
            data: { category: 'ค่าน้ำมัน', amount: 100, date: '2024-01-01' },
          }),
      },
    ]

    for (const { label, call } of unauthenticatedCases) {
      const res = await call()
      expect([401, 403], `${label} should reject unauthenticated access`).toContain(res.status())
    }
  })

  test('REQ-SEC-04: viewer cannot perform admin write operations', async ({
    request,
    browser,
  }) => {
    const suffix = uniqueSuffix()
    const blockedUsername = `viewerblock${suffix}`

    const createRes = await request.post(`${E2E_BASE_URL}/api/users`, {
      headers: apiHeaders(viewerToken),
      data: { username: blockedUsername, password: 'Blocked@123', role: 'viewer' },
    })
    expect(createRes.status()).toBe(403)

    const listRes = await request.get(`${E2E_BASE_URL}/api/users`, {
      headers: apiHeaders(viewerToken),
    })
    expect(listRes.status()).toBe(403)

    const adminListRes = await request.get(`${E2E_BASE_URL}/api/users`, {
      headers: apiHeaders(adminToken),
    })
    expect(adminListRes.ok()).toBeTruthy()
    const adminUsers = await adminListRes.json()
    const targetUser = adminUsers.users?.[0]
    expect(targetUser?.id).toBeTruthy()

    const updateRes = await request.put(`${E2E_BASE_URL}/api/users/${targetUser.id}`, {
      headers: apiHeaders(viewerToken),
      data: { role: 'admin' },
    })
    expect(updateRes.status()).toBe(403)

    const deleteRes = await request.delete(`${E2E_BASE_URL}/api/users/${targetUser.id}`, {
      headers: apiHeaders(viewerToken),
    })
    expect(deleteRes.status()).toBe(403)

    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAs(page, 'demo', 'demo@123')
    await page.goto('/admin')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('tab', { name: 'ผู้ใช้งาน' })).not.toBeVisible()
    await context.close()
  })

  test('REQ-SEC-05: ORM parameterizes input — SQL injection treated as literal text', async ({
    request,
  }) => {
    const suffix = uniqueSuffix()
    const injection = `' OR 1=1 -- ${suffix}`
    const safeName = `E2E SEC05 ${suffix}`

    const allMembersRes = await request.get(`${E2E_BASE_URL}/api/members?limit=100`, {
      headers: apiHeaders(adminToken),
    })
    expect(allMembersRes.ok()).toBeTruthy()
    const allMembersBody = await allMembersRes.json()
    const totalMembers = allMembersBody.members?.length ?? 0
    expect(totalMembers).toBeGreaterThan(0)

    const searchRes = await request.get(
      `${E2E_BASE_URL}/api/members?search=${encodeURIComponent(injection)}`,
      { headers: apiHeaders(adminToken) }
    )
    expect(searchRes.ok()).toBeTruthy()
    const searchBody = await searchRes.json()
    expect(searchBody.members?.length ?? 0).toBeLessThan(totalMembers)

    const created = await createMember(request, adminToken, { name: safeName })
    createdMemberIds.push(created.id)

    const literalSearchRes = await request.get(
      `${E2E_BASE_URL}/api/members?search=${encodeURIComponent(injection)}`,
      { headers: apiHeaders(adminToken) }
    )
    expect(literalSearchRes.ok()).toBeTruthy()
    const literalSearchBody = await literalSearchRes.json()
    const leakedNames = (literalSearchBody.members ?? []).map((m: { name: string }) => m.name)
    expect(leakedNames).not.toContain(safeName)
  })
})
