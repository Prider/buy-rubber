'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchaseData } from '@/hooks/usePurchaseData';
import { usePurchaseForm } from '@/hooks/usePurchaseForm';
import { useExpenseForm as useServiceFeeForm } from '@/hooks/useExpenseForm';
import { useCart } from '@/hooks/useCart';
import { PurchaseEntryCard } from '@/components/purchases/PurchaseEntryCard';
import { ServiceFeeCard } from '@/components/purchases/ServiceFeeCard';
import { CartTable } from '@/components/purchases/CartTable';
import GamerLoader from '@/components/GamerLoader';

export default function PurchasesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Data loading hook
  const { loading: _loading, members, productTypes, dailyPrices, loadData, loadPurchases } = usePurchaseData();
  
  // Cart management hook
  const {
    cart,
    submitting,
    error: cartError,
    setError: setCartError,
    addToCart,
    addServiceFeeToCart,
    removeFromCart,
    saveCartToDb,
    printCart,
    previewCart,
    downloadPDF,
    totalAmount,
    clearCart,
  } = useCart({
    members,
    productTypes,
    user,
    loadPurchases,
  });

  // Purchase form management hook
  const {
    formData,
    error: formError,
    setError: setFormError,
    memberSearchTerm,
    showMemberDropdown,
    selectedMember,
    filteredMembers,
    recentPurchases,
    handleMemberSelect,
    handleMemberSearchChange,
    handleInputChange,
    calculateTotalAmount,
    isFormValid,
    resetForm,
    resetAllFields,
    clearMemberSearch,
    applySuggestedPrice,
    setShowMemberDropdown,
    productTypeSearchTerm,
    showProductTypeDropdown,
    selectedProductType,
    filteredProductTypes,
    handleProductTypeSelect,
    handleProductTypeSearchChange,
    clearProductTypeSearch,
    setShowProductTypeDropdown,
  } = usePurchaseForm({
    members,
    productTypes,
    dailyPrices,
  });

  // Service fee form management hook
  const {
    formData: serviceFeeFormData,
    error: serviceFeeFormError,
    setError: setServiceFeeFormError,
    handleInputChange: handleServiceFeeInputChange,
    isFormValid: isServiceFeeFormValid,
    resetForm: resetServiceFeeForm,
  } = useServiceFeeForm();

  // Handle adding purchase item to cart
  const handleAddToCart = () => {
    if (!isFormValid()) {
      setFormError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }
    
    addToCart(formData);
    resetForm();
  };

  // Handle adding service fee item to cart
  const handleAddServiceFeeToCart = () => {
    if (!isServiceFeeFormValid()) {
      setServiceFeeFormError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }
    
    addServiceFeeToCart(serviceFeeFormData);
    resetServiceFeeForm();
  };

  // Handle saving cart with form reset
  const handleSaveCart = async () => {
    await saveCartToDb();
    // Reset all form fields including member selection after successful save
    resetAllFields();
  };

  // Modal handlers
  const handleShowPrintModal = () => {
    setShowPrintModal(true);
  };

  const handlePreview = () => {
    previewCart();
    setShowPrintModal(false);
  };

  const handleDownloadPDF = () => {
    downloadPDF();
    setShowPrintModal(false);
  };

  const handlePrintCancel = () => {
    setShowPrintModal(false);
  };

  // Load data on mount
  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (isLoading) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, isLoading, router, loadData]);

  // Show loader while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">รับซื้อยาง</h1>
          </div>
        </div>

        {/* Main Content - Side by Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Side - Purchase Entry Card */}
          <div className="lg:col-span-2">
            <PurchaseEntryCard
              formData={formData}
              error={formError}
              members={members}
              productTypes={productTypes}
              memberSearchTerm={memberSearchTerm}
              showMemberDropdown={showMemberDropdown}
              selectedMember={selectedMember}
              filteredMembers={filteredMembers}
              recentPurchases={recentPurchases}
              isFormValid={isFormValid()}
              calculateTotalAmount={calculateTotalAmount}
              handleInputChange={handleInputChange}
              handleMemberSearchChange={handleMemberSearchChange}
              handleMemberSelect={handleMemberSelect}
              clearMemberSearch={clearMemberSearch}
              applySuggestedPrice={applySuggestedPrice}
              setShowMemberDropdown={setShowMemberDropdown}
              resetForm={resetAllFields}
              addToCart={handleAddToCart}
              productTypeSearchTerm={productTypeSearchTerm}
              showProductTypeDropdown={showProductTypeDropdown}
              selectedProductType={selectedProductType}
              filteredProductTypes={filteredProductTypes}
              handleProductTypeSelect={handleProductTypeSelect}
              handleProductTypeSearchChange={handleProductTypeSearchChange}
              clearProductTypeSearch={clearProductTypeSearch}
              setShowProductTypeDropdown={setShowProductTypeDropdown}
            />
          </div>

          {/* Right Side - Cart Table (Wider) */}
          <div className="lg:col-span-3">
            <CartTable
              cart={cart}
              submitting={submitting}
              totalAmount={totalAmount}
              printCart={printCart}
              saveCartToDb={handleSaveCart}
              removeFromCart={removeFromCart}
              onShowPrintModal={handleShowPrintModal}
              clearCart={clearCart}
              error={cartError}
              setError={setCartError}
              serviceFeeCard={
                <ServiceFeeCard
                  formData={serviceFeeFormData}
                  error={serviceFeeFormError}
                  handleInputChange={handleServiceFeeInputChange}
                  isFormValid={isServiceFeeFormValid()}
                  resetForm={resetServiceFeeForm}
                  addToCart={handleAddServiceFeeToCart}
                />
              }
            />
          </div>
        </div>
      </div>

      {/* Print Confirmation Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-md w-full mx-auto">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-600 rounded-t-2xl">
              <div className="flex items-center justify-between">
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
                <button
                  onClick={handlePrintCancel}
                  className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label="ปิด"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
                    คุณต้องการดูหรือดาวน์โหลดใบรับซื้อหรือไม่?
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 min-w-0 px-4 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="whitespace-nowrap truncate">ดาวน์โหลด PDF</span>
                  </div>
                </button>
                <button
                  onClick={handlePreview}
                  className="flex-1 min-w-0 px-4 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="whitespace-nowrap truncate">ดูตัวอย่าง PDF</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    printCart();
                    setShowPrintModal(false);
                  }}
                  className="flex-1 min-w-0 px-4 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="whitespace-nowrap truncate">พิมพ์</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

