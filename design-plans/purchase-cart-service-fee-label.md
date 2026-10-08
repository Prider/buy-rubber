# Name cart service-fee lines ค่าบริการ

Written against: c4e53aaffe14d5f6fd7375eec8dd2249620a4044

## Evidence chain

- Surface: `/purchases` purchase entry. `src/app/(authenticated)/purchases/page.tsx` renders `PurchaseEntryCard` (with `ServiceFeeCard`) and `CartTable` in the desktop column and again in the mobile cart sheet.
- Problem: A service-fee line is named ค่าบริการ where it is added and ค่าใช้จ่าย where the cart shows it. The empty cart uses ค่าใช้จ่าย for that same line kind.
- Design evidence: On this screen the fee tab label is `ค่าบริการ` in `src/components/purchases/PurchaseEntryCard.tsx`, and the desktop heading is `บันทึกค่าบริการ` in `src/components/purchases/ServiceFeeCard.tsx`. The purchase type badge beside them is the short label `รับซื้อ`. `src/components/purchases/CartTable.tsx` renders `ค่าใช้จ่าย` for every row whose `type` is not `purchase`, and the empty table says `เพิ่มรายการรับซื้อหรือค่าใช้จ่ายเพื่อเริ่มต้น`.
- Owner: `src/components/purchases/CartTable.tsx`
- Scope and affected surfaces: The service-fee type badge and the empty-cart sentence in `CartTable`. Both the desktop cart (`hidden` below `lg`, `lg:flex` in `purchases/page.tsx`) and the mobile sheet (the same `CartTable` with `onClose`) inherit the copy. `tests/e2e/purchases/purchase-flow.spec.ts` asserts the badge text.
- Uncertainty: none

## Design decision

Use the short entry label `ค่าบริการ` for a service-fee cart line. The purchase badge is `รับซื้อ`, and the fee tab is `ค่าบริการ`, so the fee badge is `ค่าบริการ` rather than the longer heading `บันทึกค่าบริการ`. In the empty-cart sentence, replace only the noun `ค่าใช้จ่าย` with `ค่าบริการ`.

## Reuse

- Existing copy `ค่าบริการ` on the fee tab in `src/components/purchases/PurchaseEntryCard.tsx`
- Exemplar: the purchase badge `รับซื้อ` in `src/components/purchases/CartTable.tsx` (short type name, same badge element)

No new primitive. The badge element and the empty-state paragraph already exist.

## Changes

1. `src/components/purchases/CartTable.tsx`
   - Change: In the non-purchase branch of the `ประเภท` cell, replace the badge text `ค่าใช้จ่าย` with `ค่าบริการ`. Replace the empty-table sentence with `เพิ่มรายการรับซื้อหรือค่าบริการเพื่อเริ่มต้น`.
   - Preserve: Badge classes (`bg-red-100 text-red-800`, dark variants, `rounded-full`, `text-xs`). The `รับซื้อ` badge. Row details, amounts, remove button, totals, save button, and the header sentences `รายการรับซื้อที่รอการบันทึก (${cart.length} รายการ)` and `ตะกร้าว่าง - เพิ่มรายการรับซื้อเพื่อเริ่มต้น`.
   - Verify: A `serviceFee` cart row shows `ค่าบริการ`. An empty cart table shows `เพิ่มรายการรับซื้อหรือค่าบริการเพื่อเริ่มต้น`. A purchase row still shows `รับซื้อ`.

2. `tests/e2e/purchases/purchase-flow.spec.ts`
   - Change: In `attaches service fee to purchase transaction`, change the table assertion from exact text `ค่าใช้จ่าย` to exact text `ค่าบริการ`.
   - Preserve: The assertion stays on `page.getByRole('table')` with `{ exact: true }`. Other expectations in that test stay as they are.
   - Verify: The spec expects the service-fee badge `ค่าบริการ`.

## Scope

- Inherit: Desktop cart column and mobile cart sheet on `/purchases`, because both render `CartTable`.
- Verify: `/purchases` with an empty cart, with a purchase row, and with a service-fee row, at a viewport below `1024px` (sheet) and at `1024px` or wider (side column).
- Exclude: `src/components/purchases/utils/slipGenerator.ts` fallback `ค่าใช้จ่าย`. The cart button `รีเซ็ตตะกร้า` and its confirm copy. The header sentences listed under Preserve. Nav item `ค่าใช้จ่าย` (`/expenses`) and every expenses, sales, and report use of `ค่าใช้จ่าย`.

## Validation

- Product: On `/purchases`, add a service fee. The cart type badge reads `ค่าบริการ`, matching the fee tab. With no lines, the empty table reads `เพิ่มรายการรับซื้อหรือค่าบริการเพื่อเริ่มต้น`.
- Interface: Fee tab and heading copy stay `ค่าบริการ` and `บันทึกค่าบริการ`. Purchase badge stays `รับซื้อ`. Badge color stays red. Desktop column and mobile sheet show the same badge and empty sentence.
- System: The badge remains the existing span in `CartTable`. No shared label component is introduced.
- Repository: `npx playwright test tests/e2e/purchases/purchase-flow.spec.ts -g "attaches service fee to purchase transaction"` → the test passes with the badge assertion on `ค่าบริการ`.

## Stop conditions

- Stop if `CartTable` no longer renders service-fee rows with a type badge, or if the fee tab label in `PurchaseEntryCard.tsx` is no longer `ค่าบริการ`.
- Stop if matching the tab would require renaming expenses, slips, or the cart header sentences. Those strings are outside this change.

## Design documentation

- After acceptance and validation: none. This surface has no design document that records labels.
