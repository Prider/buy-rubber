'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Modal } from 'animal-island-ui';
import { IslandModalTitle } from '@/components/common/IslandModalTitle';
import { ServiceFeeCategoryRecord } from '@/lib/serviceFeeCategories';
import { useAlert } from '@/hooks/useAlert';

const fieldClassName =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-600 dark:disabled:text-gray-400';

interface ServiceFeeCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceFeeCategoryRecord[];
  loading: boolean;
  saving: boolean;
  onCreateCategory: (input: { name: string }) => Promise<ServiceFeeCategoryRecord>;
  onUpdateCategory: (id: string, input: { name: string }) => Promise<ServiceFeeCategoryRecord>;
  onDeleteCategory: (id: string) => Promise<void>;
  onRefresh: () => Promise<ServiceFeeCategoryRecord[] | void>;
  onSaved?: (category: ServiceFeeCategoryRecord, previousName: string | null) => void;
  onDeleted?: (category: ServiceFeeCategoryRecord) => void;
}

export default function ServiceFeeCategoryModal({
  isOpen,
  onClose,
  categories,
  loading,
  saving,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRefresh,
  onSaved,
  onDeleted,
}: ServiceFeeCategoryModalProps) {
  const { showSuccess, showError, showConfirm } = useAlert();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const resetForm = useCallback(() => {
    setEditingCategoryId(null);
    setName('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const startEdit = useCallback((category: ServiceFeeCategoryRecord) => {
    setEditingCategoryId(category.id);
    setName(category.name);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    if (!trimmedName) {
      showError('กรุณาระบุชื่อประเภท', 'ใส่ชื่อประเภทค่าบริการก่อนบันทึก');
      return;
    }

    const previousName = editingCategoryId
      ? categories.find((category) => category.id === editingCategoryId)?.name ?? null
      : null;

    try {
      const saved = editingCategoryId
        ? await onUpdateCategory(editingCategoryId, { name: trimmedName })
        : await onCreateCategory({ name: trimmedName });

      showSuccess(
        editingCategoryId ? 'บันทึกประเภทแล้ว' : 'สร้างประเภทแล้ว',
        editingCategoryId
          ? 'แก้ไขประเภทค่าบริการเรียบร้อยแล้ว'
          : 'เพิ่มประเภทค่าบริการใหม่เรียบร้อยแล้ว',
      );
      onSaved?.(saved, previousName);
      resetForm();
      await onRefresh();
    } catch (error) {
      showError(
        'ไม่สามารถบันทึกประเภทได้',
        error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
      );
    }
  }, [
    categories,
    editingCategoryId,
    name,
    onCreateCategory,
    onRefresh,
    onSaved,
    onUpdateCategory,
    resetForm,
    showError,
    showSuccess,
  ]);

  const handleDelete = useCallback(
    async (category: ServiceFeeCategoryRecord) => {
      const confirmed = await showConfirm(
        'ยืนยันการลบประเภทค่าบริการ',
        `ต้องการลบประเภท "${category.name}" หรือไม่?`,
        {
          confirmText: 'ลบ',
          cancelText: 'ยกเลิก',
          variant: 'danger',
        },
      );
      if (!confirmed) {
        return;
      }

      try {
        await onDeleteCategory(category.id);
        if (editingCategoryId === category.id) {
          resetForm();
        }
        onDeleted?.(category);
        showSuccess('ลบประเภทแล้ว', `ลบประเภท "${category.name}" เรียบร้อยแล้ว`);
        await onRefresh();
      } catch (error) {
        showError(
          'ไม่สามารถลบประเภทได้',
          error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        );
      }
    },
    [editingCategoryId, onDeleteCategory, onDeleted, onRefresh, resetForm, showConfirm, showError, showSuccess],
  );

  return (
    <Modal
      open={isOpen}
      className="app-island-modal service-fee-category-modal"
      title={<IslandModalTitle title="จัดการประเภทค่าบริการ" onClose={onClose} />}
      width={800}
      typewriter={false}
      onClose={onClose}
      footer={
        <div className="service-fee-category-modal-footer flex w-full flex-col gap-2 md:mr-8 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end">
          <Button htmlType="button" onClick={onClose}>
            ปิด
          </Button>
          {editingCategoryId ? (
            <Button htmlType="button" onClick={resetForm}>
              ยกเลิกการแก้ไข
            </Button>
          ) : null}
          <Button
            type="primary"
            htmlType="button"
            onClick={handleSubmit}
            disabled={saving || name.trim().length === 0}
          >
            {saving ? 'กำลังบันทึก...' : editingCategoryId ? 'บันทึกการแก้ไข' : 'เพิ่มประเภท'}
          </Button>
        </div>
      }
    >
      <div className="w-full px-0 text-base font-normal sm:px-2">
        <p className="mb-4 w-full text-center text-sm font-medium text-gray-600 dark:text-gray-300 md:mb-6">
          ตั้งค่าประเภทที่ใช้ในบันทึกค่าบริการ เช่น ค่าชั่ง หรือค่าขนส่ง
        </p>

        <div className="grid w-full gap-6 md:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                ชื่อประเภท <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="เช่น ค่าชั่ง"
                className={fieldClassName}
              />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                ชื่อนี้จะแสดงในรายการให้เลือกตอนบันทึกค่าบริการ
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">ประเภทที่มีอยู่</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{categories.length} ประเภท</span>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
            ) : categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีประเภทค่าบริการ</p>
              </div>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-600"
                  >
                    <div className="space-y-3">
                      <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
