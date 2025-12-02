import { formatCurrency, formatNumber } from '@/lib/utils';
import { PurchaseTransaction, CartItem } from '../types';

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
 * Generate HTML for slip/receipt
 */
export function generateSlipHTML(transaction: PurchaseTransaction): string {
  const items = transactionToCartItems(transaction);
  const total = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const printDate = new Date().toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const memberName = transaction.member.name;
  const memberCode = transaction.member.code;

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
          html { background: #ffffff !important; margin: 0; padding: 0; }
          body { font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', Arial, sans-serif; margin: 0; padding: 0; background: #ffffff !important; width: 100%; height: 100%; }
          .slip { width: 320px; margin: 16px 16px; background: #ffffff !important; border-radius: 12px; padding: 16px 18px; box-shadow: 0 6px 16px rgba(0,0,0,0.08);}
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
          .signatures { display: flex; justify-content: space-between; padding-top: 16px;}
          .signature { flex: 1; text-align: center; }
          .signature-label { font-size: 12px; color: #475569; margin-bottom: 10px; margin-top: 10px; }
          .signature-line { border-top: 1px dotted #64748b; margin: 0 auto; width: 120px; margin-top: 40px; }
          .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
          .footer-text { margin-top: 10px; width: 80%; margin-left: auto; margin-right: auto; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="slip">
          <div class="store">
            <h1>สินทวี</h1>
            <p>171/5 ม.8 ต.ชะมาย อ.ทุ่งสง จ.นครศรีฯ</p>
          </div>
          <div class="meta">
            เลขที่: ${transaction.purchaseNo}<br/>
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
          <div class="signatures">
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


