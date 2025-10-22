'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadPurchases(),
        loadMembers(),
        loadProductTypes(),
      ]);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await axios.get('/api/purchases');
      setPurchases(response.data);
    } catch (error) {
      console.error('Load purchases error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await axios.get('/api/members?active=true');
      setMembers(response.data);
    } catch (error) {
      console.error('Load members error:', error);
    }
  };

  const loadProductTypes = async () => {
    try {
      const response = await axios.get('/api/product-types');
      setProductTypes(response.data);
    } catch (error) {
      console.error('Load product types error:', error);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const resetForm = () => {
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
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รับซื้อน้ำยาง</h1>
            <p className="text-gray-600 mt-1">จัดการรายการรับซื้อน้ำยาง</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            + บันทึกการรับซื้อ
          </button>
        </div>

        {/* Purchases Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">กำลังโหลด...</p>
            </div>
          ) : purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>เลขที่</th>
                    <th>วันที่</th>
                    <th>สมาชิก</th>
                    <th>ประเภท</th>
                    <th>น้ำหนักแห้ง (กก.)</th>
                    <th>%ยาง</th>
                    <th>ราคา/กก.</th>
                    <th>ยอดเงิน</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="font-medium">{purchase.purchaseNo}</td>
                      <td>{formatDate(purchase.date)}</td>
                      <td>{purchase.member?.name}</td>
                      <td>{purchase.productType?.name}</td>
                      <td>{formatNumber(purchase.dryWeight)}</td>
                      <td>
                        {purchase.rubberPercent
                          ? formatNumber(purchase.rubberPercent, 1) + '%'
                          : '-'}
                      </td>
                      <td>{formatNumber(purchase.finalPrice)}</td>
                      <td className="font-semibold text-green-600">
                        {formatCurrency(purchase.totalAmount)}
                      </td>
                      <td>
                        {purchase.isPaid ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            จ่ายแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            ค้างจ่าย
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">ยังไม่มีรายการรับซื้อ</p>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">บันทึกการรับซื้อ</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">กรอกข้อมูลการรับซื้อน้ำยาง</p>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-600/50 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ข้อมูลพื้นฐาน</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pl-11">
                    {/* Date */}
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                      />
                    </div>

                    {/* Member */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        สมาชิก <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="memberId"
                        value={formData.memberId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                      >
                        <option value="">เลือกสมาชิก</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.code} - {member.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Product Type */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        ประเภทสินค้า <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="productTypeId"
                        value={formData.productTypeId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
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

                {/* Weight Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3-1m-3 1l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ข้อมูลน้ำหนัก</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pl-11">
                    {/* Gross Weight */}
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
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">กก.</span>
                        </div>
                      </div>
                    </div>

                    {/* Container Weight */}
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
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">กก.</span>
                        </div>
                      </div>
                    </div>

                    {/* Rubber Percent */}
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
                          className="w-full px-4 py-3 pr-8 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                          placeholder="0.0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ข้อมูลราคา</h3>
                  </div>
                  
                  <div className="pl-11">
                    {/* Bonus Price */}
                    <div className="space-y-2 max-w-md">
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
                          className="w-full px-4 py-3 pr-16 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">บาท/กก.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">หมายเหตุ</h3>
                  </div>
                  
                  <div className="pl-11">
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 resize-none"
                      placeholder="หมายเหตุเพิ่มเติม..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none"
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
                        <span>บันทึกการรับซื้อ</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

