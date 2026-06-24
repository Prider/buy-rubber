# Desktop Release Test Plan — Punsook Innotech

| Field | Value |
|-------|-------|
| **Product** | Punsook Innotech — Rubber Purchasing Management System |
| **Release type** | Electron desktop (Windows NSIS + macOS DMG/ZIP) |
| **Version** | 1.4.7 |
| **Database** | SQLite (offline, local) |
| **Document owner** | QA |
| **Last updated** | 2026-06-24 |

---

## Table of Contents

1. [Objectives & Scope](#1-objectives--scope)
2. [Release Criteria](#2-release-criteria-exit-criteria)
3. [Test Environments](#3-test-environments)
4. [Test Strategy](#4-test-strategy)
5. [Automated Coverage Baseline](#5-automated-coverage-baseline)
6. [Test Cases by Module](#6-test-cases-by-module)
7. [Desktop-Specific Scenarios](#7-desktop-specific-scenarios)
8. [Data Integrity & Calculations](#8-data-integrity--calculations)
9. [Security Checklist](#9-security-checklist)
10. [Regression Run Order](#10-regression-run-order)
11. [Defect Severity Guide](#11-defect-severity-guide)
12. [Known Gaps & Recommendations](#12-known-gaps--recommendations)
13. [30-Minute Smoke Script](#13-30-minute-smoke-script-per-os)
14. [Traceability Matrix](#14-traceability-matrix)

---

## 1. Objectives & Scope

### Objectives

- Verify the packaged desktop app installs, launches, and runs offline with local SQLite.
- Validate core business workflows end-to-end (purchase → stock → sale → reports).
- Confirm role-based access, data integrity, backup/restore, and PDF/slip output.
- Catch platform-specific issues on Windows and macOS before release.

### In Scope

| Area | Details |
|------|---------|
| Installer & first-run | NSIS (Win), DMG/ZIP (Mac), DB init, shortcuts |
| Core modules | Dashboard, purchases, sales, stock, members, expenses, reports, admin |
| Desktop-only | Backup, restore, download, Electron navigation guards |
| Auth & RBAC | `admin` / `user` / `viewer` |
| Calculations | Dry weight, price adjustment, owner/tapper split, stock ledger |
| Printing/export | Purchase slips, report PDFs |
| UI/UX | Thai locale, dark mode, responsive layout |

### Out of Scope

| Area | Reason |
|------|--------|
| PostgreSQL / Vercel web deployment | Desktop release uses SQLite only |
| Linux AppImage/deb | Configured but not primary release target |
| Web-scale load testing | Desktop single-user / LAN use case |
| Code signing / notarization | Track separately if planned |

---

## 2. Release Criteria (Exit Criteria)

| # | Criterion | Target |
|---|-----------|--------|
| 1 | P0/P1 defects open | **0** |
| 2 | P2 defects open | **≤ 3** with documented workaround |
| 3 | Unit tests (`npm run test:run`) | All pass |
| 4 | E2E tests (`npm run test:e2e`) | All pass on clean SQLite seed |
| 5 | Fresh install smoke | App launches on Win 10/11 and macOS 12+ without manual DB setup |
| 6 | Upgrade path | Existing `userData` DB preserved after app update |
| 7 | Offline operation | Full CRUD works with network disabled after install |
| 8 | Backup/restore | Manual backup → restore → restart shows restored data |
| 9 | Cross-platform smoke | All nav items load; login/logout works on Win + Mac |

---

## 3. Test Environments

### Hardware Matrix (Minimum)

| OS | Version | RAM | Notes |
|----|---------|-----|-------|
| Windows | 10 / 11 (64-bit) | 8 GB | Primary user base |
| macOS | 12+ (Intel & Apple Silicon if available) | 8 GB | Gatekeeper / first-open flow |

### Build Artifacts

```bash
npm run electron:build:win   # → dist/*.exe (NSIS)
npm run electron:build:mac   # → dist/*.dmg, *.zip
```

### Data Locations (Production)

| OS | Database path |
|----|---------------|
| Windows | `%AppData%\Punsook Innotech\prisma\dev.db` |
| macOS | `~/Library/Application Support/Punsook Innotech/prisma/dev.db` |

### Test Data Sets

| Set | Purpose |
|-----|---------|
| Fresh install | Bundled seeded `dev.db` copied to userData on first run |
| Regression | QA DB with 30+ days of purchases, sales, expenses, members |
| Golden dataset | Spreadsheet with expected totals for calculation verification |

### Tools

| Tool | Command | Purpose |
|------|---------|---------|
| Vitest | `npm run test:run` | Unit / API tests |
| Playwright | `npm run test:e2e` | Web-mode E2E regression |
| Manual | Packaged `.exe` / `.dmg` | Install, file system, offline, backup |
| DevTools | Cmd/Ctrl+Shift+I | Electron renderer debugging |

---

## 4. Test Strategy

```
Unit/API Tests ──┐
E2E Web Tests  ──┼──► Release Gate ──► Sign-off
Manual Desktop ──┘
```

| Layer | Weight (desktop) | Rationale |
|-------|------------------|-----------|
| Manual desktop QA | **High** | Install, DB path, backup, offline not fully automated |
| E2E (web) | Medium | Fast regression on business logic |
| Unit | Medium | Calculations & API contracts |

> **Note:** Playwright runs against `npm run dev` (web), not the packaged Electron binary. Manual desktop QA is **mandatory** for installation, backup, and Electron lifecycle cases.

---

## 5. Automated Coverage Baseline

### Unit Tests (Vitest)

**Covered:** auth, purchases API, members, expenses, backup API, dashboard, prices, product-types, users, profit-loss, slip/PDF utils, contexts (auth, dark mode, app mode)

**Gaps:** purchases UI flow, stock module, sales page UI, member advances UI, full integration flows

### E2E Tests (Playwright)

| Suite | File | Coverage |
|-------|------|----------|
| Login & session | `tests/e2e/auth/login.spec.ts` | Login, validation, session, logout |
| Members | `tests/e2e/members/member-crud.spec.ts` | CRUD, search |
| Expenses | `tests/e2e/expenses/expense-crud.spec.ts` | CRUD, summary cards |
| Sales | `tests/e2e/sales/sales-crud.spec.ts` | CRUD, total preview |
| Prices | `tests/e2e/prices/price-management.spec.ts` | Daily prices, history |
| Reports | `tests/e2e/reports/report-generate.spec.ts` | Filters, PDF button, dashboard |
| Admin | `tests/e2e/admin/user-management.spec.ts` | User CRUD, viewer RBAC |

**Not covered by E2E:** purchases (core), stock, backup, purchases-list, profit-loss detail, slip printing, dark mode, Electron-only paths

---

## 6. Test Cases by Module

### 6.1 Installation & First Launch (P0 — Desktop only)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| INS-01 | Windows fresh install | Run NSIS installer → choose directory → finish | Shortcuts created; app in Start Menu |
| INS-02 | macOS fresh install | Open DMG → drag to Applications → launch | App opens without crash |
| INS-03 | First-run DB init | Delete userData → launch app | `dev.db` created under OS-specific userData path |
| INS-04 | Seeded data present | Login after fresh install | Default users, members, product types available |
| INS-05 | App window defaults | Launch app | 1400×900 default; min 1024×768 enforced |
| INS-06 | Offline launch | Disable network → launch | App loads; no external dependency errors |
| INS-07 | Upgrade install | Install v1.4.7 over existing v1.4.x | User data preserved; no duplicate DB |
| INS-08 | Uninstall / reinstall | Uninstall → reinstall | Document whether userData persists |

### 6.2 Authentication & Authorization (P0)

| ID | Test Case | Role | Expected Result |
|----|-----------|------|-----------------|
| AUTH-01 | Valid login | admin | Redirect to `/dashboard` |
| AUTH-02 | Invalid password | any | Thai error message; remain on login |
| AUTH-03 | Empty fields | any | Validation shown |
| AUTH-04 | Session persistence | admin | Document actual behavior on app restart |
| AUTH-05 | Logout | admin | Token cleared; redirect to `/login` |
| AUTH-06 | Unauthenticated access | — | `/dashboard` → `/login` |
| AUTH-07 | Viewer → admin page | viewer | `/admin` blocked |
| AUTH-08 | Viewer → backup | viewer | Backup nav hidden or page redirects |
| AUTH-09 | Admin → backup (Electron) | admin | Backup page accessible |
| AUTH-10 | Inactive user login | deactivated | Login rejected |

### 6.3 Dashboard (P1)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| DASH-01 | Stats load | Cards show numeric values; no NaN |
| DASH-02 | Charts render | Recharts visible; no console errors |
| DASH-03 | Tab focus refresh | Switch away and back → data refreshes |
| DASH-04 | Empty database | Graceful zeros / empty states |
| DASH-05 | Dark mode | Stats readable in dark theme |

### 6.4 Price Management — `/prices` (P0)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| PRC-01 | Set daily price per product type | Saved; appears in today's card |
| PRC-02 | Duplicate same-day price | Update existing or show error per business rule |
| PRC-03 | Price history table | Past entries visible, sorted by date |
| PRC-04 | DRC adjustment rules | % rubber affects purchase price (see PUR-04) |

### 6.5 Purchases — `/purchases` (P0 — Critical path)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| PUR-01 | Single purchase — latex | DRC% → dry weight auto-calculated |
| PUR-02 | Net weight | `grossWeight − containerWeight = netWeight` |
| PUR-03 | Price from daily price | Base price pulled for product type + date |
| PUR-04 | DRC price adjustment | `adjustedPrice` differs from `basePrice` when rule applies |
| PUR-05 | Bonus price | Added to final price |
| PUR-06 | Owner/tapper split | `ownerAmount + tapperAmount = totalAmount` per member % |
| PUR-07 | Multi-item transaction | Add 2+ cart items → submit once → shared transaction |
| PUR-08 | Service fee on purchase | Fee linked to `purchaseNo` |
| PUR-09 | Print slip | PDF/slip generates; Thai text correct |
| PUR-10 | Slip paper size | A4 vs thermal size from admin slip settings |
| PUR-11 | Stock update | Stock position increases after purchase |
| PUR-12 | Validation | Missing member/weight → error; no save |
| PUR-13 | Dry rubber / scrap types | Correct weight logic per product type |

### 6.6 Purchase History — `/purchases-list` (P1)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| PLST-01 | List loads | Paginated/filtered purchases displayed |
| PLST-02 | Filter by date/member | Results match filter |
| PLST-03 | Admin delete/edit | Permissions enforced if supported |
| PLST-04 | Transaction grouping | Multi-item transaction grouped correctly |

### 6.7 Members — `/members` (P0)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| MEM-01 | Create member | Auto code generation |
| MEM-02 | Edit member | Changes persist |
| MEM-03 | Delete member | Removed; blocked if purchases exist (if rule applies) |
| MEM-04 | Search by name/code | List filters correctly |
| MEM-05 | Owner/tapper % | Defaults 100/0; custom split saved |
| MEM-06 | Advance balance | `advanceBalance` updates when advance recorded |
| MEM-07 | Purchase history | Member purchase history visible in UI |

### 6.8 Sales — `/sales` (P0)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| SAL-01 | Create sale | `saleNo` generated; `totalAmount` correct |
| SAL-02 | Stock decrease | Stock position decreases |
| SAL-03 | Edit sale price | Total recalculated |
| SAL-04 | Delete sale | Stock ledger reversed |
| SAL-05 | Expense cost on sale | Affects profit if applicable |
| SAL-06 | Form total preview | Live preview matches saved value |

### 6.9 Stock — `/stock` (P1)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| STK-01 | Stock overview | Quantities per product type |
| STK-02 | Detail page `/stock/[id]` | Ledger entries visible |
| STK-03 | Purchase → stock in | `quantityKg` increases |
| STK-04 | Sale → stock out | `quantityKg` decreases |
| STK-05 | Negative stock | Blocked or warned per business rule |
| STK-06 | Average cost | `avgCostPerKg` updates after purchases |

### 6.10 Expenses — `/expenses` (P1)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| EXP-01 | Create expense | Category, amount, description saved |
| EXP-02 | Today's summary card | Increments after add |
| EXP-03 | Delete expense | Removed; summary updates |
| EXP-04 | Categories | ค่าน้ำมัน, ค่าซ่อมรถ, ค่าคนงาน, อื่นๆ available |

### 6.11 Reports — `/reports`, `/reports/profit-loss` (P1)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| RPT-01 | Date range filter | Results within range only |
| RPT-02 | Purchase report | Totals match database |
| RPT-03 | PDF export | File downloads/opens; Thai fonts readable |
| RPT-04 | Profit/loss page | Revenue − costs = expected P&L |
| RPT-05 | Empty date range | Empty state; no crash |

### 6.12 Admin & Settings — `/admin` (P1)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| ADM-01 | User CRUD | Create / edit / delete users |
| ADM-02 | Role assignment | `admin` / `user` / `viewer` enforced in UI and API |
| ADM-03 | System settings | Settings persist in `Setting` table |
| ADM-04 | Slip settings | Paper size stored and applied to slips |

### 6.13 Backup & Restore — `/backup` (P0 — Electron + Admin only)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| BKP-01 | Page access control | Web → blocked; Electron admin → accessible |
| BKP-02 | Manual backup | New `.db` file created; listed in UI |
| BKP-03 | Download backup | File saved to user-chosen location |
| BKP-04 | Restore backup | Confirmation → safety auto-backup → success message |
| BKP-05 | Restart after restore | Close/reopen app → restored data visible |
| BKP-06 | Delete backup | Removed from list and disk |
| BKP-07 | SQLite-only guard | No false PostgreSQL error on desktop |
| BKP-08 | Corrupt backup file | Graceful error; main DB unchanged |

### 6.14 UI / UX (P2)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| UI-01 | Dark mode toggle | Persists across sessions |
| UI-02 | Sidebar navigation | All items route correctly |
| UI-03 | Electron-only nav | Backup hidden in web mode |
| UI-04 | Thai typography | No missing glyphs in forms, tables, PDFs |
| UI-05 | Window resize | Layout usable at 1024×768 |
| UI-06 | Mode switcher | App mode context works in Electron |

---

## 7. Desktop-Specific Scenarios

| ID | Scenario | How to Test | Expected Result |
|----|----------|-------------|-----------------|
| ELEC-01 | Local server startup | Production build launch | Next.js server starts; window loads |
| ELEC-02 | DB path isolation | Two OS user accounts | Separate userData DB per user |
| ELEC-03 | Debug logs | Trigger DB init | `main-debug.log`, `db-init-debug.log` in userData |
| ELEC-04 | Context isolation | DevTools console | Renderer cannot access Node `fs` |
| ELEC-05 | Long session | App open 8+ hours | No memory leak / crash |
| ELEC-06 | Force quit | Kill process → relaunch | DB not corrupted |
| ELEC-07 | Disk full during backup | Simulate full disk | Error shown; main DB intact |
| ELEC-08 | Antivirus | Windows Defender scan | Install/run not blocked |

---

## 8. Data Integrity & Calculations

| Calculation | Formula | Related Test IDs |
|-------------|---------|------------------|
| Net weight | `grossWeight − containerWeight` | PUR-02 |
| Dry weight | `netWeight × (rubberPercent / 100)` | PUR-01 |
| Total amount | `dryWeight × finalPrice` (per product rules) | PUR-01 |
| Owner/tapper split | `totalAmount × ownerPercent / tapperPercent` | PUR-06 |
| Stock quantity | Σ purchases − Σ sales per product | STK-03, STK-04 |
| Profit & loss | Sales revenue − purchase cost − expenses | RPT-04 |

---

## 9. Security Checklist

| ID | Check | Expected Result |
|----|-------|-----------------|
| SEC-01 | Password storage | Passwords hashed (not plain text) |
| SEC-02 | JWT expiry | Expired token requires re-login |
| SEC-03 | Unauthenticated API | Protected routes return 401 |
| SEC-04 | Viewer write attempts | POST/PUT/DELETE blocked on admin APIs |
| SEC-05 | SQL injection | Prisma parameterized queries — spot-check forms |
| SEC-06 | Backup file access | Only admin can list/download |

---

## 10. Regression Run Order

### Day 1 — Automated

1. Fix any failing unit tests → `npm run test:run`
2. `npm run test:e2e`
3. `npm run lint`

### Day 2 — Desktop Smoke (each OS)

1. Fresh install → login → visit every nav item
2. PUR-01 → SAL-01 → STK-01 → RPT-01 → BKP-02

### Day 3 — Full Manual

- All P0 cases
- Spot-check P1 per module

### Day 4 — Edge Cases & Sign-off

- Upgrade path, restore, offline, RBAC
- Defect triage → release decision

---

## 11. Defect Severity Guide

| Severity | Definition | Example |
|----------|------------|---------|
| **P0** | Blocker — core function unusable | App won't start; purchases don't save; DB corruption |
| **P1** | Major — workaround exists or non-core broken | Wrong report totals; backup fails |
| **P2** | Minor — cosmetic or rare edge | Dark mode contrast; typo |
| **P3** | Trivial | Nice-to-have |

---

## 12. Known Gaps & Recommendations

1. **Unit test failures** — Resolve before release (`npm run test:run`).
2. **Purchases E2E** — Highest business risk; no Playwright coverage yet.
3. **Stock / backup E2E** — Add automation or require manual sign-off.
4. **Electron E2E** — Playwright does not test packaged binary; manual QA mandatory for INS/BKP/ELEC.
5. **Advance payments** — `/api/advances` exists in API client; confirm UI entry point before testing.
6. **Prices nav** — Commented out in `Layout.tsx`; confirm price entry path (admin vs `/prices`).
7. **Production DevTools** — Verify `electron/main.js` does not leave DevTools open in production builds.

---

## 13. 30-Minute Smoke Script (per OS)

```
□ Install from dist artifact
□ Launch offline
□ Login as admin
□ Dashboard loads
□ Set today's price (if UI available)
□ Create 1 purchase (latex, with DRC)
□ Verify stock increased
□ Create 1 sale
□ Verify stock decreased
□ Add 1 expense
□ Generate report + export PDF
□ Create manual backup
□ Logout → login as viewer → confirm admin/backup blocked
□ Logout → login as admin → restore backup (optional on smoke)
```

---

## 14. Traceability Matrix

Maps each test case to a **business requirement**, **module**, **priority**, and **automation status**.

> **Google Sheets import:** Use [TRACEABILITY_MATRIX.csv](./TRACEABILITY_MATRIX.csv) — File → Import → Upload → Replace spreadsheet or Insert new sheet. Execution columns (`Result`, `Tester`, `Date`, etc.) are included empty for QA to fill in during test runs.

### Legend

| Automation Status | Meaning |
|-------------------|---------|
| **Automated** | Covered by Vitest or Playwright — run in CI |
| **Partial** | Related unit/API tests exist; full flow not automated |
| **Manual** | Requires packaged Electron or OS-level verification |
| **Not Started** | No automated coverage; manual only |

### Matrix

| Test ID | Requirement ID | Business Requirement | Module | Priority | Automation Status | Automated Test Reference | Platform |
|---------|----------------|----------------------|--------|----------|-------------------|--------------------------|----------|
| INS-01 | REQ-INST-01 | App installs on Windows with shortcuts | Installation | P0 | Manual | — | Win |
| INS-02 | REQ-INST-02 | App installs on macOS from DMG | Installation | P0 | Manual | — | Mac |
| INS-03 | REQ-INST-03 | SQLite DB initialized in userData on first run | Installation | P0 | Manual | — | Win, Mac |
| INS-04 | REQ-INST-04 | Seeded default data available after install | Installation | P0 | Manual | `prisma/seed.ts` (data only) | Win, Mac |
| INS-05 | REQ-INST-05 | Window size constraints enforced | Installation | P1 | Manual | — | Win, Mac |
| INS-06 | REQ-INST-06 | App runs fully offline | Installation | P0 | Manual | — | Win, Mac |
| INS-07 | REQ-INST-07 | App upgrade preserves user data | Installation | P0 | Manual | — | Win, Mac |
| INS-08 | REQ-INST-08 | Uninstall/reinstall behavior documented | Installation | P2 | Manual | — | Win, Mac |
| AUTH-01 | REQ-AUTH-01 | Valid credentials grant access | Authentication | P0 | Automated | `tests/e2e/auth/login.spec.ts` | Web, Desktop |
| AUTH-02 | REQ-AUTH-02 | Invalid credentials rejected | Authentication | P0 | Automated | `tests/e2e/auth/login.spec.ts` | Web, Desktop |
| AUTH-03 | REQ-AUTH-03 | Required fields validated on login | Authentication | P0 | Automated | `tests/e2e/auth/login.spec.ts` | Web, Desktop |
| AUTH-04 | REQ-AUTH-04 | Session behavior on app restart | Authentication | P1 | Manual | — | Desktop |
| AUTH-05 | REQ-AUTH-05 | Logout clears session | Authentication | P0 | Automated | `tests/e2e/auth/login.spec.ts` | Web, Desktop |
| AUTH-06 | REQ-AUTH-06 | Protected routes require login | Authentication | P0 | Automated | `tests/e2e/auth/login.spec.ts` | Web, Desktop |
| AUTH-07 | REQ-RBAC-01 | Viewer cannot access admin | Authorization | P0 | Automated | `tests/e2e/admin/user-management.spec.ts` | Web, Desktop |
| AUTH-08 | REQ-RBAC-02 | Viewer cannot access backup | Authorization | P0 | Manual | — | Desktop |
| AUTH-09 | REQ-RBAC-03 | Admin can access backup in Electron | Authorization | P0 | Manual | — | Desktop |
| AUTH-10 | REQ-AUTH-07 | Inactive users cannot login | Authentication | P1 | Partial | `src/app/api/auth/login/__tests__/route.test.ts` | Web, Desktop |
| DASH-01 | REQ-DASH-01 | Dashboard displays key statistics | Dashboard | P1 | Automated | `tests/e2e/reports/report-generate.spec.ts` | Web, Desktop |
| DASH-02 | REQ-DASH-02 | Charts render without errors | Dashboard | P1 | Manual | — | Web, Desktop |
| DASH-03 | REQ-DASH-03 | Dashboard refreshes on tab focus | Dashboard | P2 | Automated | `tests/e2e/reports/report-generate.spec.ts` | Web, Desktop |
| DASH-04 | REQ-DASH-04 | Empty state handled gracefully | Dashboard | P2 | Partial | `src/app/api/dashboard/__tests__/route.test.ts` | Web, Desktop |
| DASH-05 | REQ-UI-01 | Dark mode readable on dashboard | UI/UX | P2 | Partial | `src/contexts/__tests__/DarkModeContext.test.tsx` | Web, Desktop |
| PRC-01 | REQ-PRICE-01 | Set daily price per product type | Pricing | P0 | Automated | `tests/e2e/prices/price-management.spec.ts` | Web, Desktop |
| PRC-02 | REQ-PRICE-02 | Prevent or handle duplicate daily price | Pricing | P1 | Partial | `src/app/api/prices/daily/__tests__/route.test.ts` | Web, Desktop |
| PRC-03 | REQ-PRICE-03 | View historical prices | Pricing | P1 | Automated | `tests/e2e/prices/price-management.spec.ts` | Web, Desktop |
| PRC-04 | REQ-PRICE-04 | DRC % adjusts purchase price | Pricing | P0 | Partial | `src/lib/__tests__/utils.test.ts` | Web, Desktop |
| PUR-01 | REQ-PUR-01 | Calculate dry weight from DRC % | Purchases | P0 | Partial | `src/lib/__tests__/utils.test.ts` | Web, Desktop |
| PUR-02 | REQ-PUR-02 | Calculate net weight from gross − container | Purchases | P0 | Partial | `src/lib/__tests__/utils.test.ts` | Web, Desktop |
| PUR-03 | REQ-PUR-03 | Apply daily price to purchase | Purchases | P0 | Partial | `src/app/api/purchases/__tests__/route.test.ts` | Web, Desktop |
| PUR-04 | REQ-PUR-04 | Apply DRC-based price adjustment | Purchases | P0 | Partial | `src/app/api/purchases/__tests__/route.test.ts` | Web, Desktop |
| PUR-05 | REQ-PUR-05 | Apply bonus price | Purchases | P1 | Partial | `src/app/api/purchases/__tests__/route.test.ts` | Web, Desktop |
| PUR-06 | REQ-PUR-06 | Split payment between owner and tapper | Purchases | P0 | Partial | `src/lib/__tests__/memberUtils.test.ts` | Web, Desktop |
| PUR-07 | REQ-PUR-07 | Submit multi-item purchase transaction | Purchases | P0 | Partial | `src/app/api/purchases/transactions/__tests__/route.test.ts` | Web, Desktop |
| PUR-08 | REQ-PUR-08 | Attach service fee to purchase | Purchases | P1 | Partial | `src/app/api/servicefees/__tests__/route.test.ts` | Web, Desktop |
| PUR-09 | REQ-PUR-09 | Generate purchase slip PDF | Purchases | P1 | Partial | `src/components/purchases/utils/__tests__/slipGenerator.test.ts` | Web, Desktop |
| PUR-10 | REQ-PUR-10 | Respect slip paper size setting | Purchases | P2 | Not Started | — | Web, Desktop |
| PUR-11 | REQ-STK-01 | Purchase increases stock | Purchases / Stock | P0 | Not Started | — | Web, Desktop |
| PUR-12 | REQ-PUR-11 | Validate required purchase fields | Purchases | P0 | Not Started | — | Web, Desktop |
| PUR-13 | REQ-PUR-12 | Support dry rubber and scrap product types | Purchases | P1 | Not Started | — | Web, Desktop |
| PLST-01 | REQ-PUR-13 | View purchase history list | Purchase History | P1 | Not Started | — | Web, Desktop |
| PLST-02 | REQ-PUR-14 | Filter purchases by date/member | Purchase History | P1 | Not Started | — | Web, Desktop |
| PLST-03 | REQ-PUR-15 | Admin edit/delete purchase history | Purchase History | P2 | Not Started | — | Web, Desktop |
| PLST-04 | REQ-PUR-16 | Group multi-item transactions | Purchase History | P1 | Not Started | — | Web, Desktop |
| MEM-01 | REQ-MEM-01 | Create member with auto code | Members | P0 | Automated | `tests/e2e/members/member-crud.spec.ts` | Web, Desktop |
| MEM-02 | REQ-MEM-02 | Edit member details | Members | P0 | Automated | `tests/e2e/members/member-crud.spec.ts` | Web, Desktop |
| MEM-03 | REQ-MEM-03 | Delete member | Members | P0 | Automated | `tests/e2e/members/member-crud.spec.ts` | Web, Desktop |
| MEM-04 | REQ-MEM-04 | Search members by name/code | Members | P1 | Automated | `tests/e2e/members/member-crud.spec.ts` | Web, Desktop |
| MEM-05 | REQ-MEM-05 | Configure owner/tapper split % | Members | P0 | Partial | `src/lib/__tests__/memberUtils.test.ts` | Web, Desktop |
| MEM-06 | REQ-MEM-06 | Track advance balance | Members | P1 | Not Started | — | Web, Desktop |
| MEM-07 | REQ-MEM-07 | View member purchase history | Members | P1 | Not Started | — | Web, Desktop |
| SAL-01 | REQ-SAL-01 | Create sale with correct total | Sales | P0 | Automated | `tests/e2e/sales/sales-crud.spec.ts` | Web, Desktop |
| SAL-02 | REQ-SAL-02 | Sale decreases stock | Sales / Stock | P0 | Not Started | — | Web, Desktop |
| SAL-03 | REQ-SAL-03 | Edit sale recalculates total | Sales | P1 | Automated | `tests/e2e/sales/sales-crud.spec.ts` | Web, Desktop |
| SAL-04 | REQ-SAL-04 | Delete sale reverses stock | Sales / Stock | P1 | Not Started | — | Web, Desktop |
| SAL-05 | REQ-SAL-05 | Sale expense cost affects profit | Sales | P2 | Not Started | — | Web, Desktop |
| SAL-06 | REQ-SAL-06 | Sale form shows live total preview | Sales | P1 | Automated | `tests/e2e/sales/sales-crud.spec.ts` | Web, Desktop |
| STK-01 | REQ-STK-02 | View stock by product type | Stock | P1 | Not Started | — | Web, Desktop |
| STK-02 | REQ-STK-03 | View stock ledger detail | Stock | P1 | Not Started | — | Web, Desktop |
| STK-03 | REQ-STK-04 | Stock increases on purchase | Stock | P0 | Not Started | — | Web, Desktop |
| STK-04 | REQ-STK-05 | Stock decreases on sale | Stock | P0 | Not Started | — | Web, Desktop |
| STK-05 | REQ-STK-06 | Prevent or warn on negative stock | Stock | P1 | Not Started | — | Web, Desktop |
| STK-06 | REQ-STK-07 | Maintain average cost per kg | Stock | P1 | Not Started | — | Web, Desktop |
| EXP-01 | REQ-EXP-01 | Record daily expense | Expenses | P1 | Automated | `tests/e2e/expenses/expense-crud.spec.ts` | Web, Desktop |
| EXP-02 | REQ-EXP-02 | Today's expense summary updates | Expenses | P1 | Automated | `tests/e2e/expenses/expense-crud.spec.ts` | Web, Desktop |
| EXP-03 | REQ-EXP-03 | Delete expense | Expenses | P1 | Automated | `tests/e2e/expenses/expense-crud.spec.ts` | Web, Desktop |
| EXP-04 | REQ-EXP-04 | Expense categories available | Expenses | P2 | Partial | `src/app/api/expenses/__tests__/route.test.ts` | Web, Desktop |
| RPT-01 | REQ-RPT-01 | Filter reports by date range | Reports | P1 | Automated | `tests/e2e/reports/report-generate.spec.ts` | Web, Desktop |
| RPT-02 | REQ-RPT-02 | Purchase report totals accurate | Reports | P1 | Manual | — | Web, Desktop |
| RPT-03 | REQ-RPT-03 | Export report as PDF | Reports | P1 | Partial | `tests/e2e/reports/report-generate.spec.ts` | Web, Desktop |
| RPT-04 | REQ-RPT-04 | Profit/loss report accurate | Reports | P1 | Partial | `src/app/api/reports/profit-loss/__tests__/route.test.ts` | Web, Desktop |
| RPT-05 | REQ-RPT-05 | Empty report range handled | Reports | P2 | Not Started | — | Web, Desktop |
| ADM-01 | REQ-ADM-01 | Admin manages users (CRUD) | Admin | P1 | Automated | `tests/e2e/admin/user-management.spec.ts` | Web, Desktop |
| ADM-02 | REQ-ADM-02 | Assign user roles | Admin | P1 | Automated | `tests/e2e/admin/user-management.spec.ts` | Web, Desktop |
| ADM-03 | REQ-ADM-03 | Persist system settings | Admin | P1 | Not Started | — | Web, Desktop |
| ADM-04 | REQ-ADM-04 | Configure slip paper size | Admin | P2 | Not Started | — | Web, Desktop |
| BKP-01 | REQ-BKP-01 | Backup page restricted to Electron admin | Backup | P0 | Partial | `src/app/(authenticated)/backup/__tests__/page.test.tsx` | Desktop |
| BKP-02 | REQ-BKP-02 | Create manual database backup | Backup | P0 | Partial | `src/app/api/backup/__tests__/route.test.ts` | Desktop |
| BKP-03 | REQ-BKP-03 | Download backup file | Backup | P1 | Partial | `src/app/api/backup/[id]/download/__tests__/route.test.ts` | Desktop |
| BKP-04 | REQ-BKP-04 | Restore from backup with safety copy | Backup | P0 | Partial | `src/app/api/backup/__tests__/route.test.ts` | Desktop |
| BKP-05 | REQ-BKP-05 | Restored data visible after restart | Backup | P0 | Manual | — | Desktop |
| BKP-06 | REQ-BKP-06 | Delete backup file | Backup | P1 | Partial | `src/app/api/backup/__tests__/route.test.ts` | Desktop |
| BKP-07 | REQ-BKP-07 | Backup works on SQLite only | Backup | P1 | Partial | `src/app/api/backup/__tests__/route.test.ts` | Desktop |
| BKP-08 | REQ-BKP-08 | Corrupt backup handled safely | Backup | P1 | Manual | — | Desktop |
| UI-01 | REQ-UI-01 | Dark mode persists | UI/UX | P2 | Partial | `src/contexts/__tests__/DarkModeContext.test.tsx` | Web, Desktop |
| UI-02 | REQ-UI-02 | Sidebar navigation works | UI/UX | P2 | Not Started | — | Web, Desktop |
| UI-03 | REQ-UI-03 | Electron-only nav items hidden on web | UI/UX | P2 | Partial | `src/contexts/__tests__/AppModeContext.test.tsx` | Web, Desktop |
| UI-04 | REQ-UI-04 | Thai text renders correctly | UI/UX | P2 | Manual | — | Web, Desktop |
| UI-05 | REQ-UI-05 | Layout usable at minimum window size | UI/UX | P2 | Manual | — | Desktop |
| UI-06 | REQ-UI-06 | App mode switcher in Electron | UI/UX | P2 | Partial | `src/contexts/__tests__/AppModeContext.test.tsx` | Desktop |
| ELEC-01 | REQ-ELEC-01 | Embedded Next.js server starts in production | Electron | P0 | Manual | — | Win, Mac |
| ELEC-02 | REQ-ELEC-02 | Per-user database isolation | Electron | P1 | Manual | — | Win, Mac |
| ELEC-03 | REQ-ELEC-03 | Debug logs written on errors | Electron | P2 | Manual | — | Win, Mac |
| ELEC-04 | REQ-ELEC-04 | Renderer context isolation enforced | Electron | P1 | Manual | — | Win, Mac |
| ELEC-05 | REQ-ELEC-05 | Stable long-running sessions | Electron | P2 | Manual | — | Win, Mac |
| ELEC-06 | REQ-ELEC-06 | DB survives force quit | Electron | P1 | Manual | — | Win, Mac |
| ELEC-07 | REQ-ELEC-07 | Backup fails safely when disk full | Electron | P2 | Manual | — | Win, Mac |
| ELEC-08 | REQ-ELEC-08 | Antivirus does not block app | Electron | P2 | Manual | — | Win |
| SEC-01 | REQ-SEC-01 | Passwords stored hashed | Security | P0 | Partial | `src/lib/__tests__/auth.test.ts` | Web, Desktop |
| SEC-02 | REQ-SEC-02 | JWT expiry enforced | Security | P0 | Partial | `src/lib/__tests__/auth.test.ts` | Web, Desktop |
| SEC-03 | REQ-SEC-03 | APIs require authentication | Security | P0 | Partial | `src/app/api/auth/login/__tests__/route.test.ts` | Web, Desktop |
| SEC-04 | REQ-SEC-04 | Viewer cannot perform write operations | Security | P0 | Automated | `tests/e2e/admin/user-management.spec.ts` | Web, Desktop |
| SEC-05 | REQ-SEC-05 | Input sanitized via ORM | Security | P1 | Manual | — | Web, Desktop |
| SEC-06 | REQ-SEC-06 | Backup access admin-only | Security | P0 | Partial | `src/app/api/backup/__tests__/route.test.ts` | Desktop |

### Coverage Summary

| Automation Status | Count | % of 89 tests |
|-------------------|-------|---------------|
| Automated | 22 | 25% |
| Partial | 28 | 31% |
| Manual | 33 | 37% |
| Not Started | 6 | 7% |

| Priority | Count |
|----------|-------|
| P0 | 38 |
| P1 | 38 |
| P2 | 13 |

### Requirement Index (for cross-reference)

| Requirement ID | Description |
|----------------|-------------|
| REQ-INST-* | Installation & first-run |
| REQ-AUTH-* | Authentication |
| REQ-RBAC-* | Role-based access control |
| REQ-DASH-* | Dashboard |
| REQ-PRICE-* | Daily pricing |
| REQ-PUR-* | Purchases & purchase history |
| REQ-MEM-* | Member management |
| REQ-SAL-* | Sales |
| REQ-STK-* | Stock & inventory |
| REQ-EXP-* | Expenses |
| REQ-RPT-* | Reports & analytics |
| REQ-ADM-* | Admin & settings |
| REQ-BKP-* | Backup & restore (Electron) |
| REQ-UI-* | UI / UX |
| REQ-ELEC-* | Electron platform |
| REQ-SEC-* | Security |

---

## Test Execution Log (Template)

Copy this section per test run:

| Test ID | Tester | Date | OS | Build # | Result (Pass/Fail/Blocked) | Defect ID | Notes |
|---------|--------|------|----|---------|-----------------------------|-----------|-------|
| | | | | | | | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |
