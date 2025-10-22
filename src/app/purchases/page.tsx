'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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

export default function PurchasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    memberId: '',
    productTypeId: '',
    grossWeight: '',
    containerWeight: '',
    rubberPercent: '',
    bonusPrice: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        loadPurchases(),
        loadMembers(),
        loadProductTypes(),
      ]);
    } catch (error) {
      console.error('Load data error:', error);
    }
  }, []);

  const loadPurchases = useCallback(async () => {
    try {
      const response = await axios.get('/api/purchases');
      setPurchases(response.data);
    } catch (error) {
      console.error('Load purchases error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const response = await axios.get('/api/members?active=true');
      setMembers(response.data);
    } catch (error) {
      console.error('Load members error:', error);
    }
  }, []);

  const loadProductTypes = useCallback(async () => {
    try {
      const response = await axios.get('/api/product-types');
      setProductTypes(response.data);
    } catch (error) {
      console.error('Load product types error:', error);
    }
  }, []);


  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!user) {
        setError('ไม่พบข้อมูลผู้ใช้งาน');
        return;
      }

      const purchaseData = {
        ...formData,
        grossWeight: parseFloat(formData.grossWeight),
        containerWeight: parseFloat(formData.containerWeight) || 0,
        rubberPercent: formData.rubberPercent ? parseFloat(formData.rubberPercent) : null,
        bonusPrice: parseFloat(formData.bonusPrice) || 0,
        locationId: null,
        userId: user.id,
      };

      await axios.post('/api/purchases', purchaseData);
      
      // Reset form and close modal
      setFormData({
        date: new Date().toISOString().split('T')[0],
        memberId: '',
        productTypeId: '',
        grossWeight: '',
        containerWeight: '',
        rubberPercent: '',
        bonusPrice: '',
        notes: '',
      });
      setShowForm(false);
      
      // Reload purchases
      await loadPurchases();
    } catch (error: any) {
      console.error('Submit purchase error:', error);
      setError(error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  const resetForm = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      memberId: '',
      productTypeId: '',
      grossWeight: '',
      containerWeight: '',
      rubberPercent: '',
      bonusPrice: '',
      notes: '',
    });
    setError('');
    setShowForm(false);
  }, []);

  const addToCart = useCallback(() => {
    if (!formData.memberId || !formData.productTypeId || !formData.grossWeight) {
      setError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }
    const member = members.find(m => m.id === formData.memberId);
    const productType = productTypes.find(pt => pt.id === formData.productTypeId);
    const grossWeight = parseFloat(formData.grossWeight) || 0;
    const containerWeight = parseFloat(formData.containerWeight) || 0;
    const netWeight = grossWeight - containerWeight;
    const rubberPercent = formData.rubberPercent ? parseFloat(formData.rubberPercent) : null;
    const dryWeight = rubberPercent ? (netWeight * rubberPercent) / 100 : netWeight;
    const bonusPrice = parseFloat(formData.bonusPrice) || 0;
    const basePrice = 0; // TODO: fetch from daily price
    const adjustedPrice = basePrice + bonusPrice;
    const finalPrice = adjustedPrice;
    const totalAmount = dryWeight * finalPrice;
    const item = {
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
      rubberPercent,
      bonusPrice,
      basePrice,
      adjustedPrice,
      finalPrice,
      totalAmount,
      notes: formData.notes,
    };
    setCart(prev => [...prev, item]);
    resetForm();
  }, [formData, members, productTypes, resetForm]);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const saveCartToDb = useCallback(async () => {
    if (!user || cart.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const promises = cart.map(item => axios.post('/api/purchases', {
        ...item,
        userId: user.id,
        locationId: null,
      }));
      await Promise.all(promises);
      setCart([]);
      await loadPurchases();
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  }, [user, cart, loadPurchases]);

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Purchase Entry Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-b border-gray-100 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">บันทึกการรับซื้อ</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">กรอกข้อมูลการรับซื้อน้ำยางและเพิ่มลงตะกร้า</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-red-700 dark:text-red-300 font-medium text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); addToCart(); }} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">ข้อมูลพื้นฐาน</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pl-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      วันที่รับซื้อ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      สมาชิก <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="memberId"
                      value={formData.memberId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                    >
                      <option value="">เลือกสมาชิก</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.code} - {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ประเภทสินค้า <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="productTypeId"
                      value={formData.productTypeId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                    >
                      <option value="">เลือกประเภทสินค้า</option>
                      {productTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.code} - {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Weight Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3-1m-3 1l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">ข้อมูลน้ำหนัก</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pl-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      น้ำหนักรวมภาชนะ (กก.) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        name="grossWeight"
                        value={formData.grossWeight}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">กก.</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      น้ำหนักภาชนะ (กก.)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        name="containerWeight"
                        value={formData.containerWeight}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">กก.</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      %ยาง (DRC)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        name="rubberPercent"
                        value={formData.rubberPercent}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="0.0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Notes */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">ข้อมูลราคา & หมายเหตุ</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ราคาบวกพิเศษ (บาท/กก.)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        name="bonusPrice"
                        value={formData.bonusPrice}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-16 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">บาท/กก.</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      หมายเหตุ
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 resize-none shadow-sm"
                      placeholder="หมายเหตุเพิ่มเติม..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-600">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium text-sm"
                >
                  รีเซ็ต
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center space-x-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    <span>เพิ่มลงตะกร้า</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-b border-gray-100 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ตะกร้า</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">รายการรับซื้อที่รอการบันทึก ({cart.length} รายการ)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={printCart}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>พิมพ์ PDF</span>
                    </div>
                  </button>
                  <button
                    onClick={saveCartToDb}
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>กำลังบันทึก...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>บันทึกลงฐานข้อมูล</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">วันที่รับซื้อ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">สมาชิก</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">ประเภทสินค้า</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">น้ำหนักแห้ง (กก.)</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">ราคา/กก.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">เงินที่ได้</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {cart.map((item, index) => (
                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'}`}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDate(item.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.memberName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.productTypeName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatNumber(item.dryWeight)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatNumber(item.finalPrice)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="px-3 py-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 text-sm font-medium"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-t-2 border-gray-200 dark:border-gray-500">
                    <td colSpan={5} className="px-6 py-4 text-right text-lg font-bold text-gray-900 dark:text-white">
                      รวมทั้งหมด
                    </td>
                    <td className="px-6 py-4 text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(cart.reduce((sum, item) => sum + item.totalAmount, 0))}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

