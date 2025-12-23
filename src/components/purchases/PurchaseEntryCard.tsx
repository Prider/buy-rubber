'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

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
  grossWeight: string; // น้ำหนักรวมภาชนะ (total weight with container)
  containerWeight: string; // น้ำหนักภาชนะ (container weight)
  netWeight: string; // น้ำหนักสุทธิ (net weight - calculated)
  pricePerUnit: string;
  bonusPrice: string;
  notes: string;
}

interface PurchaseEntryCardProps {
  formData: PurchaseFormData;
  error: string;
  members: Member[];
  productTypes: ProductType[];
  memberSearchTerm: string;
  showMemberDropdown: boolean;
  selectedMember: Member | null;
  filteredMembers: Member[];
  recentPurchases: any[];
  isFormValid: boolean;
  calculateTotalAmount: () => string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleMemberSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMemberSelect: (member: Member) => void;
  clearMemberSearch: () => void;
  applySuggestedPrice: (price: number) => void;
  setShowMemberDropdown: (show: boolean) => void;
  resetForm: () => void;
  addToCart: () => void;
  productTypeSearchTerm: string;
  showProductTypeDropdown: boolean;
  selectedProductType: ProductType | null;
  filteredProductTypes: ProductType[];
  handleProductTypeSelect: (productType: ProductType) => void;
  handleProductTypeSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearProductTypeSearch: () => void;
  setShowProductTypeDropdown: (show: boolean) => void;
  submitting?: boolean;
  serviceFeeCard?: React.ReactNode;
}

