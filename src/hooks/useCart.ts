import { useState, useCallback } from 'react';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logger } from '@/lib/logger';

interface CartItem {
  id: string;
  date: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  productTypeId: string;
  productTypeName: string;
  productTypeCode: string;
  grossWeight: number; // น้ำหนักรวมภาชนะ
  containerWeight: number; // น้ำหนักภาชนะ
  netWeight: number; // น้ำหนักสุทธิ
  dryWeight: number;
  pricePerUnit: number;
  bonusPrice: number;
  basePrice: number;
  adjustedPrice: number;
  finalPrice: number;
  totalAmount: number;
  notes: string;
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

interface UseCartProps {
  members: Member[];
  productTypes: ProductType[];
  user: any;
  loadPurchases: () => Promise<void>;
}

export const useCart = ({ members, productTypes, user, loadPurchases }: UseCartProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Add item to cart
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
        logger.debug(`Sending item ${index + 1}`, payload);
        
        return fetch('/api/purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      });
      
      logger.debug('Waiting for API responses');
      const responses = await Promise.all(promises);
      logger.debug('Received responses', { responses: responses.map(r => ({ status: r.status, ok: r.ok })) });
      
      // Check if any request failed
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) {
        logger.error('Some requests failed', undefined, { failedResponses });
        const errorData = await failedResponses[0].json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
      
      logger.debug('All requests successful, clearing cart and reloading purchases');
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
  const generateCartHTML = useCallback(() => {
    return `
      <html>
        <head>
          <title>รายการรับซื้อ</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Sarabun', Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #333; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            td.number { text-align: right; }
            .total { font-weight: bold; background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: right; }
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
          <table>
            <thead>
              <tr>
                <th>วันที่รับซื้อ</th>
                <th>สมาชิก</th>
                <th>ประเภทสินค้า</th>
                <th style="text-align: right;">น้ำหนักรวมภาชนะ (กก.)</th>
                <th style="text-align: right;">น้ำหนักภาชนะ (กก.)</th>
                <th style="text-align: right;">น้ำหนักสุทธิ (กก.)</th>
                <th style="text-align: right;">ราคา/กก.</th>
                <th style="text-align: right;">เงินที่ได้</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString('th-TH')}</td>
                  <td>${item.memberName}</td>
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
                <td class="number">${formatCurrency(cart.reduce((sum, item) => sum + item.totalAmount, 0))}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer">
            <p>________________________</p>
            <p>ผู้จัดการ/เจ้าหน้าที่</p>
          </div>
        </body>
      </html>
    `;
  }, [cart]);

  // Print cart
  const printCart = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = generateCartHTML();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }, [generateCartHTML]);

  // Download cart as PDF
  const downloadPDF = useCallback(() => {
    const doc = new jsPDF();
    
    // Set Thai font (using default font, but you can add Thai font if needed)
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(18);
    doc.text('รายการรับซื้อยาง', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    // Date and time
    doc.setFontSize(10);
    const dateStr = new Date().toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`วันที่พิมพ์: ${dateStr}`, 14, 30);
    
    // Prepare table data
    const tableData = cart.map(item => [
      new Date(item.date).toLocaleDateString('th-TH'),
      item.memberName,
      item.productTypeName,
      formatNumber(item.grossWeight),
      formatNumber(item.containerWeight),
      formatNumber(item.netWeight),
      formatNumber(item.finalPrice),
      formatCurrency(item.totalAmount)
    ]);
    
    // Generate table
    autoTable(doc, {
      head: [[
        'วันที่รับซื้อ',
        'สมาชิก',
        'ประเภทสินค้า',
        'น้ำหนักรวมภาชนะ\n(กก.)',
        'น้ำหนักภาชนะ\n(กก.)',
        'น้ำหนักสุทธิ\n(กก.)',
        'ราคา/กก.',
        'เงินที่ได้'
      ]],
      body: tableData,
      startY: 35,
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
      foot: [[
        { content: 'รวมทั้งหมด', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(cart.reduce((sum, item) => sum + item.totalAmount, 0)), styles: { halign: 'right', fontStyle: 'bold' } }
      ]],
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      }
    });
    
    // Footer signature
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.text('________________________', doc.internal.pageSize.getWidth() - 60, finalY + 30);
    doc.text('ผู้จัดการ/เจ้าหน้าที่', doc.internal.pageSize.getWidth() - 55, finalY + 35);
    
    // Save the PDF
    const fileName = `รายการรับซื้อ_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  }, [cart]);

  // Calculate total amount
  const totalAmount = cart.reduce((sum, item) => sum + item.totalAmount, 0);

  return {
    cart,
    submitting,
    error,
    setError,
    addToCart,
    removeFromCart,
    clearCart,
    saveCartToDb,
    printCart,
    downloadPDF,
    totalAmount,
  };
};
