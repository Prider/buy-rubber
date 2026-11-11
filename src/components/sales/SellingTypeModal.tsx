'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Modal } from 'animal-island-ui';
import { IslandModalTitle } from '@/components/common/IslandModalTitle';
import { SellingTypeRecord } from '@/lib/sellingTypes';
import { useAlert } from '@/hooks/useAlert';

const fieldClassName =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-600 dark:disabled:text-gray-400';

interface SellingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellingTypes: SellingTypeRecord[];
  loading: boolean;
  saving: boolean;
  onCreateType: (input: { name: string }) => Promise<SellingTypeRecord>;
  onUpdateType: (id: string, input: { name: string }) => Promise<SellingTypeRecord>;
  onDeleteType: (id: string) => Promise<void>;
  onRefresh: () => Promise<SellingTypeRecord[] | void>;
  onSaved?: (type: SellingTypeRecord, previousName: string | null) => void;
  onDeleted?: (type: SellingTypeRecord) => void;
}

export default function SellingTypeModal({
  isOpen,
  onClose,
  sellingTypes,
  loading,
  saving,
  onCreateType,
  onUpdateType,
  onDeleteType,
  onRefresh,
  onSaved,
  onDeleted,
}: SellingTypeModalProps) {
  const { showSuccess, showError, showConfirm } = useAlert();
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const resetForm = useCallback(() => {
    setEditingTypeId(null);
    setName('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const startEdit = useCallback((type: SellingTypeRecord) => {
    setEditingTypeId(type.id);
    setName(type.name);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    if (!trimmedName) {
      showError('กรุณาระบุชื่อรูปแบบ', 'ใส่ชื่อรูปแบบการขายก่อนบันทึก');
      return;
    }

    const previousName = editingTypeId
      ? sellingTypes.find((type) => type.id === editingTypeId)?.name ?? null
      : null;

    try {
      const saved = editingTypeId
        ? await onUpdateType(editingTypeId, { name: trimmedName })
        : await onCreateType({ name: trimmedName });

      showSuccess(
        editingTypeId ? 'บันทึกรูปแบบแล้ว' : 'สร้างรูปแบบแล้ว',
        editingTypeId
          ? 'แก้ไขรูปแบบการขายเรียบร้อยแล้ว'
          : 'เพิ่มรูปแบบการขายใหม่เรียบร้อยแล้ว',
      );
      onSaved?.(saved, previousName);
      resetForm();
      await onRefresh();
    } catch (error) {
      showError(
        'ไม่สามารถบันทึกรูปแบบได้',
        error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
      );
    }
  }, [
    editingTypeId,
    name,
    onCreateType,
    onRefresh,
    onSaved,
    onUpdateType,
    resetForm,
    sellingTypes,
    showError,
    showSuccess,
  ]);

  const handleDelete = useCallback(
    async (type: SellingTypeRecord) => {
      const confirmed = await showConfirm(
        'ยืนยันการลบรูปแบบการขาย',
        `ต้องการลบรูปแบบ "${type.name}" หรือไม่? รายการขายที่บันทึกไว้แล้วยังใช้ชื่อเดิม`,
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
        await onDeleteType(type.id);
        if (editingTypeId === type.id) {
          resetForm();
        }
        onDeleted?.(type);
        showSuccess('ลบรูปแบบแล้ว', `ลบรูปแบบ "${type.name}" เรียบร้อยแล้ว`);
        await onRefresh();
      } catch (error) {
        showError(
          'ไม่สามารถลบรูปแบบได้',
          error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        );
      }
    },
    [editingTypeId, onDeleteType, onDeleted, onRefresh, resetForm, showConfirm, showError, showSuccess],
  );

  return (
    <Modal
      open={isOpen}
      className="app-island-modal selling-type-modal"
      title={<IslandModalTitle title="จัดการรูปแบบการขาย" onClose={onClose} />}
      width={800}
      typewriter={false}
      maskStyle={{ zIndex: 1200 }}
      onClose={onClose}
      footer={
        <div className="selling-type-modal-footer flex w-full flex-col gap-2 md:mr-8 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end">
          <Button htmlType="button" onClick={onClose}>
            ปิด
          </Button>
          {editingTypeId ? (
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
            {saving ? 'กำลังบันทึก...' : editingTypeId ? 'บันทึกการแก้ไข' : 'เพิ่มรูปแบบ'}
          </Button>
        </div>
      }
    >
      <div className="w-full px-0 text-base font-normal sm:px-2">
        <p className="mb-4 w-full text-center text-sm font-medium text-gray-600 dark:text-gray-300 md:mb-6">
          ตั้งค่ารูปแบบที่ใช้ในบันทึกการขาย เช่น จ่ายสด หรือฝาก ครั้งถัดไปเลือกจากรายการได้เลย
        </p>

        <div className="grid w-full gap-6 md:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                ชื่อรูปแบบ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="เช่น จ่ายสด"
                className={fieldClassName}
              />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                ชื่อนี้จะแสดงในรายการให้เลือกตอนบันทึกการขาย
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">รูปแบบที่มีอยู่</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{sellingTypes.length} รูปแบบ</span>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
            ) : sellingTypes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีรูปแบบการขาย</p>
              </div>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto">
                {sellingTypes.map((type) => (
                  <div
                    key={type.id}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-600"
                  >
                    <div className="space-y-3">
                      <p className="font-medium text-gray-900 dark:text-white">{type.name}</p>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(type)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(type)}
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
