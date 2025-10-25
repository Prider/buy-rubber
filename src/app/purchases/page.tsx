'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchaseData } from '@/hooks/usePurchaseData';
import { usePurchaseForm } from '@/hooks/usePurchaseForm';
import { useCart } from '@/hooks/useCart';
import { PurchaseEntryCard } from '@/components/purchases/PurchaseEntryCard';
import { CartTable } from '@/components/purchases/CartTable';

export default function PurchasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Data loading hook
  const { loading, members, productTypes, dailyPrices, loadData, loadPurchases } = usePurchaseData();
  
  // Cart management hook
  const {
    cart,
    submitting,
    error: cartError,
    setError: setCartError,
    addToCart,
    removeFromCart,
    saveCartToDb,
    printCart,
    totalAmount,
  } = useCart({
    members,
    productTypes,
    user,
    loadPurchases,
  });

  // Form management hook
  const {
    formData,
    error: formError,
    setError: setFormError,
    memberSearchTerm,
    showMemberDropdown,
    selectedMember,
    filteredMembers,
    handleMemberSelect,
    handleMemberSearchChange,
    handleInputChange,
    calculateTotalAmount,
    isFormValid,
    resetForm,
    resetAllFields,
    clearMemberSearch,
    setShowMemberDropdown,
  } = usePurchaseForm({
    members,
    productTypes,
    dailyPrices,
  });

  // Handle adding item to cart
  const handleAddToCart = () => {
    if (!isFormValid()) {
      setFormError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }
    
    addToCart(formData);
    resetForm();
  };

  // Modal handlers
  const handleShowPrintModal = () => {
    setShowPrintModal(true);
  };

  const handlePrintConfirm = () => {
    printCart();
    setShowPrintModal(false);
  };

  const handlePrintCancel = () => {
    setShowPrintModal(false);
  };

  // Load data on mount
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router, loadData]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">รับซื้อยาง</h1>
        </div>
        {/* Purchase Entry Card */}
        <PurchaseEntryCard
          formData={formData}
          error={formError}
          members={members}
          productTypes={productTypes}
          memberSearchTerm={memberSearchTerm}
          showMemberDropdown={showMemberDropdown}
          selectedMember={selectedMember}
          filteredMembers={filteredMembers}
          isFormValid={isFormValid()}
          calculateTotalAmount={calculateTotalAmount}
          handleInputChange={handleInputChange}
          handleMemberSearchChange={handleMemberSearchChange}
          handleMemberSelect={handleMemberSelect}
          clearMemberSearch={clearMemberSearch}
          setShowMemberDropdown={setShowMemberDropdown}
          resetForm={resetAllFields}
          addToCart={handleAddToCart}
        />

        {/* Cart Table */}
        <CartTable
          cart={cart}
          submitting={submitting}
          totalAmount={totalAmount}
          printCart={printCart}
          saveCartToDb={saveCartToDb}
          removeFromCart={removeFromCart}
          onShowPrintModal={handleShowPrintModal}
        />
      </div>

      {/* Print Confirmation Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-md w-full mx-auto">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-600 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  บันทึกข้อมูลเรียบร้อยแล้ว
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    ข้อมูลถูกบันทึกลงฐานข้อมูลเรียบร้อยแล้ว
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    คุณต้องการพิมพ์เอกสารหรือไม่?
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handlePrintCancel}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                >
                  ไม่พิมพ์
                </button>
                <button
                  onClick={handlePrintConfirm}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>พิมพ์เอกสาร</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

