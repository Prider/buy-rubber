import React, { useState, useEffect } from 'react';
import { MemberFormProps, MemberFormData } from '@/types/member';
import { generateMemberCode } from '@/lib/memberUtils';

export const MemberForm: React.FC<MemberFormProps> = ({
  isOpen,
  editingMember,
  formData,
  onSubmit,
  onCancel,
  onFormDataChange,
  isLoading = false,
}) => {
  const [localFormData, setLocalFormData] = useState<MemberFormData>(formData);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setLocalFormData(formData);
    setValidationError(null);
  }, [formData, isOpen]);

  const handleInputChange = (field: keyof MemberFormData, value: string | number) => {
    const newData = { ...localFormData, [field]: value };
    setLocalFormData(newData);
    onFormDataChange(newData);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit(localFormData);
    } catch (error: any) {
      setValidationError(error.message);
    }
  };

  const handleCancel = () => {
    setLocalFormData(formData);
    setValidationError(null);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingMember ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                {editingMember ? 'แก้ไขข้อมูลสมาชิก' : ''}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-gray-600/50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
          {validationError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 rounded-lg">
              <div className="flex">
                <svg className="w-4 h-4 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 dark:text-red-300 font-medium text-sm">{validationError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">ข้อมูลพื้นฐาน</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-8">
                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={localFormData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                    required
                    disabled={isLoading}
                    placeholder="กรอกชื่อ-นามสกุล"
                  />
                </div>

                {/* Code */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    รหัสสมาชิก <span className="text-red-500">*</span>
                    {!editingMember && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(สร้างอัตโนมัติ)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={localFormData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 bg-gray-100 dark:bg-gray-600"
                    required
                    disabled={true}
                    readOnly
                    placeholder="รหัสสมาชิก"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">ข้อมูลติดต่อ</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-8">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={localFormData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                    disabled={isLoading}
                    placeholder="กรอกเบอร์โทรศัพท์"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ที่อยู่
                  </label>
                  <textarea
                    value={localFormData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 resize-none"
                    rows={2}
                    disabled={isLoading}
                    placeholder="กรอกที่อยู่"
                  />
                </div>
              </div>
            </div>

            {/* Ownership Information Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">ข้อมูลการเป็นเจ้าของ</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pl-8">
                {/* Owner Percent */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    % เจ้าของสวน
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={localFormData.ownerPercent}
                      onChange={(e) => handleInputChange('ownerPercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-6 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                      min="0"
                      max="100"
                      disabled={isLoading}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">%</span>
                    </div>
                  </div>
                </div>

                {/* Tapper Percent */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    % คนตัด
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={localFormData.tapperPercent}
                      onChange={(e) => handleInputChange('tapperPercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-6 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                      min="0"
                      max="100"
                      disabled={isLoading}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">%</span>
                    </div>
                  </div>
                </div>

                {/* Tapper Name */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ชื่อคนตัด
                  </label>
                  <input
                    type="text"
                    value={localFormData.tapperName}
                    onChange={(e) => handleInputChange('tapperName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                    disabled={isLoading}
                    placeholder="กรอกชื่อคนตัด"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium text-sm"
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl disabled:shadow-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-1.5">
                    <svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>กำลังบันทึก...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{editingMember ? 'บันทึกการแก้ไข' : 'เพิ่มสมาชิก'}</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
