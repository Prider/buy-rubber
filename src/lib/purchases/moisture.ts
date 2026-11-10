export const MOISTURE_NEGATIVE_ERROR = 'หักความชื้นต้องไม่ติดลบ';
export const MOISTURE_EXCEEDS_ERROR = 'หักความชื้นต้องไม่เกินยอดเงินรวม';
export const MOISTURE_EXCEEDS_WEIGHT_ERROR = 'หักความชื้นต้องไม่เกินน้ำหนักสุทธิ';

export type MoistureUnit = 'baht' | 'kg';

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

export function readMoistureUnit(value: unknown): MoistureUnit {
  return value === 'kg' ? 'kg' : 'baht';
}

export function moistureUnitLabel(unit: unknown): string {
  return readMoistureUnit(unit) === 'kg' ? 'กก.' : 'บาท';
}

/** Scale weight before a kilogram moisture deduction. */
export function scaleNetWeight(grossWeight: number, containerWeight: number): number {
  return grossWeight - containerWeight;
}

function roundKg(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface SettledMoisture {
  netWeight: number;
  totalAmount: number;
  moistureUnit: MoistureUnit;
}

/**
 * Baht mode keeps the weighed net weight and subtracts baht from the total.
 * Kilogram mode subtracts the deduction from that net weight, then prices what remains.
 * A client net weight is used only in baht mode, matching the previous API.
 */
export function settlePurchaseMoisture(input: {
  grossWeight: number;
  containerWeight: number;
  netWeight?: number | null;
  finalPrice: number;
  moistureAmount: number;
  moistureUnit?: unknown;
}): SettledMoisture | { error: string } {
  const unit = readMoistureUnit(input.moistureUnit);
  const weighedNet = scaleNetWeight(input.grossWeight, input.containerWeight || 0);

  if (unit === 'kg') {
    if (input.moistureAmount > weighedNet + 1e-6) {
      return { error: MOISTURE_EXCEEDS_WEIGHT_ERROR };
    }
    const netWeight = roundKg(weighedNet - input.moistureAmount);
    return {
      netWeight,
      totalAmount: netWeight * input.finalPrice,
      moistureUnit: unit,
    };
  }

  const clientNet = input.netWeight;
  const netWeight =
    typeof clientNet === 'number' && Number.isFinite(clientNet) && clientNet !== 0
      ? clientNet
      : weighedNet;
  const deducted = deductMoisture(netWeight * input.finalPrice, input.moistureAmount);
  if ('error' in deducted) return deducted;
  return {
    netWeight,
    totalAmount: deducted.totalAmount,
    moistureUnit: 'baht',
  };
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