export const PurchaseEntryCard: React.FC<PurchaseEntryCardProps> = ({
  formData,
  error,
  memberSearchTerm,
  showMemberDropdown,
  filteredMembers,
  recentPurchases,
  isFormValid,
  calculateTotalAmount,
  handleInputChange,
  handleMemberSearchChange,
  handleMemberSelect,
  clearMemberSearch,
  applySuggestedPrice,
  setShowMemberDropdown,
  resetForm,
  addToCart,
  productTypeSearchTerm,
  showProductTypeDropdown,
  filteredProductTypes,
  handleProductTypeSelect,
  handleProductTypeSearchChange,
  clearProductTypeSearch,
  setShowProductTypeDropdown,
  submitting = false,
  serviceFeeCard,
}) => {
  const router = useRouter();

  // Refs for input fields to enable Enter key navigation
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const memberSearchRef = React.useRef<HTMLInputElement>(null);
  const productTypeRef = React.useRef<HTMLInputElement>(null);
  const grossWeightRef = React.useRef<HTMLInputElement>(null);
  const containerWeightRef = React.useRef<HTMLInputElement>(null);
  const pricePerUnitRef = React.useRef<HTMLInputElement>(null);
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);
  const memberDropdownRef = React.useRef<HTMLDivElement>(null);
  const productTypeDropdownRef = React.useRef<HTMLDivElement>(null);
  const dropdownHideTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const productTypeDropdownHideTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle Enter key to move to next field
  const handleKeyDown = (
    e: React.KeyboardEvent,
    nextRef?: React.RefObject<any>,
    prevRef?: React.RefObject<any>
  ) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
    if (e.key === 'ArrowLeft' && prevRef?.current) {
      e.preventDefault();
      prevRef.current.focus();
    }
  };

  const clearDropdownHideTimeout = () => {
    if (dropdownHideTimeout.current) {
      clearTimeout(dropdownHideTimeout.current);
      dropdownHideTimeout.current = null;
    }
  };

  const scheduleDropdownHide = () => {
    clearDropdownHideTimeout();
    dropdownHideTimeout.current = setTimeout(() => {
      setShowMemberDropdown(false);
    }, 150);
  };

  const handleMemberSearchFocus = () => {
    clearDropdownHideTimeout();
    setShowMemberDropdown(true);
  };

  const focusMemberOption = (index: number) => {
    const options = memberDropdownRef.current?.querySelectorAll<HTMLButtonElement>('[data-member-option]');
    if (!options || options.length === 0) {
      return;
    }
    const targetIndex = Math.max(0, Math.min(index, options.length - 1));
    options[targetIndex]?.focus();
  };

  const handleMemberSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleKeyDown(event, productTypeRef);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      clearDropdownHideTimeout();
      setShowMemberDropdown(false);
      requestAnimationFrame(() => {
        productTypeRef.current?.focus();
      });
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setShowMemberDropdown(true);
      focusMemberOption(0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      return;
    }
  };

  const handleMemberOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusMemberOption(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) {
        memberSearchRef.current?.focus();
      } else {
        focusMemberOption(index - 1);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setShowMemberDropdown(false);
      memberSearchRef.current?.focus();
    }
  };

  const handleMemberOptionFocus = () => {
    clearDropdownHideTimeout();
  };

  const handleMemberOptionBlur = () => {
    scheduleDropdownHide();
  };

  const handleMemberSelectWithClose = (member: Member) => {
    handleMemberSelect(member);
    clearDropdownHideTimeout();
    setShowMemberDropdown(false);
    requestAnimationFrame(() => {
      productTypeRef.current?.focus();
    });
  };

  // Product type dropdown handlers
  const clearProductTypeDropdownHideTimeout = () => {
    if (productTypeDropdownHideTimeout.current) {
      clearTimeout(productTypeDropdownHideTimeout.current);
      productTypeDropdownHideTimeout.current = null;
    }
  };

  const scheduleProductTypeDropdownHide = () => {
    clearProductTypeDropdownHideTimeout();
    productTypeDropdownHideTimeout.current = setTimeout(() => {
      setShowProductTypeDropdown(false);
    }, 150);
  };

  const handleProductTypeSearchFocus = () => {
    clearProductTypeDropdownHideTimeout();
    setShowProductTypeDropdown(true);
  };

  const focusProductTypeOption = (index: number) => {
    const options = productTypeDropdownRef.current?.querySelectorAll<HTMLButtonElement>('[data-product-type-option]');
    if (!options || options.length === 0) {
      return;
    }
    const targetIndex = Math.max(0, Math.min(index, options.length - 1));
    options[targetIndex]?.focus();
  };

  const handleProductTypeSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      handleKeyDown(event, grossWeightRef);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      memberSearchRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      clearProductTypeDropdownHideTimeout();
      setShowProductTypeDropdown(false);
      requestAnimationFrame(() => {
        grossWeightRef.current?.focus();
      });
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setShowProductTypeDropdown(true);
      focusProductTypeOption(0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      return;
    }
  };

  const handleProductTypeOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusProductTypeOption(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) {
        productTypeRef.current?.focus();
      } else {
        focusProductTypeOption(index - 1);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setShowProductTypeDropdown(false);
      productTypeRef.current?.focus();
    }
  };

  const handleProductTypeOptionFocus = () => {
    clearProductTypeDropdownHideTimeout();
  };

  const handleProductTypeOptionBlur = () => {
    scheduleProductTypeDropdownHide();
  };

  const handleProductTypeSelectWithClose = (productType: ProductType) => {
    handleProductTypeSelect(productType);
    clearProductTypeDropdownHideTimeout();
    setShowProductTypeDropdown(false);
    requestAnimationFrame(() => {
      grossWeightRef.current?.focus();
    });
  };


  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
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
      <div className="p-4 flex-1 min-h-0 overflow-y-auto">
        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-1.5">
              <div className="w-5 h-5 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-700 dark:text-red-300 font-medium text-xs leading-5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={(e) => { 
          e.preventDefault(); 
          addToCart(); 
          requestAnimationFrame(() => {
            productTypeRef.current?.focus();
          });
        }} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-3">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  วันที่รับซื้อ <span className="text-red-500">*</span>
                </label>
                <input
                  ref={dateInputRef}
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, memberSearchRef)}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  สมาชิก <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={memberSearchRef}
                    type="text"
                    value={memberSearchTerm}
                    onChange={handleMemberSearchChange}
                    onFocus={handleMemberSearchFocus}
                    onBlur={scheduleDropdownHide}
                    onKeyDown={handleMemberSearchKeyDown}
                    placeholder="ค้นหาสมาชิกตามชื่อหรือรหัส"
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={submitting}
                  />
                  {memberSearchTerm && (
                    <button
                      type="button"
                      onClick={clearMemberSearch}
                      disabled={submitting}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Dropdown */}
                  {showMemberDropdown && filteredMembers.length > 0 && (
                    <div
                      ref={memberDropdownRef}
                      className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      onMouseEnter={clearDropdownHideTimeout}
                      onMouseLeave={scheduleDropdownHide}
                    >
                      {filteredMembers.map((member, index) => (
                        <button
                          data-member-option
                          key={member.id}
                          type="button"
                          onClick={() => handleMemberSelectWithClose(member)}
                          onFocus={handleMemberOptionFocus}
                          onBlur={handleMemberOptionBlur}
                          onKeyDown={(event) => handleMemberOptionKeyDown(event, index)}
                          disabled={submitting}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {member.code} - {member.name}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* No results */}
                  {showMemberDropdown && memberSearchTerm && filteredMembers.length === 0 && (
                    <div
                      className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3"
                      onMouseEnter={clearDropdownHideTimeout}
                      onMouseLeave={scheduleDropdownHide}
                    >
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xs font-medium mb-2">ไม่พบสมาชิกที่ตรงกับคำค้นหา</p>
                      <button
                        type="button"
                        onClick={() => router.push('/members?showAddModal=true')}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        เพิ่มสมาชิกใหม่
                      </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Weight Information */}
          <div className="space-y-3 pt-0.5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  ประเภทสินค้า <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={productTypeRef}
                    type="text"
                    value={productTypeSearchTerm}
                    onChange={handleProductTypeSearchChange}
                    onFocus={handleProductTypeSearchFocus}
                    onBlur={scheduleProductTypeDropdownHide}
                    onKeyDown={handleProductTypeSearchKeyDown}
                    placeholder="ค้นหาตามชื่อหรือรหัส..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={submitting}
                  />
                  {productTypeSearchTerm && (
                    <button
                      type="button"
                      onClick={clearProductTypeSearch}
                      disabled={submitting}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Dropdown */}
                  {showProductTypeDropdown && filteredProductTypes.length > 0 && (
                    <div
                      ref={productTypeDropdownRef}
                      className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      onMouseEnter={clearProductTypeDropdownHideTimeout}
                      onMouseLeave={scheduleProductTypeDropdownHide}
                    >
                      {filteredProductTypes.map((type, index) => (
                        <button
                          data-product-type-option
                          key={type.id}
                          type="button"
                          onClick={() => handleProductTypeSelectWithClose(type)}
                          onFocus={handleProductTypeOptionFocus}
                          onBlur={handleProductTypeOptionBlur}
                          onKeyDown={(event) => handleProductTypeOptionKeyDown(event, index)}
                          disabled={submitting}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {type.code} - {type.name}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* No results */}
                  {showProductTypeDropdown && productTypeSearchTerm && filteredProductTypes.length === 0 && (
                    <div
                      className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3"
                      onMouseEnter={clearProductTypeDropdownHideTimeout}
                      onMouseLeave={scheduleProductTypeDropdownHide}
                    >
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xs font-medium mb-2">ไม่พบประเภทสินค้าที่ตรงกับคำค้นหา</p>
                        <button
                          type="button"
                          onClick={() => router.push('/prices?showAddModal=true')}
                          disabled={submitting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          เพิ่มประเภทสินค้าใหม่
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  น้ำหนักรวมภาชนะ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={grossWeightRef}
                    type="number"
                    step="0.01"
                    name="grossWeight"
                    value={formData.grossWeight}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, containerWeightRef, productTypeRef)}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-1.5 text-sm pr-10 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">กก.</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  น้ำหนักภาชนะ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={containerWeightRef}
                    type="number"
                    step="0.01"
                    min="0"
                    name="containerWeight"
                    value={formData.containerWeight}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, pricePerUnitRef, grossWeightRef)}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-1.5 text-sm pr-10 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">กก.</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  น้ำหนักสุทธิ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="netWeight"
                    value={formData.netWeight}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold transition-all duration-200 shadow-sm cursor-not-allowed"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">กก.</span>
                  </div>
                </div>
                {/* <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  คำนวณอัตโนมัติ: น้ำหนักรวมภาชนะ - น้ำหนักภาชนะ
                </p> */}
              </div>
            </div>
          </div>

          {/* Price Information */}
          <div className="space-y-3">

            {/* Recent Purchase Suggestions */}
            {recentPurchases.length > 0 && formData.productTypeId && (
              <div className="">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300">ราคาล่าสุดจากประวัติการรับซื้อ</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {recentPurchases.map((purchase) => (
                      <button
                        key={purchase.id}
                        type="button"
                        onClick={() => applySuggestedPrice(purchase.basePrice)}
                        disabled={submitting}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                          {new Date(purchase.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {purchase.basePrice.toFixed(2)} บาท/กก.
                        </span>
                        <svg className="w-2.5 h-2.5 text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-blue-700 dark:text-blue-400 mt-1 italic">คลิกเพื่อใช้ราคานี้</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  ราคาต่อหน่วย <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={pricePerUnitRef}
                    type="number"
                    step="0.01"
                    name="pricePerUnit"
                    value={formData.pricePerUnit || ''}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitButtonRef.current?.focus();
                      }
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        containerWeightRef.current?.focus();
                      }
                    }}
                    required
                    disabled={submitting}
                    className="w-full px-3 py-1.5 text-sm pr-14 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={formData.pricePerUnit}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">บาท/กก.</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  ยอดเงินรวม <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="totalAmount"
                    value={calculateTotalAmount()}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm pr-14 border border-gray-200 dark:border-gray-600 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-gray-900 dark:text-gray-100 font-bold transition-all duration-200 shadow-sm cursor-not-allowed"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">บาท</span>
                  </div>
                </div>
                {/* <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  คำนวณอัตโนมัติ: น้ำหนักสุทธิ x ราคาต่อหน่วย
                </p> */}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-600">
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="px-4 py-1.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              รีเซ็ต
            </button>
            <button
              ref={submitButtonRef}
              type="submit"
              disabled={!isFormValid || submitting}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium text-xs shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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
      {serviceFeeCard && (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
          {serviceFeeCard}
        </div>
      )}
    </div>
  );
};
