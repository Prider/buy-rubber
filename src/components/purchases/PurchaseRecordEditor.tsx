'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { CloseButton } from '@/components/common/CloseButton';
import GamerLoader from '@/components/GamerLoader';
import { useAlert } from '@/hooks/useAlert';
import { usePurchaseData } from '@/hooks/usePurchaseData';
import { usePurchaseForm } from '@/hooks/usePurchaseForm';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { PurchaseEntryCard } from './PurchaseEntryCard';
import { buildPurchaseUpdateBody, purchaseToFormSource } from './editPurchase';
import type { PurchaseLine, PurchaseTransaction } from './types';

interface PurchaseLinePickerProps {
  transaction: PurchaseTransaction;
  onSelect: (purchase: PurchaseLine) => void;
  onClose: () => void;
}

export function PurchaseLinePicker({ transaction, onSelect, onClose }: PurchaseLinePickerProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="ปิด" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-line-picker-title"
        className="relative flex max-h-[min(88dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="min-w-0">
            <h2 id="purchase-line-picker-title" className="text-base font-bold text-gray-900 dark:text-white">
              เลือกรายการที่จะแก้ไข
            </h2>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {transaction.purchaseNo} · {transaction.purchases.length} รายการ
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-3">
          {transaction.purchases.map((purchase, index) => (
            <li key={purchase.id}>
              <button
                type="button"
                onClick={() => onSelect(purchase)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-blue-900/20"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {index + 1}. {purchase.productType.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(purchase.netWeight)} กก.
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {formatCurrency(purchase.totalAmount)}
                </span>
                <span className="shrink-0 text-sm font-medium text-indigo-600 dark:text-indigo-300">แก้ไข</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface PurchaseRecordEditorProps {
  purchase: PurchaseLine;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

function readApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return 'เกิดข้อผิดพลาดในการแก้ไขการรับซื้อ';
}

export function PurchaseRecordEditor({ purchase, onClose, onSaved }: PurchaseRecordEditorProps) {
  const { showSuccess } = useAlert();
  const { members, productTypes, loadData } = usePurchaseData();
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const membersForForm = useMemo(() => {
    const current = purchase.member;
    if (!current || members.some((member) => member.id === current.id)) return members;
    return [
      ...members,
      { id: current.id, code: current.code, name: current.name, ownerPercent: 100, tapperPercent: 0 },
    ];
  }, [members, purchase]);

  const productTypesForForm = useMemo(() => {
    const current = purchase.productType;
    if (!current || productTypes.some((type) => type.id === current.id)) return productTypes;
    return [...productTypes, current];
  }, [productTypes, purchase]);

  const {
    formData,
    error,
    setError,
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
    members: membersForForm,
    productTypes: productTypesForForm,
  });

  const purchaseRef = useRef(purchase);
  const loadCartItemRef = useRef(loadCartItem);
  purchaseRef.current = purchase;
  loadCartItemRef.current = loadCartItem;

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    loadCartItemRef.current(purchaseToFormSource(purchaseRef.current));
    setReady(true);
  }, [purchase.id]);

  const restoreForm = useCallback(() => {
    loadCartItem(purchaseToFormSource(purchase));
  }, [loadCartItem, purchase]);

  const requestClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || saving || showMemberDropdown || showProductTypeDropdown) return;
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving, showMemberDropdown, showProductTypeDropdown]);

  const handleSave = useCallback(async () => {
    if (!isFormValid()) {
      setError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await axios.put(`/api/purchases/${purchase.id}`, buildPurchaseUpdateBody(formData, purchase));
      showSuccess('แก้ไขเรียบร้อย', `บันทึกการแก้ไขรายการ ${purchase.purchaseNo} แล้ว`, {
        autoClose: true,
        autoCloseDelay: 3000,
      });
      await onSaved();
    } catch (saveError) {
      setError(readApiError(saveError));
    } finally {
      setSaving(false);
    }
  }, [formData, isFormValid, onSaved, purchase, setError, showSuccess]);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="ปิดการแก้ไข"
        onClick={requestClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-entry-title"
        className="relative max-h-[100dvh] w-full overflow-y-auto overscroll-contain border-2 border-blue-600 bg-white shadow-2xl dark:border-blue-400 dark:bg-gray-800 sm:max-h-[min(920px,92dvh)] sm:max-w-3xl sm:rounded-2xl"
      >
        {ready ? (
          <PurchaseEntryCard
            formData={formData}
            error={error}
            members={membersForForm}
            productTypes={productTypesForForm}
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
            resetForm={restoreForm}
            addToCart={handleSave}
            productTypeSearchTerm={productTypeSearchTerm}
            showProductTypeDropdown={showProductTypeDropdown}
            selectedProductType={selectedProductType}
            filteredProductTypes={filteredProductTypes}
            handleProductTypeSelect={handleProductTypeSelect}
            handleProductTypeSearchChange={handleProductTypeSearchChange}
            clearProductTypeSearch={clearProductTypeSearch}
            setShowProductTypeDropdown={setShowProductTypeDropdown}
            submitting={saving}
            editing
            heading="แก้ไขรายการรับซื้อ"
            subtitle={`${purchase.productType.name} · ${purchase.purchaseNo}`}
            onClose={requestClose}
          />
        ) : (
          <GamerLoader className="py-16" message="กำลังโหลดรายการ..." />
        )}
      </div>
    </div>
  );
}
