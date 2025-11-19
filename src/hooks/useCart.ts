import { useState, useCallback } from 'react';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { logger } from '@/lib/logger';

interface CartItem {
  id: string;
  type: 'purchase' | 'expense';
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
  // Expense fields
  category?: string;
  amount?: number;
  description?: string;
  // Common fields
  totalAmount: number; // Positive for purchases, negative for expenses
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

interface ExpenseFormData {
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

  // Add expense item to cart
  const addExpenseToCart = useCallback((formData: ExpenseFormData) => {
    const amount = parseFloat(formData.amount) || 0;
    const totalAmount = -Math.abs(amount); // Negative value for expenses
    
    const item: CartItem = {
      id: `expense-${Date.now()}`,
      type: 'expense',
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
      const promises = cart.map((item, index) => {
        if (item.type === 'expense') {
          const payload = {
            date: item.date,
            category: item.category,
            amount: item.amount,
          };
          logger.debug(`Sending expense ${index + 1}`, payload);
          
          return fetch('/api/expenses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
        } else {
          const payload = {
            date: item.date,
            memberId: item.memberId,
            productTypeId: item.productTypeId,
            userId: user.id,
            grossWeight: item.grossWeight, // น้ำหนักรวมภาชนะ
            containerWeight: item.containerWeight, // น้ำหนักภาชนะ
            netWeight: item.netWeight, // น้ำหนักสุทธิ (already calculated)
            rubberPercent: null, // Set to null since we removed rubber percent from UI
            pricePerUnit: item.pricePerUnit, // Include the price per unit
            bonusPrice: item.bonusPrice,
            notes: item.notes,
          };
          logger.debug(`Sending purchase ${index + 1}`, payload);
          
          return fetch('/api/purchases', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
        }
      });
      
      logger.debug('Waiting for API responses');
      const responses = await Promise.all(promises);
      logger.debug('Received responses', { responses: responses.map(r => ({ status: r.status, ok: r.ok })) });
      
      // Check if any request failed
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) {
        logger.error('Some requests failed', undefined, { failedResponses });
        const errorData = await failedResponses[0].json();
        // Include full error details for debugging
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'เกิดข้อผิดพลาดในการบันทึก';
        logger.error('Purchase API error details', undefined, errorData);
        throw new Error(errorMessage);
      }
      
      logger.debug('All requests successful, clearing cart and reloading purchases');
      setLastPrintedCart(cart);
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
    return `
      <html>
        <head>
          <title>รายการรับซื้อ</title>
          <meta charset="UTF-8">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', Arial, sans-serif; margin: 20px; color: #000000; }
            h1 { text-align: center; color: #333; margin: 20px; text-size}
            .info { margin: 20px 40px; }
            .table-wrapper { margin: 12px 36px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; color: #000000; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; color: #000000; }
            th { background-color: #f2f2f2; font-weight: bold; color: #000000; }
            th.member-column, td.member-column { width: 180px; }
            td.number { text-align: right; }
            .total { font-weight: bold; background-color: #f9f9f9; }
            .footer { text-align: right; margin: 30px 40px;}
          </style>
        </head>
        <body>
          <h1>รายการรับซื้อยาง</h1>
          <div class="info">
            <p><strong>วันที่พิมพ์:</strong> ${new Date().toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>วันที่รับซื้อ</th>
                <th class="member-column">สมาชิก</th>
                <th>ประเภทสินค้า</th>
                <th style="text-align: right;">น้ำหนักรวมภาชนะ (กก.)</th>
                <th style="text-align: right;">น้ำหนักภาชนะ (กก.)</th>
                <th style="text-align: right;">น้ำหนักสุทธิ (กก.)</th>
                <th style="text-align: right;">ราคา/กก.</th>
                <th style="text-align: right;">เงินที่ได้</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString('th-TH')}</td>
                  <td class="member-column">${item.memberName}</td>
                  <td>${item.productTypeName}</td>
                  <td class="number">${formatNumber(item.grossWeight)}</td>
                  <td class="number">${formatNumber(item.containerWeight)}</td>
                  <td class="number">${formatNumber(item.netWeight)}</td>
                  <td class="number">${formatNumber(item.finalPrice)}</td>
                  <td class="number">${formatCurrency(item.totalAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total">
                <td colspan="7" style="text-align: right;">รวมทั้งหมด</td>
                <td class="number">${formatCurrency(data.reduce((sum, item) => sum + item.totalAmount, 0))}</td>
              </tr>
            </tfoot>
          </table>
          </div>
          <div class="footer">
            <p>________________________</p>
            <p>ผู้จัดการ/เจ้าหน้าที่</p>
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

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = generateCartHTML(data);
    if (!html) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
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

    const doc = new jsPDF('p', 'mm', 'a4');
    const html = generateCartHTML(data);

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '0';
    container.style.width = '794px';
    container.style.color = '#000000';
    container.style.filter = 'none';
    container.style.webkitFilter = 'none';
    container.style.background = '#ffffff';
    document.body.appendChild(container);

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 100);
    });

    const canvas = await html2canvas(container, { scale: 1, useCORS: true });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const fileName = `รายการรับซื้อ_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  }, [cart, lastPrintedCart, generateCartHTML]);

  // Calculate total amount
  const totalAmount = cart.reduce((sum, item) => sum + item.totalAmount, 0);

  return {
    cart,
    submitting,
    error,
    setError,
    addToCart,
    addExpenseToCart,
    removeFromCart,
    clearCart,
    saveCartToDb,
    printCart,
    previewCart,
    downloadPDF,
    totalAmount,
  };
};
