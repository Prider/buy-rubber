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
export type MemberRecord = {
  id: string
  code: string
  name: string
  phone?: string | null
  ownerPercent?: number
  tapperPercent?: number
  tapperName?: string | null
  advanceBalance?: number
  isActive?: boolean
}

export async function createMember(
  request: APIRequestContext,
  token: string,
  data: {
    name: string
    phone?: string
    ownerPercent?: number
    tapperPercent?: number
    tapperName?: string
  }
): Promise<MemberRecord> {
  const codeRes = await request.get(`${BASE}/api/members/next-code`, {
    headers: apiHeaders(token),
  })
  const { code } = await codeRes.json()

  const createRes = await request.post(`${BASE}/api/members`, {
    headers: apiHeaders(token),
    data: { code, ...data },
  })
  if (!createRes.ok()) {
    const body = await createRes.text()
    throw new Error(`Failed to create member: ${createRes.status()} ${body}`)
  }
  return createRes.json()
}

/** Fetches a member by ID via the API. */
export async function getMember(
  request: APIRequestContext,
  token: string,
  id: string
): Promise<MemberRecord> {
  const res = await request.get(`${BASE}/api/members/${id}`, {
    headers: apiHeaders(token),
  })
  if (!res.ok()) {
    throw new Error(`Failed to get member: ${res.status()}`)
  }
  return res.json()
}

