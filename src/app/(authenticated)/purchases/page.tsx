'use client';

import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchaseData } from '@/hooks/usePurchaseData';
import { usePurchaseForm } from '@/hooks/usePurchaseForm';
import { useExpenseForm as useServiceFeeForm } from '@/hooks/useExpenseForm';
import { useCart } from '@/hooks/useCart';
import { PurchaseEntryCard } from '@/components/purchases/PurchaseEntryCard';
import { PurchasesList, type PurchasesListRef } from '@/components/purchases/PurchasesList';
import { ServiceFeeCard } from '@/components/purchases/ServiceFeeCard';
import { CartTable } from '@/components/purchases/CartTable';
import GamerLoader from '@/components/GamerLoader';
import { formatCurrency } from '@/lib/utils';
import { CloseButton } from '@/components/common/CloseButton';

/** Flip to true to show the หักค่าบริการ box again. */
const SHOW_SERVICE_FEE_CARD = false;

export default function PurchasesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryDocked, setEntryDocked] = useState(false);
  const historyRef = useRef<PurchasesListRef>(null);
  const historyPaneRef = useRef<HTMLDivElement>(null);
  
  // Data loading hook
  const { loading: _loading, members, productTypes, loadData, loadPurchases } = usePurchaseData();
  
  // Cart management hook
  const {
    cart,
    submitting,
    error: cartError,
    setError: setCartError,
    addToCart,
    updateCartItem,
    addServiceFeeToCart,
    updateServiceFeeInCart,
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
    setMoistureUnit,
    calculateTotalAmount,
    isFormValid,
    resetForm,
    resetAllFields,
    loadCartItem,
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
  });

  // Service fee form management hook
  const {
    formData: serviceFeeFormData,
    error: serviceFeeFormError,
    setError: setServiceFeeFormError,
    handleInputChange: handleServiceFeeInputChange,
    setCategory: setServiceFeeCategory,
    loadForm: loadServiceFeeForm,
    isFormValid: isServiceFeeFormValid,
    resetForm: resetServiceFeeForm,
  } = useServiceFeeForm();

  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const editingCartItemIdRef = useRef<string | null>(null);
  editingCartItemIdRef.current = editingCartItemId;
  const editingCartItem = cart.find((item) => item.id === editingCartItemId) ?? null;

  const closeEntry = useCallback(() => {
    const wasEditing = editingCartItemIdRef.current != null;
    if (wasEditing) {
      resetForm();
      resetServiceFeeForm();
      editingCartItemIdRef.current = null;
      setEditingCartItemId(null);
      if (window.matchMedia('(max-width: 1023px)').matches) {
        setCartSheetOpen(true);
      }
    }
    setEntryOpen(false);
  }, [resetForm, resetServiceFeeForm]);

  const handleEditCartItem = (id: string) => {
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    if (item.type === 'serviceFee') {
      loadServiceFeeForm({
        category: item.category ?? '',
        amount: item.amount == null ? '' : String(item.amount),
      });
    } else {
      loadCartItem(item);
    }
    editingCartItemIdRef.current = id;
    setEditingCartItemId(id);
    setCartSheetOpen(false);
    setEntryOpen(true);
  };

  // Handle adding purchase item to cart
  const handleAddToCart = () => {
    if (!isFormValid()) {
      setFormError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    if (editingCartItemId && editingCartItem?.type !== 'serviceFee') {
      updateCartItem(editingCartItemId, formData);
      closeEntry();
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

    if (editingCartItem?.type === 'serviceFee') {
      updateServiceFeeInCart(editingCartItem.id, serviceFeeFormData);
      closeEntry();
      return;
    }
    
    addServiceFeeToCart(serviceFeeFormData);
    resetServiceFeeForm();
  };

  // Handle saving cart with form reset
  const handleSaveCart = async () => {
    try {
      await saveCartToDb();
      // Reset all form fields including member selection after successful save
      // Note: Modal is shown by CartTable's handleSaveAndAskPrint on success
      resetAllFields();
      historyRef.current?.refresh();
      closeEntry();
    } catch (error) {
      // Error is already handled by useCart hook (setError)
      // Don't show modal on error
      console.error('Failed to save cart:', error);
    }
  };

  // Modal handlers
  const handleShowPrintModal = () => {
    setCartSheetOpen(false);
    setShowPrintModal(true);
  };

  useEffect(() => {
    if (!cartSheetOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !entryOpen) {
        setCartSheetOpen(false);
      }
    };
    const main = document.querySelector('main');
    const previousOverflow = main?.style.overflow ?? '';
    if (main) {
      main.style.overflow = 'hidden';
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (main) {
        main.style.overflow = previousOverflow;
      }
    };
  }, [cartSheetOpen, entryOpen]);

  const openPurchaseEntry = () => {
    if (editingCartItemIdRef.current) {
      resetForm();
      resetServiceFeeForm();
      editingCartItemIdRef.current = null;
      setEditingCartItemId(null);
    }
    setCartSheetOpen(false);
    setEntryOpen(true);
  };

  useEffect(() => {
    if (!entryOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeEntry();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [entryOpen, closeEntry]);

  useEffect(() => {
    const pane = historyPaneRef.current;
    if (!pane) return;
    const docked =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(min-width: 1024px)').matches;
    if (entryOpen && !docked) {
      pane.setAttribute('inert', '');
    } else {
      pane.removeAttribute('inert');
    }
  }, [entryOpen, entryDocked]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(min-width: 1024px)');
    const sync = () => setEntryDocked(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

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
      <div className="flex w-full flex-1 flex-col max-lg:-mx-4 max-lg:-mt-4 max-lg:min-h-full max-lg:bg-gray-50 max-lg:pb-20 dark:max-lg:bg-gray-900 lg:h-full lg:min-h-0 lg:overflow-hidden">
        <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(440px,1fr)] lg:overflow-hidden">
          <div className="hidden min-w-0 lg:order-2 lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
            <CartTable
              cart={cart}
              submitting={submitting}
              totalAmount={totalAmount}
              printCart={printCart}
              saveCartToDb={handleSaveCart}
              removeFromCart={removeFromCart}
              onEditCartItem={handleEditCartItem}
              onShowPrintModal={handleShowPrintModal}
              clearCart={clearCart}
              error={cartError}
              setError={setCartError}
              onRecordPurchase={openPurchaseEntry}
            />
          </div>

          <div className="relative flex min-h-0 min-w-0 flex-col lg:order-1 lg:h-full lg:overflow-hidden">
            <div ref={historyPaneRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
              <PurchasesList ref={historyRef} />
            </div>
            {entryOpen && (
              <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4 lg:pointer-events-none lg:absolute lg:inset-0 lg:z-20 lg:items-start lg:justify-end lg:p-0">
                <button
                  type="button"
                  className="purchase-entry-overlay absolute inset-0 bg-black/50 lg:hidden"
                  aria-label={editingCartItem ? 'ปิดการแก้ไข' : 'ปิดบันทึกการรับซื้อ'}
                  onClick={closeEntry}
                />
                <div
                  aria-hidden
                  className="purchase-entry-overlay pointer-events-none absolute inset-0 hidden bg-white/5 backdrop-blur-[2px] lg:block dark:bg-white/5"
                />
                <div
                  role="dialog"
                  aria-modal={entryDocked ? undefined : true}
                  aria-labelledby={editingCartItem?.type === 'serviceFee' ? 'service-fee-entry-title' : 'purchase-entry-title'}
                  className={`purchase-entry-panel relative max-h-[100dvh] w-full overflow-y-auto overscroll-contain border-2 bg-white shadow-2xl dark:bg-gray-800 sm:max-h-[min(920px,92dvh)] sm:max-w-3xl sm:rounded-2xl lg:pointer-events-auto lg:h-auto lg:max-h-full lg:min-h-0 lg:w-full lg:max-w-none ${
                    editingCartItem?.type === 'serviceFee'
                      ? 'border-orange-500 dark:border-orange-400'
                      : editingCartItem
                        ? 'border-blue-600 dark:border-blue-400'
                        : 'border-transparent lg:border-gray-100 dark:lg:border-gray-700'
                  }`}
                >
                  {editingCartItem?.type === 'serviceFee' ? (
                    <ServiceFeeCard
                      formData={serviceFeeFormData}
                      error={serviceFeeFormError}
                      handleInputChange={handleServiceFeeInputChange}
                      setCategory={setServiceFeeCategory}
                      isFormValid={isServiceFeeFormValid()}
                      resetForm={resetServiceFeeForm}
                      addToCart={handleAddServiceFeeToCart}
                      submitting={submitting}
                      editing
                      onClose={closeEntry}
                    />
                  ) : (
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
                    setMoistureUnit={setMoistureUnit}
                    handleMemberSearchChange={handleMemberSearchChange}
                    handleMemberSelect={handleMemberSelect}
                    clearMemberSearch={clearMemberSearch}
                    applySuggestedPrice={applySuggestedPrice}
                    setShowMemberDropdown={setShowMemberDropdown}
                    resetForm={() => {
                      if (editingCartItemIdRef.current) {
                        editingCartItemIdRef.current = null;
                        setEditingCartItemId(null);
                      }
                      resetAllFields();
                    }}
                    addToCart={handleAddToCart}
                    productTypeSearchTerm={productTypeSearchTerm}
                    showProductTypeDropdown={showProductTypeDropdown}
                    selectedProductType={selectedProductType}
                    filteredProductTypes={filteredProductTypes}
                    handleProductTypeSelect={handleProductTypeSelect}
                    handleProductTypeSearchChange={handleProductTypeSearchChange}
                    clearProductTypeSearch={clearProductTypeSearch}
                    setShowProductTypeDropdown={setShowProductTypeDropdown}
                    submitting={submitting}
                    editing={Boolean(editingCartItem)}
                    onClose={closeEntry}
                    serviceFeeCard={
                      SHOW_SERVICE_FEE_CARD ? (
                        <ServiceFeeCard
                          formData={serviceFeeFormData}
                          error={serviceFeeFormError}
                          handleInputChange={handleServiceFeeInputChange}
                          setCategory={setServiceFeeCategory}
                          isFormValid={isServiceFeeFormValid()}
                          resetForm={resetServiceFeeForm}
                          addToCart={handleAddServiceFeeToCart}
                          submitting={submitting}
                        />
                      ) : undefined
                    }
                  />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!cartSheetOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-bottom))] items-stretch border-t border-green-700 bg-green-600 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-8px_24px_rgba(0,0,0,0.12)] md:left-16 lg:hidden">
        <button
          type="button"
          onClick={openPurchaseEntry}
          className="flex shrink-0 items-center border-r border-green-700 px-4 text-sm font-semibold"
        >
          บันทึกการรับซื้อ
        </button>
        <button
          type="button"
          onClick={() => setCartSheetOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 text-white"
        >
          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white/20 px-2 text-sm font-bold">
            {cart.length}
          </span>
          <span className="min-w-0 flex-1 text-left text-sm font-semibold">
            {cart.length > 0 ? 'ดูตะกร้า' : 'ตะกร้าว่าง'}
          </span>
          <span className="shrink-0 text-sm font-bold">{formatCurrency(totalAmount)}</span>
        </button>
        </div>
      )}

      {cartSheetOpen && (
        <div className="fixed inset-0 z-50 md:left-16 lg:hidden" role="dialog" aria-modal="true" aria-label="ตะกร้า">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="ปิดตะกร้า"
            onClick={() => setCartSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex h-[min(88dvh,100%)] min-h-0 flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[min(32rem,100%)] md:rounded-none md:rounded-l-3xl">
            <div className="flex justify-center pt-2 md:hidden" aria-hidden="true">
              <span className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            <CartTable
              cart={cart}
              submitting={submitting}
              totalAmount={totalAmount}
              printCart={printCart}
              saveCartToDb={handleSaveCart}
              removeFromCart={removeFromCart}
              onEditCartItem={handleEditCartItem}
              onShowPrintModal={handleShowPrintModal}
              clearCart={clearCart}
              error={cartError}
              setError={setCartError}
              onClose={() => setCartSheetOpen(false)}
              onRecordPurchase={openPurchaseEntry}
            />
          </div>
        </div>
      )}

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
                <CloseButton onClick={handlePrintCancel} />
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
                  className="flex-1 min-w-0 px-4 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-[box-shadow,transform] duration-150 ease-out font-medium shadow-lg hover:shadow-xl motion-safe:hover:-translate-y-0.5 text-sm"
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
                  className="flex-1 min-w-0 px-4 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-[box-shadow,transform] duration-150 ease-out font-medium shadow-lg hover:shadow-xl motion-safe:hover:-translate-y-0.5 text-sm"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="whitespace-nowrap truncate">ตัวอย่าง PDF</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    printCart();
                    setShowPrintModal(false);
                  }}
                  className="flex-1 min-w-0 px-4 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-[box-shadow,transform] duration-150 ease-out font-medium shadow-lg hover:shadow-xl motion-safe:hover:-translate-y-0.5 text-sm"
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

