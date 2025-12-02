import { useState, useCallback } from 'react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { generatePDFFromHTML, printHTML } from '@/components/purchases/utils/pdfGenerator';

interface CartItem {
  id: string;
  type: 'purchase' | 'serviceFee';
  date: string;
  // Purchase fields
  memberId?: string;
  memberName?: string;
  memberCode?: string;
  productTypeId?: string;
  productTypeName?: string;
  productTypeCode?: string;
  grossWeight?: number; // น้ำหนักรวมภาชนะ
  containerWeight?: number; // น้ำหนักภาชนะ
  netWeight?: number; // น้ำหนักสุทธิ
  dryWeight?: number;
  pricePerUnit?: number;
  bonusPrice?: number;
  basePrice?: number;
  adjustedPrice?: number;
  finalPrice?: number;
  // Service fee fields
  category?: string;
  amount?: number;
  description?: string;
  // Common fields
  totalAmount: number; // Positive for purchases, negative for service fees
  notes?: string;
}

interface Member {
  id: string;
  code: string;
  name: string;
  ownerPercent: number;
  tapperPercent: number;
}

interface ProductType {
  id: string;
  code: string;
  name: string;
}

interface PurchaseFormData {
  date: string;
  memberId: string;
  productTypeId: string;
  grossWeight: string; // น้ำหนักรวมภาชนะ
  containerWeight: string; // น้ำหนักภาชนะ
  netWeight: string; // น้ำหนักสุทธิ (calculated)
  pricePerUnit: string;
  bonusPrice: string;
  notes: string;
}

interface ServiceFeeFormData {
  category: string;
  amount: string;
}

interface UseCartProps {
  members: Member[];
  productTypes: ProductType[];
  user: any;
  loadPurchases: () => Promise<void>;
}

