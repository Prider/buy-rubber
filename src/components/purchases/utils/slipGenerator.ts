import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  getStoredSlipPaperSize,
  slipPageWidthMm,
  slipWidthPxFor,
  type SlipPaperSizeId,
} from '@/lib/slipPaper';
import { PurchaseTransaction, CartItem } from '../types';

const DEFAULT_COMPANY_NAME = 'สินทวี';
const DEFAULT_COMPANY_ADDRESS = '171/5 ม.8 ต.ชะมาย อ.ทุ่งสง จ.นครศรีฯ';

const SLIP_COMPANY_NAME_KEY = 'slip_companyName';
const SLIP_COMPANY_ADDRESS_KEY = 'slip_companyAddress';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStoredSlipCompanyName(): string {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_NAME;
  try {
    const v = window.localStorage.getItem(SLIP_COMPANY_NAME_KEY);
    if (v && v.trim()) return v;
  } catch {
    // ignore
  }
  return DEFAULT_COMPANY_NAME;
}

function getStoredSlipCompanyAddress(): string {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_ADDRESS;
  try {
    const v = window.localStorage.getItem(SLIP_COMPANY_ADDRESS_KEY);
    if (v && v.trim()) return v;
  } catch {
    // ignore
  }
  return DEFAULT_COMPANY_ADDRESS;
}

/**
 * Convert a purchase transaction to cart items format for slip generation
 */
export function transactionToCartItems(transaction: PurchaseTransaction): CartItem[] {
  const items: CartItem[] = [];

  // Add purchase items
  transaction.purchases.forEach((purchase) => {
    items.push({
      id: purchase.id,
      type: 'purchase',
      date: purchase.date,
      memberName: purchase.member.name,
      memberCode: purchase.member.code,
      productTypeName: purchase.productType.name,
      netWeight: purchase.netWeight,
      finalPrice: purchase.finalPrice,
      totalAmount: purchase.totalAmount,
    });
  });

  // Add service fee items (as negative amounts)
  transaction.serviceFees.forEach((serviceFee) => {
    items.push({
      id: serviceFee.id,
      type: 'serviceFee',
      date: transaction.date,
      category: serviceFee.category,
      totalAmount: -serviceFee.amount,
    });
  });

  return items;
}

/**
 * Generate HTML for slip/receipt from cart items
 * This is the shared function used by both generateSlipHTML and generateCartHTML
 */
