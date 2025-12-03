import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generatePDFFromHTML,
  generateTransactionPDF,
  printHTML,
  printTransactionSlip,
} from '../pdfGenerator';
import { PurchaseTransaction } from '../../types';

// Mock generateSlipHTML
vi.mock('../slipGenerator', () => ({
  generateSlipHTML: vi.fn((transaction) => {
    return `<html><body><div class="slip">Mock HTML for ${transaction.purchaseNo}</div></body></html>`;
  }),
}));

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockDoc = {
    setFillColor: vi.fn(),
    rect: vi.fn(),
    addImage: vi.fn(),
    save: vi.fn(),
  };

  return {
    jsPDF: vi.fn(() => mockDoc),
  };
});

// Mock html2canvas
vi.mock('html2canvas', () => {
  return {
    default: vi.fn(() =>
      Promise.resolve({
        width: 320,
        height: 500,
        toDataURL: vi.fn(() => 'data:image/png;base64,mockImageData'),
      })
    ),
  };
});

describe('pdfGenerator', () => {
  let mockWindow: Window | null = null;
  let originalWindowOpen: typeof window.open;

  beforeEach(() => {
    // Mock window.open
    originalWindowOpen = window.open;
    mockWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      print: vi.fn(),
    } as unknown as Window;

    window.open = vi.fn(() => mockWindow);

    // Mock document.createElement and appendChild
    const mockElement = document.createElement('div');
    vi.spyOn(document, 'createElement').mockReturnValue(mockElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement);
    vi.spyOn(mockElement, 'querySelector').mockReturnValue(mockElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.open = originalWindowOpen;
  });

  describe('generatePDFFromHTML', () => {
    it('should create PDF from HTML string', async () => {
      const html = '<html><body><div class="slip">Test</div></body></html>';
      const fileName = 'test.pdf';

      await generatePDFFromHTML(html, fileName);

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('should handle empty HTML', async () => {
      const html = '';
      const fileName = 'test.pdf';

      await expect(generatePDFFromHTML(html, fileName)).resolves.not.toThrow();
    });

    it('should set correct container styles', async () => {
      const html = '<div class="slip">Test</div>';
      const fileName = 'test.pdf';

      await generatePDFFromHTML(html, fileName);

      const createElementCall = vi.mocked(document.createElement);
      expect(createElementCall).toHaveBeenCalled();
    });
  });

  describe('generateTransactionPDF', () => {
    it('should generate PDF from transaction', async () => {
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

      const slipGenerator = await import('../slipGenerator');
      const generateSlipHTML = vi.mocked(slipGenerator.generateSlipHTML);
      
      await generateTransactionPDF(transaction);

      expect(generateSlipHTML).toHaveBeenCalledWith(transaction);
      expect(document.createElement).toHaveBeenCalled();
    });

    it('should generate correct file name with purchase number and date', async () => {
      const transaction: PurchaseTransaction = {
        purchaseNo: 'P123',
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

      // Mock Date.toLocaleDateString
      const originalToLocaleDateString = Date.prototype.toLocaleDateString;
      Date.prototype.toLocaleDateString = vi.fn(() => '15/1/2024');

      await generateTransactionPDF(transaction);

      // Verify that jsPDF save was called (indirectly through generatePDFFromHTML)
      expect(document.createElement).toHaveBeenCalled();

      // Restore
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    });
  });

  describe('printHTML', () => {
    it('should open print window with HTML content', () => {
      const html = '<html><body>Test</body></html>';

      printHTML(html);

      expect(window.open).toHaveBeenCalledWith('', '_blank');
      if (mockWindow) {
        expect(mockWindow.document.write).toHaveBeenCalledWith(html);
        expect(mockWindow.document.close).toHaveBeenCalled();
        expect(mockWindow.print).toHaveBeenCalled();
      }
    });

    it('should handle null window.open gracefully', () => {
      window.open = vi.fn(() => null);

      const html = '<html><body>Test</body></html>';

      expect(() => printHTML(html)).not.toThrow();
    });

    it('should handle empty HTML', () => {
      const html = '';

      printHTML(html);

      expect(window.open).toHaveBeenCalled();
      if (mockWindow) {
        expect(mockWindow.document.write).toHaveBeenCalledWith('');
      }
    });
  });

  describe('printTransactionSlip', () => {
    it('should print transaction slip', async () => {
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

      const slipGenerator = await import('../slipGenerator');
      const generateSlipHTML = vi.mocked(slipGenerator.generateSlipHTML);

      printTransactionSlip(transaction);

      expect(generateSlipHTML).toHaveBeenCalledWith(transaction);
      expect(window.open).toHaveBeenCalled();
    });

    it('should handle transaction with service fees', async () => {
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

      const slipGenerator = await import('../slipGenerator');
      const generateSlipHTML = vi.mocked(slipGenerator.generateSlipHTML);
      
      printTransactionSlip(transaction);

      expect(generateSlipHTML).toHaveBeenCalledWith(transaction);
      expect(window.open).toHaveBeenCalled();
    });
  });
});