export const useCart = ({ members, productTypes, user, loadPurchases }: UseCartProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastPrintedCart, setLastPrintedCart] = useState<CartItem[]>([]);
  const [lastPurchaseNo, setLastPurchaseNo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Add purchase item to cart
  const addToCart = useCallback((formData: PurchaseFormData) => {
    const member = members.find(m => m.id === formData.memberId);
    const productType = productTypes.find(pt => pt.id === formData.productTypeId);
    const grossWeight = parseFloat(formData.grossWeight) || 0; // น้ำหนักรวมภาชนะ
    const containerWeight = parseFloat(formData.containerWeight) || 0; // น้ำหนักภาชนะ
    const netWeight = parseFloat(formData.netWeight) || 0; // น้ำหนักสุทธิ
    const dryWeight = netWeight; // For now, dry weight equals net weight
    const pricePerUnit = parseFloat(formData.pricePerUnit) || 0;
    const bonusPrice = parseFloat(formData.bonusPrice) || 0;
    const basePrice = pricePerUnit;
    const adjustedPrice = basePrice + bonusPrice;
    const finalPrice = adjustedPrice;
    const totalAmount = netWeight * finalPrice; // Use netWeight for calculation
    
    const item: CartItem = {
      id: Date.now().toString(),
      type: 'purchase',
      date: formData.date,
      memberId: formData.memberId,
      memberName: member?.name || '',
      memberCode: member?.code || '',
      productTypeId: formData.productTypeId,
      productTypeName: productType?.name || '',
      productTypeCode: productType?.code || '',
      grossWeight,
      containerWeight,
      netWeight,
      dryWeight,
      pricePerUnit,
      bonusPrice,
      basePrice,
      adjustedPrice,
      finalPrice,
      totalAmount,
      notes: formData.notes,
    };
    
    setCart(prev => [...prev, item]);
  }, [members, productTypes]);

  // Add service fee item to cart
  const addServiceFeeToCart = useCallback((formData: ServiceFeeFormData) => {
    const amount = parseFloat(formData.amount) || 0;
    const totalAmount = -Math.abs(amount); // Negative value for service fees
    
    const item: CartItem = {
      id: `serviceFee-${Date.now()}`,
      type: 'serviceFee',
      date: new Date().toISOString().split('T')[0], // Use current date
      category: formData.category,
      amount: amount,
      totalAmount, // Negative value
    };
    
    setCart(prev => [...prev, item]);
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Save cart to database
  const saveCartToDb = useCallback(async () => {
    logger.debug('saveCartToDb called', { userId: user?.id, cartLength: cart.length });
    if (!user || cart.length === 0) {
      logger.debug('Early return - no user or empty cart');
      return;
    }
    setSubmitting(true);
    setError('');
    
    try {
      logger.debug('Processing cart items', { cart });
      
      if (cart.length === 0) {
        logger.debug('No items to save');
        return;
      }
      // Separate purchase items and service fee items
      const purchaseItems = cart.filter(item => item.type === 'purchase');
      const serviceFeeItems = cart.filter(item => item.type === 'serviceFee');
      
      logger.debug('Cart items separated', { 
        totalItems: cart.length, 
        purchaseCount: purchaseItems.length, 
        serviceFeeCount: serviceFeeItems.length 
      });
      
      let purchaseNo: string | null = null;
      
      // 1. Save purchase items first (if any)
      if (purchaseItems.length > 0) {
        // Use the first purchase item's date for batch purchase number generation
        const batchDate = purchaseItems[0]?.date || new Date().toISOString().split('T')[0];
        
        // Convert purchase items to API format
        const purchasePayloadItems = purchaseItems.map((item) => ({
          date: item.date,
          memberId: item.memberId,
          productTypeId: item.productTypeId,
          grossWeight: item.grossWeight, // น้ำหนักรวมภาชนะ
          containerWeight: item.containerWeight, // น้ำหนักภาชนะ
          netWeight: item.netWeight, // น้ำหนักสุทธิ (already calculated)
          rubberPercent: null, // Set to null since we removed rubber percent from UI
          pricePerUnit: item.pricePerUnit, // Include the price per unit
          bonusPrice: item.bonusPrice,
          notes: item.notes,
        }));
        
        // Prepare batch payload
        const batchPayload = {
          items: purchasePayloadItems,
          userId: user.id,
          date: batchDate,
        };
        
        logger.debug('Sending batch purchase request', { itemCount: purchaseItems.length, date: batchDate });
        
        const response = await fetch('/api/purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batchPayload),
        });
        
        logger.debug('Received batch response', { status: response.status, ok: response.ok });
        
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.details 
            ? `${errorData.error}: ${errorData.details}`
            : errorData.error || 'เกิดข้อผิดพลาดในการบันทึกการรับซื้อ';
          logger.error('Batch purchase API error details', undefined, errorData);
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        purchaseNo = result.purchaseNo;
        logger.debug('Batch purchase successful', { purchaseNo, count: result.purchases?.length });
      }
      
      // 2. Save service fee items to servicefees API (if any)
      if (serviceFeeItems.length > 0) {
        logger.debug('Sending service fee items to servicefees API', { 
          count: serviceFeeItems.length, 
          purchaseNo 
        });
        
        // Convert service fee items to API format
        const serviceFeePayloadItems = serviceFeeItems.map((item) => ({
          category: item.category || 'ค่าบริการ',
          amount: Math.abs(item.amount || 0),
          notes: item.notes || null,
          date: item.date,
        }));
        
        // Prepare batch payload for service fees
        const serviceFeePayload = {
          items: serviceFeePayloadItems,
          purchaseNo: purchaseNo, // Link to purchase transaction (same cart)
        };
        
        const response = await fetch('/api/servicefees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serviceFeePayload),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.details 
            ? `${errorData.error}: ${errorData.details}`
            : errorData.error || 'เกิดข้อผิดพลาดในการบันทึกค่าบริการ';
          logger.error('ServiceFee API error details', undefined, errorData);
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        logger.debug('All service fees saved successfully', { count: result.serviceFees?.length });
      }
      
      // Clear cart and reload purchases (even if only service fees were present)
      logger.debug('All requests successful, clearing cart and reloading purchases');
      setLastPrintedCart(cart);
      setLastPurchaseNo(purchaseNo); // Store purchaseNo for PDF filename
      setCart([]);
      await loadPurchases();
      logger.debug('Cart cleared and purchases reloaded');
    } catch (err: any) {
      logger.error('Failed to save cart', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  }, [user, cart, loadPurchases]);

  // Generate HTML for printing/downloading
  const generateCartHTML = useCallback((data: CartItem[]) => {
    if (data.length === 0) {
      return '';
    }

    const total = data.reduce((sum, item) => sum + item.totalAmount, 0);
    const printDate = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Get member info from first purchase item that has member data
    const firstPurchaseItem = data.find(item => item.memberName && item.memberCode);
    const memberName = firstPurchaseItem?.memberName || '';
    const memberCode = firstPurchaseItem?.memberCode || '';

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
            .slip { width: 320px; margin: 16px 16px; background: #ffffff !important; border-radius: 12px; padding: 16px 18px; box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
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
              เลขที่: ${Date.now()}<br/>
              ${memberName ? `สมาชิก: ${memberName}<br/>` : ''}
              ${memberCode ? `รหัสสมาชิก: ${memberCode}<br/>` : ''}
              วันที่พิมพ์: ${printDate}
            </div>
            ${data
              .map(
                (item) => `
                  <div class="item">
                    <div>
                      <div class="item-meta">
                        ${item.productTypeName || 'ค่าใช้จ่าย'}
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
  }, []);

  // Print cart
  const printCart = useCallback(() => {
    const data = cart.length > 0 ? cart : lastPrintedCart;
    if (data.length === 0) {
      window.alert('ไม่มีข้อมูลในตะกร้าให้พิมพ์');
      return;
    }

    const html = generateCartHTML(data);
    if (!html) return;
    printHTML(html);
  }, [cart, lastPrintedCart, generateCartHTML]);

  const previewCart = useCallback(() => {
    const data = cart.length > 0 ? cart : lastPrintedCart;
    if (data.length === 0) {
      window.alert('ไม่มีข้อมูลในตะกร้าให้ดูตัวอย่าง');
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      return;
    }

    const html = generateCartHTML(data);
    previewWindow.document.write(html);
    previewWindow.document.close();
  }, [cart, lastPrintedCart, generateCartHTML]);

  // Download cart as PDF
  const downloadPDF = useCallback(async () => {
    const data = cart.length > 0 ? cart : lastPrintedCart;
    if (data.length === 0) {
      window.alert('ไม่มีข้อมูลในตะกร้าให้ดาวน์โหลด');
      return;
    }

    const html = generateCartHTML(data);
    const dateStr = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
    const fileName = lastPurchaseNo 
      ? `รายการรับซื้อ_${lastPurchaseNo}_${dateStr}.pdf`
      : `รายการรับซื้อ_${dateStr}.pdf`;

    await generatePDFFromHTML(html, fileName);
  }, [cart, lastPrintedCart, lastPurchaseNo, generateCartHTML]);

  // Calculate total amount
  const totalAmount = cart.reduce((sum, item) => sum + item.totalAmount, 0);

  return {
    cart,
    submitting,
    error,
    setError,
    addToCart,
    addServiceFeeToCart,
    removeFromCart,
    clearCart,
    saveCartToDb,
    printCart,
    previewCart,
    downloadPDF,
    totalAmount,
  };
};
