import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  transactionToCartItems,
  generateSlipHTMLFromItems,
  generateSlipHTML,
} from '../slipGenerator';
import { PurchaseTransaction, CartItem } from '../../types';

describe('slipGenerator', () => {
  describe('transactionToCartItems', () => {
    it('should convert purchase transaction to cart items', () => {
      const transaction: PurchaseTransaction = {
        purchaseNo: 'P001',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        purchases: [
          {
            id: 'p1',
            purchaseNo: 'P001',
            date: '2024-01-15',
            member: {
              id: 'm1',
              code: 'M001',
              name: 'John Doe',
            },
            productType: {
              id: 'pt1',
              name: 'น้ำยางสด',
              code: 'RUBBER',
            },
            netWeight: 100,
            finalPrice: 50,
            totalAmount: 5000,
          },
        ],
        serviceFees: [
          {
            id: 'sf1',
            category: 'ค่าบริการ',
            amount: 100,
            notes: null,
          },
        ],
        totalAmount: 4900,
        member: {
          id: 'm1',
          code: 'M001',
          name: 'John Doe',
        },
      };

      const result = transactionToCartItems(transaction);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'p1',
        type: 'purchase',
        date: '2024-01-15',
        memberName: 'John Doe',
        memberCode: 'M001',
        productTypeName: 'น้ำยางสด',
        netWeight: 100,
        finalPrice: 50,
        totalAmount: 5000,
      });
      expect(result[1]).toMatchObject({
        id: 'sf1',
        type: 'serviceFee',
        date: '2024-01-15',
        category: 'ค่าบริการ',
        totalAmount: -100,
      });
    });

    it('should handle transaction with no purchases', () => {
      const transaction: PurchaseTransaction = {
        purchaseNo: 'P002',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        purchases: [],
        serviceFees: [],
        totalAmount: 0,
        member: {
          id: 'm1',
          code: 'M001',
          name: 'John Doe',
        },
      };

      const result = transactionToCartItems(transaction);
      expect(result).toHaveLength(0);
    });

    it('should handle transaction with multiple purchases and service fees', () => {
      const transaction: PurchaseTransaction = {
        purchaseNo: 'P003',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        purchases: [
          {
            id: 'p1',
            purchaseNo: 'P003',
            date: '2024-01-15',
            member: {
              id: 'm1',
              code: 'M001',
              name: 'John Doe',
            },
            productType: {
              id: 'pt1',
              name: 'น้ำยางสด',
              code: 'RUBBER',
            },
            netWeight: 100,
            finalPrice: 50,
            totalAmount: 5000,
          },
          {
            id: 'p2',
            purchaseNo: 'P003',
            date: '2024-01-15',
            member: {
              id: 'm1',
              code: 'M001',
              name: 'John Doe',
            },
            productType: {
              id: 'pt2',
              name: 'ยางแห้ง',
              code: 'DRY',
            },
            netWeight: 50,
            finalPrice: 60,
            totalAmount: 3000,
          },
        ],
        serviceFees: [
          {
            id: 'sf1',
            category: 'ค่าบริการ',
            amount: 100,
            notes: null,
          },
          {
            id: 'sf2',
            category: 'ค่าขนส่ง',
            amount: 200,
            notes: 'Shipping fee',
          },
        ],
        totalAmount: 7700,
        member: {
          id: 'm1',
          code: 'M001',
          name: 'John Doe',
        },
      };

      const result = transactionToCartItems(transaction);
      expect(result).toHaveLength(4);
      expect(result.filter((item) => item.type === 'purchase')).toHaveLength(2);
      expect(result.filter((item) => item.type === 'serviceFee')).toHaveLength(2);
      expect(result[2].totalAmount).toBe(-100);
      expect(result[3].totalAmount).toBe(-200);
    });
  });

  describe('generateSlipHTMLFromItems', () => {
    it('should return empty string for empty items array', () => {
      const result = generateSlipHTMLFromItems([]);
      expect(result).toBe('');
    });

    it('should generate HTML with purchase items', () => {
      const items: CartItem[] = [
        {
          id: 'p1',
          type: 'purchase',
          date: '2024-01-15',
          memberName: 'John Doe',
          memberCode: 'M001',
          productTypeName: 'น้ำยางสด',
          netWeight: 100,
          finalPrice: 50,
          totalAmount: 5000,
        },
      ];

      const result = generateSlipHTMLFromItems(items);

      expect(result).toContain('<html>');
      expect(result).toContain('สินทวี');
      expect(result).toContain('171/5 ม.8 ต.ชะมาย อ.ทุ่งสง จ.นครศรีฯ');
      expect(result).toContain('น้ำยางสด');
      expect(result).toContain('100');
      expect(result).toContain('50');
      expect(result).toContain('5,000');
      expect(result).toContain('ยอดสุทธิ');
    });

    it('should use provided purchase number', () => {
      const items: CartItem[] = [
        {
          id: 'p1',
          type: 'purchase',
          date: '2024-01-15',
          totalAmount: 5000,
        },
      ];

      const result = generateSlipHTMLFromItems(items, { purchaseNo: 'P123' });
      expect(result).toContain('เลขที่: P123');
    });

    it('should generate purchase number from timestamp if not provided', () => {
      const items: CartItem[] = [
        {
          id: 'p1',
          type: 'purchase',
          date: '2024-01-15',
          totalAmount: 5000,
        },
      ];

      const beforeTime = Date.now();
      const result = generateSlipHTMLFromItems(items);
      const afterTime = Date.now();

      // Should contain a timestamp-based purchase number
      const purchaseNoMatch = result.match(/เลขที่: (\d+)/);
      expect(purchaseNoMatch).toBeTruthy();
      if (purchaseNoMatch) {
        const purchaseNo = parseInt(purchaseNoMatch[1], 10);
        expect(purchaseNo).toBeGreaterThanOrEqual(beforeTime);
        expect(purchaseNo).toBeLessThanOrEqual(afterTime);
      }
    });

    it('should use provided member name and code', () => {
      const items: CartItem[] = [
        {
          id: 'p1',
          type: 'purchase',
          date: '2024-01-15',
          totalAmount: 5000,
        },
      ];

      const result = generateSlipHTMLFromItems(items, {
        memberName: 'Jane Smith',
        memberCode: 'M002',
      });

      expect(result).toContain('สมาชิก: Jane Smith');
      expect(result).toContain('รหัสสมาชิก: M002');
    });

    it('should extract member info from items if not provided', () => {
      const items: CartItem[] = [
        {
          id: 'p1',
          type: 'purchase',
          date: '2024-01-15',
          memberName: 'John Doe',
          memberCode: 'M001',
          totalAmount: 5000,
        },
      ];

      const result = generateSlipHTMLFromItems(items);

      expect(result).toContain('สมาชิก: John Doe');
      expect(result).toContain('รหัสสมาชิก: M001');
    });

    it('should handle service fee items', () => {
      const items: CartItem[] = [
        {
          id: 'sf1',
          type: 'serviceFee',
          date: '2024-01-15',
          category: 'ค่าบริการ',
          totalAmount: -100,
        },
      ];

      const result = generateSlipHTMLFromItems(items);

      expect(result).toContain('ค่าบริการ');
      // Currency is formatted, so check for formatted string
      expect(result).toMatch(/-.*100/);
    });

    it('should calculate total correctly', () => {
      const items: CartItem[] = [
        {
          id: 'p1',
          type: 'purchase',
          date: '2024-01-15',
          totalAmount: 5000,
        },
        {
          id: 'p2',
          type: 'purchase',
          date: '2024-01-15',
          totalAmount: 3000,
        },
        {
          id: 'sf1',
          type: 'serviceFee',
          date: '2024-01-15',
          category: 'ค่าบริการ',
          totalAmount: -100,
        },
      ];

      const result = generateSlipHTMLFromItems(items);
      const total = 5000 + 3000 - 100; // 7900

      expect(result).toContain('7,900');
    });

    it('should include purchase weight and price for purchase items', () => {
      const items: CartItem[] = [
        {
          id: 'p1',
          type: 'purchase',
          date: '2024-01-15',
          productTypeName: 'น้ำยางสด',
          netWeight: 100.5,
          finalPrice: 50.25,
          totalAmount: 5050.125,
        },
      ];

      const result = generateSlipHTMLFromItems(items);

      expect(result).toContain('น้ำหนักสุทธิ: 100.50 กก.');
      expect(result).toContain('@ 50.25 /กก.');
    });

    it('should not include weight and price for service fee items', () => {
      const items: CartItem[] = [
        {
          id: 'sf1',
          type: 'serviceFee',
          date: '2024-01-15',
          category: 'ค่าบริการ',
          totalAmount: -100,
        },
      ];

      const result = generateSlipHTMLFromItems(items);

      expect(result).not.toContain('น้ำหนักสุทธิ');
      expect(result).not.toContain('/กก.');
    });

    it('should include all required HTML structure', () => {
      const items: CartItem[] = [
        {
          id: 'p1',
          type: 'purchase',
          date: '2024-01-15',
          totalAmount: 5000,
        },
      ];

      const result = generateSlipHTMLFromItems(items);

      expect(result).toContain('<html>');
      expect(result).toContain('<head>');
      expect(result).toContain('<title>ใบรับซื้อ</title>');
      expect(result).toContain('<body>');
      expect(result).toContain('class="slip"');
      expect(result).toContain('class="store"');
      expect(result).toContain('class="meta"');
      expect(result).toContain('class="item"');
      expect(result).toContain('class="total"');
      expect(result).toContain('class="signatures"');
      expect(result).toContain('class="footer"');
      expect(result).toContain('ผู้จัดทำ');
      expect(result).toContain('ผู้รับเงิน');
    });

    it('should include print date', () => {
      const items: CartItem[] = [
        {
          id: 'p1',
          type: 'purchase',
          date: '2024-01-15',
          totalAmount: 5000,
        },
      ];

      const result = generateSlipHTMLFromItems(items);

      expect(result).toContain('วันที่พิมพ์:');
    });
  });

  describe('generateSlipHTML', () => {
    it('should generate HTML from transaction', () => {
      const transaction: PurchaseTransaction = {
        purchaseNo: 'P001',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        purchases: [
          {
            id: 'p1',
            purchaseNo: 'P001',
            date: '2024-01-15',
            member: {
              id: 'm1',
              code: 'M001',
              name: 'John Doe',
            },
            productType: {
              id: 'pt1',
              name: 'น้ำยางสด',
              code: 'RUBBER',
            },
            netWeight: 100,
            finalPrice: 50,
            totalAmount: 5000,
          },
        ],
        serviceFees: [],
        totalAmount: 5000,
        member: {
          id: 'm1',
          code: 'M001',
          name: 'John Doe',
        },
      };

      const result = generateSlipHTML(transaction);

      expect(result).toContain('เลขที่: P001');
      expect(result).toContain('สมาชิก: John Doe');
      expect(result).toContain('รหัสสมาชิก: M001');
      expect(result).toContain('น้ำยางสด');
    });

    it('should handle transaction with service fees', () => {
      const transaction: PurchaseTransaction = {
        purchaseNo: 'P002',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        purchases: [
          {
            id: 'p1',
            purchaseNo: 'P002',
            date: '2024-01-15',
            member: {
              id: 'm1',
              code: 'M001',
              name: 'John Doe',
            },
            productType: {
              id: 'pt1',
              name: 'น้ำยางสด',
              code: 'RUBBER',
            },
            netWeight: 100,
            finalPrice: 50,
            totalAmount: 5000,
          },
        ],
        serviceFees: [
          {
            id: 'sf1',
            category: 'ค่าบริการ',
            amount: 100,
            notes: null,
          },
        ],
        totalAmount: 4900,
        member: {
          id: 'm1',
          code: 'M001',
          name: 'John Doe',
        },
      };

      const result = generateSlipHTML(transaction);

      expect(result).toContain('ค่าบริการ');
      // Should show net total (5000 - 100 = 4900)
      expect(result).toContain('4,900');
    });
  });
});

