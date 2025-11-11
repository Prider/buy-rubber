'use client';

import { useState } from 'react';
import axios from 'axios';
import { usePriceData } from '@/hooks/usePriceData';
import ProductTypeManagement from '@/components/prices/ProductTypeManagement';
import TodayPricesDisplay from '@/components/prices/TodayPricesDisplay';
import PriceHistoryTable from '@/components/prices/PriceHistoryTable';
import ProductTypeFormModal from '@/components/prices/ProductTypeFormModal';
import SetPriceFormModal from '@/components/prices/SetPriceFormModal';

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
  const { loading, productTypes, loadData, getPriceForDateAndType } = usePriceData();
  
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

  // Initialize form prices when productTypes load
  const initializeFormPrices = (types: ProductType[]) => {
    const todayDate = new Date().toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      prices: types.map(pt => {
        // Use current price if exists, otherwise 0
        const currentPrice = getPriceForDateAndType(todayDate, pt.id);
        return {
          productTypeId: pt.id,
          price: currentPrice || 0,
        };
      }),
    }));
  };

  // Check if any price has been changed from today's value
  const hasPriceChanges = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    
    return formData.prices.some(p => {
      const currentPrice = getPriceForDateAndType(todayDate, p.productTypeId);
      
      if (currentPrice === null && p.price > 0) {
        return true;
      }
      
      if (currentPrice !== null && Math.abs(currentPrice - p.price) > 0.001) {
        return true;
      }
      
      return false;
    });
  };

  // Price form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasValidPrice = formData.prices.some(p => p.price > 0);
    if (!hasValidPrice) {
      alert('กรุณาระบุราคาอย่างน้อย 1 ประเภทสินค้า');
      return;
    }
    
    console.log('[Price Form] Submitting:', formData);
    
    try {
      const response = await axios.post('/api/prices/daily', formData);
      console.log('[Price Form] Success:', response.data);
      
      setShowForm(false);
      
      // Force reload data to show updated prices
      await loadData();
      
      // Reset form with current prices (just loaded)
      const todayDate = new Date().toISOString().split('T')[0];
      setFormData({
        date: todayDate,
        prices: productTypes.map(pt => ({
          productTypeId: pt.id,
          price: getPriceForDateAndType(todayDate, pt.id) || 0,
        })),
      });
      
      alert(`บันทึกราคาสำเร็จ: ${response.data.count} รายการ`);
    } catch (error: any) {
      console.error('[Price Form] Error:', error);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || 'เกิดข้อผิดพลาด';
      alert(`ไม่สามารถบันทึกราคาได้: ${errorMsg}`);
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

  const handleOpenPriceForm = () => {
    initializeFormPrices(productTypes);
    setShowForm(true);
  };

  // Product type handlers
  const handleProductTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProductType) {
        await axios.put(`/api/product-types/${editingProductType.id}`, {
          name: productTypeForm.name,
          description: productTypeForm.description,
        });
      } else {
        await axios.post('/api/product-types', productTypeForm);
      }
      
      closeProductTypeForm();
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

  const openProductTypeForm = () => {
    setEditingProductType(null);
    setProductTypeForm({ code: '', name: '', description: '' });
    setShowProductTypeForm(true);
  };

  const closeProductTypeForm = () => {
    setShowProductTypeForm(false);
    setEditingProductType(null);
    setProductTypeForm({ code: '', name: '', description: '' });
  };

  const handleProductTypeFormChange = (field: string, value: string) => {
    setProductTypeForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className="space-y-6">
        {/* Product Type Management */}
        <ProductTypeManagement
          productTypes={productTypes}
          onAdd={openProductTypeForm}
          onEdit={handleEditProductType}
          onDelete={handleDeleteProductType}
        />

        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
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
            <button
              onClick={handleOpenPriceForm}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
              aria-disabled="true"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>ตั้งราคาวันนี้</span>
              </div>
            </button>
          </div>

          {/* Today's Prices */}
          <TodayPricesDisplay
            productTypes={productTypes}
            getPriceForDateAndType={getPriceForDateAndType}
          />

          {/* Price History Table */}
          <PriceHistoryTable
            productTypes={productTypes}
            getPriceForDateAndType={getPriceForDateAndType}
            loading={loading}
          />
          <div className="absolute inset-0 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm pointer-events-auto"></div>
        </div>
      </div>

      {/* Product Type Form Modal */}
      <ProductTypeFormModal
        isOpen={showProductTypeForm}
        editingProductType={editingProductType}
        formData={productTypeForm}
        onClose={closeProductTypeForm}
        onSubmit={handleProductTypeSubmit}
        onChange={handleProductTypeFormChange}
      />

      {/* Set Price Form Modal */}
      <SetPriceFormModal
        isOpen={showForm}
        formData={formData}
        productTypes={productTypes}
        getPriceForDateAndType={getPriceForDateAndType}
        hasPriceChanges={hasPriceChanges}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        onDateChange={(date) => setFormData({ ...formData, date })}
        onPriceChange={updatePrice}
      />
    </>
  );
}