/** Updates a member by ID via the API. */
export async function updateMember(
  request: APIRequestContext,
  token: string,
  id: string,
  data: Partial<MemberRecord> & { name: string }
): Promise<MemberRecord> {
  const res = await request.put(`${BASE}/api/members/${id}`, {
    headers: apiHeaders(token),
    data,
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Failed to update member: ${res.status()} ${body}`)
  }
  return res.json()
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

export type CreatedSale = {
  id: string
  saleNo: string
  totalAmount: number
  weight: number
  pricePerUnit: number
  expenseCost: number | null
  productTypeId: string
}

/** Creates a sale via the API. */
export async function createSale(
  request: APIRequestContext,
  token: string,
  data: {
    companyName: string
    productTypeId: string
    weight: number
    pricePerUnit: number
    date?: string
    sellingType?: string
    expenseType?: string | null
    expenseCost?: number | null
  }
): Promise<CreatedSale> {
  const res = await request.post(`${BASE}/api/sales`, {
    headers: apiHeaders(token),
    data: {
      date: data.date ?? todayDate(),
      companyName: data.companyName,
      productTypeId: data.productTypeId,
      weight: data.weight,
      pricePerUnit: data.pricePerUnit,
      sellingType: data.sellingType ?? 'จ่ายสด',
      expenseType: data.expenseType ?? null,
      expenseCost: data.expenseCost ?? null,
    },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Failed to create sale: ${res.status()} ${body}`)
  }
  return res.json() as Promise<CreatedSale>
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

/** Sums sale totalAmount for a date range via the sales API. */
export async function getSalesRevenueTotal(
  request: APIRequestContext,
  token: string,
  params: { startDate: string; endDate: string }
): Promise<number> {
  const qs = new URLSearchParams({ startDate: params.startDate, endDate: params.endDate })
  const res = await request.get(`${BASE}/api/sales?${qs.toString()}`, {
    headers: apiHeaders(token),
  })
  if (!res.ok()) {
    throw new Error(`Failed to get sales: ${res.status()}`)
  }
  const sales = (await res.json()) as Array<{ totalAmount: number }>
  return sales.reduce((sum, sale) => sum + (sale.totalAmount ?? 0), 0)
}

/** Fetches profit-loss report totals for a date range. */
export async function getProfitLossTotals(
  request: APIRequestContext,
  token: string,
  params: { startDate?: string; endDate?: string; view?: 'daily' | 'monthly' } = {}
): Promise<{ sales: number; purchases: number; expenses: number; net: number }> {
  const qs = new URLSearchParams()
  if (params.startDate) qs.set('startDate', params.startDate)
  if (params.endDate) qs.set('endDate', params.endDate)
  if (params.view) qs.set('view', params.view)

  const query = qs.toString()
  const res = await request.get(
    `${BASE}/api/reports/profit-loss${query ? `?${query}` : ''}`,
    { headers: apiHeaders(token) }
  )
  if (!res.ok()) {
    throw new Error(`Failed to get profit-loss report: ${res.status()}`)
  }
  const body = (await res.json()) as { totals: { sales: number; purchases: number; expenses: number; net: number } }
  return body.totals
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
 * Deletes a purchase by ID via the API.
 */
export async function deletePurchase(
  request: APIRequestContext,
  id: string,
  token: string
): Promise<void> {
  await request.delete(`${BASE}/api/purchases/${id}`, {
    headers: apiHeaders(token),
  })
}

/**
 * Deletes a service fee by ID via the API.
 */
export async function deleteServiceFee(
  request: APIRequestContext,
  id: string,
  token: string
): Promise<void> {
  await request.delete(`${BASE}/api/servicefees/${id}`, {
    headers: apiHeaders(token),
  })
}

/**
 * Sets daily prices for a date via the API.
 */
export async function setDailyPrices(
  request: APIRequestContext,
  token: string,
  prices: Array<{ productTypeId: string; price: number }>,
  date: string = todayDate()
): Promise<void> {
  const res = await request.post(`${BASE}/api/prices/daily`, {
    headers: apiHeaders(token),
    data: { date, prices },
  })
  if (!res.ok()) {
    throw new Error(`Failed to set daily prices: ${res.status()}`)
  }
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

/** Returns a date string offset by the given number of days from today. */
export function offsetDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export type CreatedPurchaseItem = {
  id: string
  purchaseNo: string
  totalAmount: number
  netWeight: number
  productTypeId: string
  memberId: string
}

export type CreatedPurchaseTransaction = {
  purchaseNo: string
  purchases: CreatedPurchaseItem[]
}

type PurchaseItemInput = {
  grossWeight: number
  containerWeight?: number
  pricePerUnit?: number
  productTypeId?: string
  memberId?: string
  date?: string
}

/** Creates a purchase transaction (single or multi-item batch) via the API. */
export async function createPurchaseTransaction(
  request: APIRequestContext,
  token: string,
  data: {
    memberId: string
    productTypeId: string
    date?: string
    items: PurchaseItemInput[]
  }
): Promise<CreatedPurchaseTransaction> {
  const date = data.date ?? todayDate()
  const res = await request.post(`${BASE}/api/purchases`, {
    headers: apiHeaders(token),
    data: {
      date,
      items: data.items.map((item) => ({
        memberId: item.memberId ?? data.memberId,
        productTypeId: item.productTypeId ?? data.productTypeId,
        date: item.date ?? date,
        grossWeight: item.grossWeight,
        containerWeight: item.containerWeight ?? 0,
        pricePerUnit: item.pricePerUnit,
      })),
    },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Failed to create purchase transaction: ${res.status()} ${body}`)
  }
  const body = (await res.json()) as CreatedPurchaseTransaction
  return body
}

type PurchaseTransactionQuery = {
  startDate?: string
  endDate?: string
  memberId?: string
  search?: string
  page?: number
  limit?: number
}

/** Fetches grouped purchase transactions from the API. */
export async function getPurchaseTransactions(
  request: APIRequestContext,
  token: string,
  params: PurchaseTransactionQuery = {}
): Promise<{
  transactions: Array<{
    purchaseNo: string
    totalAmount: number
    purchases: Array<{ id: string }>
    member: { id: string; name: string; code: string }
  }>
  pagination: { page: number; limit: number; total: number; totalPages: number }
}> {
  const qs = new URLSearchParams()
  if (params.startDate) qs.set('startDate', params.startDate)
  if (params.endDate) qs.set('endDate', params.endDate)
  if (params.memberId) qs.set('memberId', params.memberId)
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))

  const query = qs.toString()
  const res = await request.get(
    `${BASE}/api/purchases/transactions${query ? `?${query}` : ''}`,
    { headers: apiHeaders(token) }
  )
  if (!res.ok()) {
    throw new Error(`Failed to get purchase transactions: ${res.status()}`)
  }
  return res.json()
}

/** Updates a purchase record via the API. */
export async function updatePurchase(
  request: APIRequestContext,
  token: string,
  id: string,
  data: {
    memberId: string
    productTypeId: string
    date: string
    grossWeight: number
    containerWeight?: number
    pricePerUnit?: number
  }
): Promise<{ id: string; totalAmount: number; netWeight: number }> {
  const res = await request.put(`${BASE}/api/purchases/${id}`, {
    headers: apiHeaders(token),
    data: {
      ...data,
      containerWeight: data.containerWeight ?? 0,
    },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Failed to update purchase: ${res.status()} ${body}`)
  }
  return res.json()
}

/** Returns a unique suffix based on current timestamp for test data. */
export function uniqueSuffix(): string {
  return Date.now().toString().slice(-6)
}

export type SlipPaperSize = '58mm' | '80mm' | '104mm'

export type SlipSettings = {
  companyName: string
  companyAddress: string
  paperSize: SlipPaperSize
}

/** Fetches slip print settings from the API. */
export async function getSlipSettings(request: APIRequestContext): Promise<SlipSettings> {
  const res = await request.get(`${BASE}/api/slip/settings`)
  if (!res.ok()) {
    throw new Error(`Failed to get slip settings: ${res.status()}`)
  }
  return res.json() as Promise<SlipSettings>
}

/** Persists slip print settings (paper size, company info) via the API. */
export async function setSlipSettings(
  request: APIRequestContext,
  settings: Partial<SlipSettings> & { paperSize?: SlipPaperSize }
): Promise<SlipSettings> {
  const current = await getSlipSettings(request)
  const res = await request.post(`${BASE}/api/slip/settings`, {
    data: {
      companyName: settings.companyName ?? current.companyName,
      companyAddress: settings.companyAddress ?? current.companyAddress,
      paperSize: settings.paperSize ?? current.paperSize,
    },
  })
  if (!res.ok()) {
    throw new Error(`Failed to set slip settings: ${res.status()}`)
  }
  const body = (await res.json()) as SlipSettings
  return {
    companyName: body.companyName ?? settings.companyName ?? current.companyName,
    companyAddress: body.companyAddress ?? settings.companyAddress ?? current.companyAddress,
    paperSize: (body.paperSize ?? settings.paperSize ?? current.paperSize) as SlipPaperSize,
  }
}

type StockPositionRow = {
  productTypeId: string
  quantityKg: number
}

/** Returns current stock quantity (kg) for a product type. */
export async function getStockQuantity(
  request: APIRequestContext,
  productTypeId: string,
  token?: string
): Promise<number> {
  const res = await request.get(`${BASE}/api/stock/positions`, {
    headers: token ? apiHeaders(token) : undefined,
  })
  if (!res.ok()) {
    throw new Error(`Failed to get stock positions: ${res.status()}`)
  }
  const positions = (await res.json()) as StockPositionRow[]
  const row = positions.find((p) => p.productTypeId === productTypeId)
  return row?.quantityKg ?? 0
}

type ProductTypeRow = { id: string; code: string; name: string }

/** Finds an active product type by exact name, or creates one if missing. */
export async function findOrCreateProductType(
  request: APIRequestContext,
  token: string,
  data: { code: string; name: string; description?: string }
): Promise<ProductTypeRow> {
  const listRes = await request.get(`${BASE}/api/product-types`, {
    headers: apiHeaders(token),
  })
  if (!listRes.ok()) {
    throw new Error(`Failed to list product types: ${listRes.status()}`)
  }
  const types = (await listRes.json()) as ProductTypeRow[]
  const existing = types.find((t) => t.name === data.name || t.code === data.code)
  if (existing) return existing

  const createRes = await request.post(`${BASE}/api/product-types`, {
    headers: apiHeaders(token),
    data,
  })
  if (!createRes.ok()) {
    throw new Error(`Failed to create product type: ${createRes.status()}`)
  }
  return createRes.json() as Promise<ProductTypeRow>
}
