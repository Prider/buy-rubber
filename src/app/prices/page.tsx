'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ProductPrice {
  productTypeId: string;
  price: number;
}

export default function PricesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showProductTypeForm, setShowProductTypeForm] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    prices: [] as ProductPrice[],
  });
  const [productTypeForm, setProductTypeForm] = useState({
    code: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [productTypesRes, pricesRes] = await Promise.all([
        axios.get('/api/product-types'),
        axios.get('/api/prices/history?days=10'),
      ]);
      
      setProductTypes(productTypesRes.data || []);
      setPriceHistory(pricesRes.data || []);
      
      // Initialize form with product types
      if (productTypesRes.data?.length > 0) {
        setFormData(prev => ({
          ...prev,
          prices: productTypesRes.data.map((pt: ProductType) => ({
            productTypeId: pt.id,
            price: 0,
          })),
        }));
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one price is set
    const hasValidPrice = formData.prices.some(p => p.price > 0);
    if (!hasValidPrice) {
      alert('กรุณาระบุราคาอย่างน้อย 1 ประเภทสินค้า');
      return;
    }
    
    try {
      await axios.post('/api/prices/daily', formData);
      setShowForm(false);
      loadData();
      // Reset form to today's date
      setFormData(prev => ({
        date: new Date().toISOString().split('T')[0],
        prices: productTypes.map(pt => ({
          productTypeId: pt.id,
          price: 0,
        })),
      }));
    } catch (error: any) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const updatePrice = (productTypeId: string, price: number) => {
    setFormData(prev => ({
      ...prev,
      prices: prev.prices.map(p =>
        p.productTypeId === productTypeId ? { ...p, price } : p
      ),
    }));
  };

  const handleProductTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProductType) {
        // Update existing product type
        await axios.put(`/api/product-types/${editingProductType.id}`, {
          name: productTypeForm.name,
          description: productTypeForm.description,
        });
      } else {
        // Create new product type
        await axios.post('/api/product-types', productTypeForm);
      }
      
      setShowProductTypeForm(false);
      setEditingProductType(null);
      setProductTypeForm({ code: '', name: '', description: '' });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleEditProductType = (productType: ProductType) => {
    setEditingProductType(productType);
    setProductTypeForm({
      code: productType.code,
      name: productType.name,
      description: productType.description || '',
    });
    setShowProductTypeForm(true);
  };

  const handleDeleteProductType = async (productType: ProductType) => {
    if (!confirm(`คุณต้องการลบประเภทสินค้า "${productType.name}" (${productType.code}) หรือไม่?\n\nการลบนี้จะลบราคาที่เกี่ยวข้องทั้งหมด`)) {
      return;
    }

    try {
      await axios.delete(`/api/product-types/${productType.id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'ไม่สามารถลบประเภทสินค้าได้');
    }
  };

  const getLast10Days = () => {
    const days = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const getPriceForDateAndType = (date: string, productTypeId: string) => {
    const record = priceHistory.find(
      h => h.date.split('T')[0] === date && h.productTypeId === productTypeId
    );
    return record?.price || null;
  };

  const last10Days = getLast10Days();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Product Type Management */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-primary-100 dark:border-gray-700 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 dark:bg-primary-900 rounded-full -mr-32 -mt-32 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-100 dark:bg-blue-900 rounded-full -ml-24 -mb-24 opacity-20"></div>
          
          <div className="relative px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">📦</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    ประเภทสินค้า
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {productTypes.length} รายการ
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingProductType(null);
                  setProductTypeForm({ code: '', name: '', description: '' });
                  setShowProductTypeForm(true);
                }}
                className="group relative px-4 py-2 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border border-primary-200 dark:border-primary-700"
              >
                <span className="flex items-center space-x-1">
                  <span className="text-lg group-hover:scale-110 transition-transform">+</span>
                  <span>เพิ่มประเภท</span>
                </span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {productTypes.map((productType, index) => (
                <div
                  key={productType.id}
                  className="group relative"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative inline-flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg px-4 py-2.5 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border border-gray-200 dark:border-gray-700">
                    {/* Gradient accent */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-blue-500/10 dark:from-primary-500/20 dark:to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative flex items-center space-x-3">
                      <span className="text-xs font-bold font-mono bg-gradient-to-r from-primary-500 to-blue-600 text-transparent bg-clip-text px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {productType.code}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {productType.name}
                      </span>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="relative flex items-center space-x-1 ml-2 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handleEditProductType(productType)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                        title="แก้ไข"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteProductType(productType)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        title="ลบ"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              ตั้งราคาประกาศ
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการราคารับซื้อยางตามประเภท (10 วันล่าสุด)
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + ตั้งราคาวันนี้
          </button>
        </div>
        
        {/* Price History Table */}
        <div className="card overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
          ) : productTypes.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white dark:bg-gray-800 z-10">วันที่</th>
                  {productTypes.map((productType) => (
                    <th key={productType.id} className="text-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {productType.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {productType.code}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {last10Days.map((date, index) => (
                  <tr key={date}>
                    <td className="sticky left-0 bg-white dark:bg-gray-800 font-medium z-10">
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {formatDate(date)}
                        </span>
                        {index === 0 && (
                          <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                            วันนี้
                          </span>
                        )}
                      </div>
                    </td>
                    {productTypes.map((productType) => {
                      const price = getPriceForDateAndType(date, productType.id);
                      return (
                        <td key={productType.id} className="text-center">
                          {price !== null ? (
                            <span className={`font-medium ${
                              index === 0 
                                ? 'text-primary-600 dark:text-primary-400' 
                                : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {formatCurrency(price)}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">ยังไม่มีประเภทสินค้า</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Type Form Modal */}
      {showProductTypeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {editingProductType ? 'แก้ไขประเภทสินค้า' : 'เพิ่มประเภทสินค้า'}
                </h2>
                <button
                  onClick={() => {
                    setShowProductTypeForm(false);
                    setEditingProductType(null);
                    setProductTypeForm({ code: '', name: '', description: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <form onSubmit={handleProductTypeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    รหัสประเภท <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productTypeForm.code}
                    onChange={(e) => setProductTypeForm({ ...productTypeForm, code: e.target.value.toUpperCase() })}
                    className="input"
                    placeholder="เช่น FRESH, DRY"
                    required
                    disabled={!!editingProductType}
                    maxLength={10}
                  />
                  {editingProductType && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ไม่สามารถแก้ไขรหัสประเภทได้
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ชื่อประเภท <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productTypeForm.name}
                    onChange={(e) => setProductTypeForm({ ...productTypeForm, name: e.target.value })}
                    className="input"
                    placeholder="เช่น น้ำยางสด, ยางแห้ง"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={productTypeForm.description}
                    onChange={(e) => setProductTypeForm({ ...productTypeForm, description: e.target.value })}
                    className="input"
                    placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductTypeForm(false);
                      setEditingProductType(null);
                      setProductTypeForm({ code: '', name: '', description: '' });
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingProductType ? 'บันทึก' : 'เพิ่ม'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              ตั้งราคาประกาศ
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">วันที่</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                  ราคาตามประเภทสินค้า (บาท/กก.)
                </h3>
                <div className="space-y-3">
                  {productTypes.map((productType, index) => (
                    <div key={productType.id} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                            {productType.code}
                          </span>
                          {productType.name}
                        </label>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={formData.prices[index]?.price || ''}
                          onChange={(e) =>
                            updatePrice(productType.id, parseFloat(e.target.value) || 0)
                          }
                          className="input text-right"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกราคา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
