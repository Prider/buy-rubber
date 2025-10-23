'use client';

import { useEffect } from 'react';
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
          resetForm={resetForm}
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
        />
      </div>
    </Layout>
  );
}

