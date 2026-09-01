'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReportProductTypeGroupRecord, getGroupLabel } from '@/lib/reportProductTypeGroups';
import { useAlert } from '@/hooks/useAlert';

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

  if (!isOpen) {
    return null;
  }

  const previewLabel = buildPreviewLabel(name, selectedProductTypeIds, productTypes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">จัดการกลุ่มรายงานการรับซื้อยาง</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                สร้างกลุ่มประเภทสินค้าเพื่อใช้ในรายงานรับซื้อประจำวัน เช่น ยางจอก + ยางพรก
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-white/60 dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                ชื่อกลุ่ม (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="เช่น ยางจอก + ยางพรก"
                className="input w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                ถ้าไม่ระบุ ระบบจะใช้ชื่อจากประเภทสินค้าที่เลือก
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  เลือกประเภทสินค้าในกลุ่ม
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllProductTypes}
                    disabled={productTypes.length === 0}
                    className="rounded-md border border-indigo-200 px-2 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
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
                          ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProductType(productType.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-200">{productType.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-900/10">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">ตัวอย่างชื่อในรายงาน</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{previewLabel}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || selectedProductTypeIds.length === 0}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saving ? 'กำลังบันทึก...' : editingGroupId ? 'บันทึกการแก้ไข' : 'เพิ่มกลุ่ม'}
              </button>
              {editingGroupId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  ยกเลิกการแก้ไข
                </button>
              )}
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{getGroupLabel(group)}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {group.productTypes.map((productType) => productType.name).join(', ')}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(group)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
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
    </div>
  );
}

export function useReportGroupManagementModal() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
