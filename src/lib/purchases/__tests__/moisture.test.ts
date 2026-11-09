import { describe, expect, it } from 'vitest';
import {
  MOISTURE_EXCEEDS_ERROR,
  MOISTURE_NEGATIVE_ERROR,
  deductMoisture,
  normalizeMoistureAmount,
  purchaseUnitCostPerKg,
  readMoistureAmount,
  totalAfterMoisture,
} from '../moisture';

describe('moisture deduction', () => {
  it('leaves the total unchanged when moisture is empty or zero', () => {
    expect(totalAfterMoisture(5000, normalizeMoistureAmount(''))).toBe(5000);
    expect(totalAfterMoisture(4750, normalizeMoistureAmount(0))).toBe(4750);
  });

  it('reduces the payable total by a baht amount', () => {
    expect(totalAfterMoisture(5000, 10)).toBe(4990);
    expect(totalAfterMoisture(4775, 25.5)).toBeCloseTo(4749.5);
  });

  it('rejects a negative amount and an amount above the total', () => {
    expect(readMoistureAmount(-1)).toEqual({ error: MOISTURE_NEGATIVE_ERROR });
    expect(readMoistureAmount(10)).toBe(10);
    expect(readMoistureAmount(150)).toBe(150);
    expect(deductMoisture(5000, 5000)).toEqual({ totalAmount: 0 });
    expect(deductMoisture(5000, 5000.01)).toEqual({ error: MOISTURE_EXCEEDS_ERROR });
  });

  it('lowers unit cost so stock value matches the reduced total', () => {
    expect(purchaseUnitCostPerKg(100, 50, 4990, 10)).toBeCloseTo(49.9);
    expect(purchaseUnitCostPerKg(100, 50, 5000, 0)).toBe(50);
  });
});
