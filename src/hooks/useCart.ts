import { useState, useCallback } from 'react';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

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
    console.log('[useCart] saveCartToDb called, user:', user?.id, 'cart length:', cart.length);
    if (!user || cart.length === 0) {
      console.log('[useCart] Early return - no user or empty cart');
      return;
    }
    setSubmitting(true);
    setError('');
    
    try {
      console.log('[useCart] Processing cart items:', cart);
      const promises = cart.map((item, index) => {
        const payload = {
          date: item.date,
          memberId: item.memberId,
          productTypeId: item.productTypeId,
          userId: user.id,
          grossWeight: item.grossWeight, // น้ำหนักรวมภาชนะ
          containerWeight: item.containerWeight, // น้ำหนักภาชนะ
          rubberPercent: null, // Set to null since we removed rubber percent from UI
          pricePerUnit: item.pricePerUnit, // Include the price per unit
          bonusPrice: item.bonusPrice,
          notes: item.notes,
        };
        console.log(`[useCart] Sending item ${index + 1}:`, payload);
        
        return fetch('/api/purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      });
      
      console.log('[useCart] Waiting for API responses...');
      const responses = await Promise.all(promises);
      console.log('[useCart] Received responses:', responses.map(r => ({ status: r.status, ok: r.ok })));
      
      // Check if any request failed
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) {
        console.error('[useCart] Some requests failed:', failedResponses);
        const errorData = await failedResponses[0].json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
      
      console.log('[useCart] All requests successful, clearing cart and reloading purchases');
      setCart([]);
      await loadPurchases();
      console.log('[useCart] Cart cleared and purchases reloaded');
    } catch (err: any) {
      console.error('[useCart] Save cart error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  }, [user, cart, loadPurchases]);

  // Print cart as PDF
  const printCart = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>รายการรับซื้อ</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>รายการรับซื้อ</h1>
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>สมาชิก</th>
                <th>ประเภทสินค้า</th>
                <th>น้ำหนักแห้ง (กก.)</th>
                <th>ราคา/กก.</th>
                <th>เงินที่ได้</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => `
                <tr>
                  <td>${item.date}</td>
                  <td>${item.memberName}</td>
                  <td>${item.productTypeName}</td>
                  <td>${formatNumber(item.dryWeight)}</td>
                  <td>${formatNumber(item.finalPrice)}</td>
                  <td>${formatCurrency(item.totalAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total">
                <td colspan="5">รวม</td>
                <td>${formatCurrency(cart.reduce((sum, item) => sum + item.totalAmount, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
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
    totalAmount,
  };
};
