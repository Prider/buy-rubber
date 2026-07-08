import { type APIRequestContext } from '@playwright/test'

const e2ePort = process.env.PLAYWRIGHT_PORT ?? '3099'
export const E2E_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${e2ePort}`
const BASE = E2E_BASE_URL

/**
 * Returns an Authorization header using the admin token stored in localStorage
 * by auth.setup.ts. For API-level setup/teardown we call the API directly.
 *
 * Pass `request` (from Playwright's fixtures) and the stored token string.
 */
export function apiHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

/**
 * Fetches the admin auth token from the login API so teardown helpers can
 * call protected endpoints without needing a browser page.
 */
export async function getAdminToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { username: 'admin', password: 'admin123' },
  })
  const body = await res.json()
  return body.token as string
}

/**
 * Creates a member via the API.
 * Fetches the next available code first since the POST endpoint requires it.
 */
export async function createMember(
  request: APIRequestContext,
  token: string,
  data: { name: string; phone?: string }
): Promise<{ id: string; code: string; name: string }> {
  const codeRes = await request.get(`${BASE}/api/members/next-code`, {
    headers: apiHeaders(token),
  })
  const { code } = await codeRes.json()

  const createRes = await request.post(`${BASE}/api/members`, {
    headers: apiHeaders(token),
    data: { code, ...data },
  })
  return createRes.json()
}

/**
 * Deletes a member by ID via the API.
 */
export async function deleteMember(
  request: APIRequestContext,
  id: string,
  token: string
): Promise<void> {
  await request.delete(`${BASE}/api/members/${id}`, {
    headers: apiHeaders(token),
  })
}

/**
 * Deletes a sale by ID via the API.
 */
export async function deleteSale(
  request: APIRequestContext,
  id: string,
  token: string
): Promise<void> {
  await request.delete(`${BASE}/api/sales/${id}`, {
    headers: apiHeaders(token),
  })
}

/**
 * Deletes an expense by ID via the API.
 */
export async function deleteExpense(
  request: APIRequestContext,
  id: string,
  token: string
): Promise<void> {
  await request.delete(`${BASE}/api/expenses/${id}`, {
    headers: apiHeaders(token),
  })
}

/**
 * Deletes a user by ID via the API.
 */
export async function deleteUser(
  request: APIRequestContext,
  id: string,
  token: string
): Promise<void> {
  await request.delete(`${BASE}/api/users/${id}`, {
    headers: apiHeaders(token),
  })
}

/** Ensures the demo viewer account exists for login/RBAC tests. */
export async function ensureViewerUser(request: APIRequestContext): Promise<void> {
  const loginRes = await request.post(`${BASE}/api/auth/login`, {
    data: { username: 'demo', password: 'demo@123' },
  })
  if (loginRes.ok()) return

  const adminToken = await getAdminToken(request)
  const createRes = await request.post(`${BASE}/api/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { username: 'demo', password: 'demo@123', role: 'viewer' },
  })
  if (!createRes.ok() && createRes.status() !== 409) {
    throw new Error(`Failed to ensure demo viewer user: ${createRes.status()}`)
  }
}

/** Returns today's date string in YYYY-MM-DD format. */
export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Returns a unique suffix based on current timestamp for test data. */
export function uniqueSuffix(): string {
  return Date.now().toString().slice(-6)
}
