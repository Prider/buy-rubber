export const MOISTURE_NEGATIVE_ERROR = 'หักความชื้นต้องไม่ติดลบ';
export const MOISTURE_EXCEEDS_ERROR = 'หักความชื้นต้องไม่เกินยอดเงินรวม';

/** Baht deducted from the purchase total. Empty or non-positive values become 0. */
export function normalizeMoistureAmount(value: unknown): number {
  if (value == null || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

export function readMoistureAmount(value: unknown): number | { error: string } {
  if (value == null || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: MOISTURE_NEGATIVE_ERROR };
  }
  return parsed;
}

/** Purchase total after a baht moisture deduction. */
export function totalAfterMoisture(grossAmount: number, moistureAmount: number): number {
  return grossAmount - normalizeMoistureAmount(moistureAmount);
}

export function deductMoisture(
  grossAmount: number,
  moistureAmount: number,
): { totalAmount: number } | { error: string } {
  if (moistureAmount > grossAmount + 1e-6) {
    return { error: MOISTURE_EXCEEDS_ERROR };
  }
  return { totalAmount: grossAmount - moistureAmount };
}

/** Stock cost stays equal to cash paid when moisture reduces the purchase total. */
export function purchaseUnitCostPerKg(
  netWeight: number,
  finalPrice: number,
  totalAmount: number,
  moistureAmount: unknown,
): number {
  if (normalizeMoistureAmount(moistureAmount) > 0 && netWeight > 0) {
    return totalAmount / netWeight;
  }
  return finalPrice;
}
