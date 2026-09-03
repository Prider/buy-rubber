'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Modal } from 'animal-island-ui';
import { ReportProductTypeGroupRecord, getGroupLabel } from '@/lib/reportProductTypeGroups';
import { useAlert } from '@/hooks/useAlert';

const fieldClassName =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-600 dark:disabled:text-gray-400';

interface ProductTypeOption {
  id: string;
  code: string;
  name: string;
}

interface ReportGroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTypes: ProductTypeOption[];
  groups: ReportProductTypeGroupRecord[];
  loading: boolean;
  saving: boolean;
  onCreateGroup: (input: { name?: string; productTypeIds: string[] }) => Promise<ReportProductTypeGroupRecord>;
  onUpdateGroup: (
    id: string,
    input: { name?: string; productTypeIds: string[] },
  ) => Promise<ReportProductTypeGroupRecord>;
  onDeleteGroup: (id: string) => Promise<void>;
  onRefresh: () => Promise<ReportProductTypeGroupRecord[] | void>;
}

function buildPreviewLabel(
  name: string,
  selectedIds: string[],
  productTypes: ProductTypeOption[],
): string {
  if (name.trim()) {
    return name.trim();
  }

  const names = selectedIds
    .map((id) => productTypes.find((productType) => productType.id === id)?.name)
    .filter((value): value is string => Boolean(value));

  return names.length > 0 ? names.join(' + ') : 'กลุ่มรายงาน';
}

export default function ReportGroupManagementModal({
  isOpen,
  onClose,
  productTypes,
  groups,
  loading,
  saving,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onRefresh,
}: ReportGroupManagementModalProps) {
  const { showSuccess, showError, showConfirm } = useAlert();
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setEditingGroupId(null);
    setName('');
    setSelectedProductTypeIds([]);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const startEdit = useCallback((group: ReportProductTypeGroupRecord) => {
    setEditingGroupId(group.id);
    setName(group.name ?? '');
    setSelectedProductTypeIds(group.productTypes.map((productType) => productType.id));
  }, []);

  const toggleProductType = useCallback((productTypeId: string) => {
    setSelectedProductTypeIds((current) =>
      current.includes(productTypeId)
        ? current.filter((id) => id !== productTypeId)
        : [...current, productTypeId],
    );
  }, []);

  const selectAllProductTypes = useCallback(() => {
    setSelectedProductTypeIds(productTypes.map((productType) => productType.id));
  }, [productTypes]);

  const clearProductTypeSelection = useCallback(() => {
    setSelectedProductTypeIds([]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedProductTypeIds.length === 0) {
      showError('กรุณาเลือกประเภทสินค้า', 'เลือกอย่างน้อย 1 ประเภทสินค้าเพื่อสร้างกลุ่มรายงาน');
      return;
    }

    try {
      const payload = {
        name: name.trim() || undefined,
        productTypeIds: selectedProductTypeIds,
      };

      if (editingGroupId) {
        await onUpdateGroup(editingGroupId, payload);
        showSuccess('บันทึกกลุ่มรายงานแล้ว', 'แก้ไขกลุ่มรายงานเรียบร้อยแล้ว');
      } else {
        await onCreateGroup(payload);
        showSuccess('สร้างกลุ่มรายงานแล้ว', 'เพิ่มกลุ่มรายงานใหม่เรียบร้อยแล้ว');
      }

      resetForm();
      await onRefresh();
    } catch (error) {
      showError(
        'ไม่สามารถบันทึกกลุ่มรายงานได้',
        error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
      );
    }
  }, [
    editingGroupId,
    name,
    onCreateGroup,
    onRefresh,
    onUpdateGroup,
    resetForm,
    selectedProductTypeIds,
    showError,
    showSuccess,
  ]);

  const handleDelete = useCallback(
    async (group: ReportProductTypeGroupRecord) => {
      const confirmed = await showConfirm(
        'ยืนยันการลบกลุ่มรายงาน',
        `ต้องการลบกลุ่ม "${getGroupLabel(group)}" หรือไม่?`,
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
        await onDeleteGroup(group.id);
        if (editingGroupId === group.id) {
          resetForm();
        }
        showSuccess('ลบกลุ่มรายงานแล้ว', `ลบกลุ่ม "${getGroupLabel(group)}" เรียบร้อยแล้ว`);
        await onRefresh();
      } catch (error) {
        showError(
          'ไม่สามารถลบกลุ่มรายงานได้',
          error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        );
      }
    },
    [editingGroupId, onDeleteGroup, onRefresh, resetForm, showConfirm, showError, showSuccess],
  );

  const previewLabel = buildPreviewLabel(name, selectedProductTypeIds, productTypes);

  return (
    <Modal
      open={isOpen}
      className="app-island-modal"
      title={
        <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
          จัดการกลุ่มรายงานการรับซื้อยาง
        </span>
      }
      width={800}
      typewriter={false}
      onClose={onClose}
      footer={
        <>
          <Button htmlType="button" onClick={onClose}>
            ปิด
          </Button>
          {editingGroupId ? (
            <Button htmlType="button" onClick={resetForm}>
              ยกเลิกการแก้ไข
            </Button>
          ) : null}
          <Button
            type="primary"
            htmlType="button"
            onClick={handleSubmit}
            disabled={saving || selectedProductTypeIds.length === 0}
          >
            {saving ? 'กำลังบันทึก...' : editingGroupId ? 'บันทึกการแก้ไข' : 'เพิ่มกลุ่ม'}
          </Button>
        </>
      }
    >
      <div className="w-full text-base font-normal px-2">
        <p className="mb-6 w-full text-center text-sm font-medium text-gray-600 dark:text-gray-300">
          สร้างกลุ่มประเภทสินค้าเพื่อใช้ในรายงานรับซื้อประจำวัน เช่น ยางจอก + ยางพรก
        </p>

        <div className="grid w-full gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                ชื่อกลุ่ม (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="เช่น ยางจอก + ยางพรก"
                className={fieldClassName}
              />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                ถ้าไม่ระบุ ระบบจะใช้ชื่อจากประเภทสินค้าที่เลือก
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  เลือกประเภทสินค้าในกลุ่ม
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllProductTypes}
                    disabled={productTypes.length === 0}
                    className="rounded-md border border-primary-200 px-2 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20"
                  >
                    เลือกทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={clearProductTypeSelection}
                    disabled={selectedProductTypeIds.length === 0}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/40"
                  >
                    ล้างค่า
                  </button>
                </div>
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-3 dark:border-gray-600">
                {productTypes.map((productType) => {
                  const checked = selectedProductTypeIds.includes(productType.id);
                  return (
                    <label
                      key={productType.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                        checked
                          ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProductType(productType.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-200">{productType.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/60 px-4 py-3 dark:border-primary-800 dark:bg-primary-900/10">
              <p className="text-xs font-medium text-primary-700 dark:text-primary-300">ตัวอย่างชื่อในรายงาน</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{previewLabel}</p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">กลุ่มที่มีอยู่</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{groups.length} กลุ่ม</span>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
            ) : groups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีกลุ่มรายงาน</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-600"
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{getGroupLabel(group)}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {group.productTypes.map((productType) => productType.name).join(', ')}
                        </p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(group)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(group)}
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
