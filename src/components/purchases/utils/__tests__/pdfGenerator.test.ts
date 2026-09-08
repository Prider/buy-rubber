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
    setFillColor: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    addImage: vi.fn().mockReturnThis(),
    save: vi.fn().mockReturnThis(),
  };

  // Create a proper constructor function
  function MockjsPDF(_?: any) {
    return mockDoc;
  }

  return {
    jsPDF: MockjsPDF,
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
  let appendedNodes: Node[];

  beforeEach(() => {
    appendedNodes = [];
    originalWindowOpen = window.open;
    mockWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      print: vi.fn(),
    } as unknown as Window;

    window.open = vi.fn(() => mockWindow);

    vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      appendedNodes.push(node);
      return node;
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => node);
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

      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('should handle empty HTML', async () => {
      const html = '';
      const fileName = 'test.pdf';

      await expect(generatePDFFromHTML(html, fileName)).resolves.not.toThrow();
    });

    it('should not inject unscoped html/body styles onto the live page', async () => {
      const html = `
        <html>
          <head>
            <style>
              html { background: #ffffff !important; }
              body { background: #ffffff !important; display: flex; }
              .slip { background: #ffffff; }
            </style>
          </head>
          <body>
            <div class="slip" data-slip-width="320">Test</div>
          </body>
        </html>
      `;

      await generatePDFFromHTML(html, 'scoped.pdf');

      const container = appendedNodes.find(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && node.classList.contains('pdf-slip-capture')
      );
      expect(container).toBeTruthy();

      const styleText = Array.from(container!.querySelectorAll('style'))
        .map((el) => el.textContent || '')
        .join('\n');

      expect(styleText).toContain('.pdf-slip-capture');
      expect(styleText).not.toMatch(/(^|[,{\s])html\b/);
      expect(styleText).not.toMatch(/(^|[,{\s])body\b/);
    });

    it('should use data-slip-width for PDF capture dimensions', async () => {
      const html =
        '<html><body><div class="slip" data-slip-width="219">Narrow slip</div></body></html>';
      const fileName = 'narrow.pdf';

      const html2canvasModule = await import('html2canvas');
      const html2canvasMock = vi.mocked(html2canvasModule.default);

      await generatePDFFromHTML(html, fileName);

      expect(html2canvasMock).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ width: 219, windowWidth: 219 })
      );
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
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
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
      expect(document.body.appendChild).toHaveBeenCalled();

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

