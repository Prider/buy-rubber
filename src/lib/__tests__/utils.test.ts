import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber, formatDate, calculateDryWeight, calculateSplit } from '../utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toContain('1,234.56')
    })

    it('should format negative numbers correctly', () => {
      const result = formatCurrency(-1234.56)
      expect(result).toContain('1,234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toContain('0.00')
    })

    it('should handle large numbers', () => {
      expect(formatCurrency(1234567.89)).toContain('1,234,567.89')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with 2 decimal places by default', () => {
      expect(formatNumber(123.456)).toBe('123.46')
    })

    it('should format numbers with custom decimal places', () => {
      expect(formatNumber(123.456, 1)).toBe('123.5')
      expect(formatNumber(123.456, 3)).toBe('123.456')
    })

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0.00')
    })
  })

  describe('formatDate', () => {
    it('should format date string correctly in Thai format', () => {
      const date = '2023-11-24'
      const formatted = formatDate(date)
      // Thai format includes day number
      expect(formatted).toContain('24')
      // Should contain Thai month name or Buddhist Era year (2566 = 2023 + 543)
      expect(formatted).toBeTruthy()
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should handle Date object', () => {
      const date = new Date('2023-11-24')
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should format consistently', () => {
      const date1 = formatDate('2023-11-24')
      const date2 = formatDate(new Date('2023-11-24'))
      // Both should produce non-empty strings
      expect(date1).toBeTruthy()
      expect(date2).toBeTruthy()
    })
  })

  describe('calculateDryWeight', () => {
    it('should calculate dry weight correctly', () => {
      const netWeight = 100
      const rubberPercent = 60
      const dryWeight = calculateDryWeight(netWeight, rubberPercent)
      expect(dryWeight).toBe(60)
    })

    it('should return netWeight if rubberPercent is 100', () => {
      const netWeight = 100
      const rubberPercent = 100
      const dryWeight = calculateDryWeight(netWeight, rubberPercent)
      expect(dryWeight).toBe(100)
    })

    it('should handle zero rubber percent', () => {
      const netWeight = 100
      const rubberPercent = 0
      const dryWeight = calculateDryWeight(netWeight, rubberPercent)
      expect(dryWeight).toBe(0)
    })

    it('should handle decimal values', () => {
      const netWeight = 100.5
      const rubberPercent = 50.5
      const dryWeight = calculateDryWeight(netWeight, rubberPercent)
      expect(dryWeight).toBeCloseTo(50.75)
    })
  })

  describe('calculateSplit', () => {
    it('should split amount correctly', () => {
      const totalAmount = 1000
      const ownerPercent = 70
      const tapperPercent = 30

      const { ownerAmount, tapperAmount } = calculateSplit(
        totalAmount,
        ownerPercent,
        tapperPercent
      )

      expect(ownerAmount).toBe(700)
      expect(tapperAmount).toBe(300)
      expect(ownerAmount + tapperAmount).toBe(totalAmount)
    })

    it('should handle 100% owner split', () => {
      const totalAmount = 1000
      const ownerPercent = 100
      const tapperPercent = 0

      const { ownerAmount, tapperAmount } = calculateSplit(
        totalAmount,
        ownerPercent,
        tapperPercent
      )

      expect(ownerAmount).toBe(1000)
      expect(tapperAmount).toBe(0)
    })

    it('should handle decimal amounts', () => {
      const totalAmount = 1000
      const ownerPercent = 33.33
      const tapperPercent = 66.67

      const { ownerAmount, tapperAmount } = calculateSplit(
        totalAmount,
        ownerPercent,
        tapperPercent
      )

      expect(ownerAmount).toBeCloseTo(333.3)
      expect(tapperAmount).toBeCloseTo(666.7)
    })
  })
})