export function generateSlipHTMLFromItems(
  items: CartItem[],
  options?: {
    purchaseNo?: string;
    memberName?: string;
    memberCode?: string;
    companyName?: string;
    companyAddress?: string;
    /** When omitted, uses `localStorage` (same as print/PDF). */
    paperSize?: SlipPaperSizeId;
  }
): string {
  if (items.length === 0) {
    return '';
  }

  const total = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const printDate = new Date().toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Get purchase number - use provided or generate from timestamp
  const purchaseNo = options?.purchaseNo || String(Date.now());

  // Get member info - use provided or find from first item
  const memberName = options?.memberName || items.find(item => item.memberName && item.memberCode)?.memberName || '';
  const memberCode = options?.memberCode || items.find(item => item.memberName && item.memberCode)?.memberCode || '';

  const companyName = options?.companyName || getStoredSlipCompanyName();
  const companyAddress = options?.companyAddress || getStoredSlipCompanyAddress();
  const paperSizeId = options?.paperSize ?? getStoredSlipPaperSize();
  const slipWidthPx = slipWidthPxFor(paperSizeId);
  const pageWidthMm = slipPageWidthMm(paperSizeId);

  return `
    <html>
      <head>
        <title>ใบรับซื้อ</title>
        <meta charset="UTF-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          html { background: #ffffff !important; margin: 0; padding: 0; width: 100%; min-height: 100%; }
          body {
            font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', Arial, sans-serif;
            margin: 0 auto;
            padding: 16px 0;
            background: #ffffff !important;
            width: ${slipWidthPx}px;
            max-width: 100%;
            min-height: 100%;
          }
          @media screen {
            html { min-height: 100%; }
            body {
              min-height: 100vh;
              min-height: 100dvh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              justify-content: safe center;
              align-items: stretch;
            }
          }
          .slip {
            width: 100%;
            margin: 0;
            flex-shrink: 0;
            background: #ffffff !important;
            border-radius: 12px;
            padding: 16px 18px;
          }
          @media print {
            html, body {
              width: ${slipWidthPx}px !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
              min-height: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .slip {
              border-radius: 0 !important;
              box-shadow: none !important;
              padding: 12px 14px !important;
            }
            @page {
              size: ${pageWidthMm}mm auto;
              margin: 0;
            }
          }
          .store { text-align: center; line-height: 1.4; margin-bottom: 10px; }
          .store h1 { margin: 0; font-size: 20px; letter-spacing: 1px; color: #0f172a; }
          .store p { margin: 4px 0; font-size: 13px; color: #475569; }
          .meta { font-size: 12px; color: #475569; margin-bottom: 10px; border-bottom: 1px dashed #cbd5f5; padding-bottom: 6px; }
          .item { display: flex; justify-content: space-between; align-items: flex-start; padding: 6px 0;}
          .item:last-child { border-bottom: none; }
          .item-name { font-size: 13px; color: #0f172a; font-weight: 600; }
          .item-meta { font-size: 11px; color: #64748b; }
          .item-amount { text-align: right; font-size: 13px; color: #0f172a; font-weight: 600; }
          .item-amount .price { font-size: 11px; color: #475569; font-weight: 400; display: block; }
          .total { margin-top: 12px; padding-top: 8px; border-top: 2px solid #0f172a; font-size: 14px; font-weight: bold; color: #0f172a; display: flex; justify-content: space-between; }
          .signatures { display: flex; justify-content: space-between; padding-top: 16px; gap: 8px; }
          .signatures--stacked {
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
            gap: 20px;
          }
          .signatures--stacked .signature { flex: none; width: 100%; }
          .signatures--stacked .signature-line { width: min(75%, 140px); margin-top: 32px; }
          .signature { flex: 1; text-align: center; }
          .signature-label { font-size: 12px; color: #475569; margin-bottom: 10px; margin-top: 10px; }
          .signature-line { border-top: 1px dotted #64748b; margin: 0 auto; width: 120px; margin-top: 40px; }
          .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
          .footer-text { margin-top: 10px; width: 80%; margin-left: auto; margin-right: auto; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="slip" data-slip-width="${slipWidthPx}">
          <div class="store">
            <h1>${escapeHtml(companyName)}</h1>
            <p>${escapeHtml(companyAddress)}</p>
          </div>
          <div class="meta">
            เลขที่: ${purchaseNo}<br/>
            ${memberName ? `สมาชิก: ${memberName}<br/>` : ''}
            ${memberCode ? `รหัสสมาชิก: ${memberCode}<br/>` : ''}
            วันที่พิมพ์: ${printDate}
          </div>
          ${items
            .map(
              (item) => `
                <div class="item">
                  <div>
                    <div class="item-meta">
                      ${item.productTypeName || item.category || 'ค่าใช้จ่าย'}
                      ${
                        item.type === 'purchase'
                          ? `<br/>น้ำหนักสุทธิ: ${formatNumber(item.netWeight || 0)} กก.`
                          : ''
                      }
                    </div>
                  </div>
                  <div class="item-amount">
                    ${formatCurrency(item.totalAmount)}
                    ${
                      item.type === 'purchase'
                        ? `<span class="price">@ ${formatNumber(item.finalPrice || 0)} /กก.</span>`
                        : ''
                    }
                  </div>
                </div>
              `
            )
            .join('')}
          <div class="total">
            <span>ยอดสุทธิ</span>
            <span>${formatCurrency(total)}</span>
          </div>
          <div class="signatures${paperSizeId === '58mm' ? ' signatures--stacked' : ''}">
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-label">ผู้จัดทำ</div>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-label">ผู้รับเงิน</div>
            </div>
          </div>
          <div class="footer">
            <div class="footer-text">
            กรุณาตรวจสอบนับเงินให้ตรงกับใบเสร็จรับเงินทุกครั้งก่อนมิฉะนั้นจะไม่รับผิดชอบใดๆทั้งสิ้นขอบคุณที่ใช้บริการค่ะ
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for slip/receipt from a purchase transaction
 */
export function generateSlipHTML(transaction: PurchaseTransaction): string {
  const items = transactionToCartItems(transaction);
  return generateSlipHTMLFromItems(items, {
    purchaseNo: transaction.purchaseNo,
    memberName: transaction.member.name,
    memberCode: transaction.member.code,
  });
}


