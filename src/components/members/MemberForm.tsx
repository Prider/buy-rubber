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
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {editingMember ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {validationError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">ชื่อ-นามสกุล *</label>
              <input
                type="text"
                value={localFormData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="label">
                รหัสสมาชิก * 
                {!editingMember && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">(สร้างอัตโนมัติ)</span>
                )}
              </label>
              <input
                type="text"
                value={localFormData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className="input bg-gray-100 dark:bg-gray-700"
                required
                disabled={true}
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="label">เบอร์โทร</label>
            <input
              type="text"
              value={localFormData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="input"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label">ที่อยู่</label>
            <textarea
              value={localFormData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="input"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">% เจ้าของสวน</label>
              <input
                type="number"
                value={localFormData.ownerPercent}
                onChange={(e) => handleInputChange('ownerPercent', parseFloat(e.target.value) || 0)}
                className="input"
                min="0"
                max="100"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="label">% คนตัด</label>
              <input
                type="number"
                value={localFormData.tapperPercent}
                onChange={(e) => handleInputChange('tapperPercent', parseFloat(e.target.value) || 0)}
                className="input"
                min="0"
                max="100"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="label">ชื่อคนตัด</label>
            <input
              type="text"
              value={localFormData.tapperName}
              onChange={(e) => handleInputChange('tapperName', e.target.value)}
              className="input"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังบันทึก...' : (editingMember ? 'บันทึก' : 'เพิ่มสมาชิก')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
