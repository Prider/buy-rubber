import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { generatePDFFromHTML, printHTML } from '@/components/purchases/utils/pdfGenerator';
import { generateSlipHTMLFromItems } from '@/components/purchases/utils/slipGenerator';

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
    if (!user || !user.id) {
      const errorMsg = 'ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่';
      logger.error('User not available in saveCartToDb', { user: user ? 'exists but no id' : 'null/undefined' });
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    logger.debug('saveCartToDb called', { userId: user.id, username: user.username, cartLength: cart.length });
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
    return generateSlipHTMLFromItems(data);
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
