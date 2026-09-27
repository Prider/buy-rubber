'use client';

import { useEffect, useRef, useState } from 'react';
import { MemberGroupRecord } from '@/industries/rubber/types/member';
import { MemberGroupProductType } from '@/industries/rubber/hooks/useMemberGroups';
import { useAlert } from '@/shared/hooks/useAlert';

interface MemberGroupModalProps {
  isOpen: boolean;
  groups: MemberGroupRecord[];
  productTypes: MemberGroupProductType[];
  onClose: () => void;
  onSave: (
    id: string | null,
    input: { name: string; prices: Array<{ productTypeId: string; price: number | '' }> },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onChanged: () => void;
}

const emptyPrices = (productTypes: MemberGroupProductType[]) =>
  Object.fromEntries(productTypes.map((type) => [type.id, '']));

const fieldClassName =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

export function MemberGroupModal({
  isOpen,
  groups,
  productTypes,
  onClose,
  onSave,
  onDelete,
  onChanged,
}: MemberGroupModalProps) {
  const { showConfirm } = useAlert();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const productTypesRef = useRef(productTypes);
  productTypesRef.current = productTypes;

  useEffect(() => {
    if (!isOpen) return;
    setEditingId(null);
    setName('');
    setPrices(emptyPrices(productTypesRef.current));
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const startNew = () => {
    setEditingId(null);
    setName('');
    setPrices(emptyPrices(productTypes));
    setError(null);
  };

  const startEdit = (group: MemberGroupRecord) => {
    const next = emptyPrices(productTypes);
    for (const price of group.prices) {
      next[price.productTypeId] = String(price.price);
    }
    setEditingId(group.id);
    setName(group.name);
    setPrices(next);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(editingId, {
        name,
        prices: productTypes.map((type) => ({
          productTypeId: type.id,
          price: prices[type.id] === '' ? '' : Number(prices[type.id]),
        })),
      });
      onChanged();
      startNew();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group: MemberGroupRecord) => {
    const confirmed = await showConfirm(
      'ลบกลุ่มสมาชิก',
      `ลบกลุ่ม "${group.name}" หรือไม่? สมาชิกในกลุ่มนี้จะไม่มีกลุ่ม`,
      { confirmText: 'ลบ', cancelText: 'ยกเลิก', variant: 'danger' },
    );
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    try {
      await onDelete(group.id);
      onChanged();
      if (editingId === group.id) startNew();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-gray-950/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-group-title"
        className="relative flex max-h-[min(680px,100%)] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[min(680px,calc(100%-2rem))] sm:rounded-2xl dark:bg-gray-900"
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div>
            <h2 id="member-group-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              กลุ่มสมาชิก
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              เว้นช่องราคาไว้ ระบบใช้ราคาประกาศของวันนั้น
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 border-t border-gray-100 dark:border-gray-800 sm:grid-cols-[13rem_1fr]">
          <div className="flex gap-1 overflow-x-auto border-b border-gray-100 p-3 dark:border-gray-800 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r">
            <button
              type="button"
              onClick={startNew}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm ${
                editingId === null
                  ? 'bg-gray-900 font-medium text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              + กลุ่มใหม่
            </button>
            {groups.length === 0 ? (
              <p className="shrink-0 px-3 py-2 text-sm text-gray-400">ยังไม่มีกลุ่ม</p>
            ) : (
              groups.map((group) => {
                const selected = editingId === group.id;
                return (
                  <div
                    key={group.id}
                    className={`flex shrink-0 items-center rounded-lg ${
                      selected ? 'bg-primary-50 dark:bg-primary-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => startEdit(group)}
                      className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${
                        selected
                          ? 'font-medium text-primary-800 dark:text-primary-100'
                          : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {group.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(group)}
                      disabled={saving}
                      aria-label={`ลบ ${group.name}`}
                      className="mr-1 rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <form
            className="flex min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </p>
              ) : null}

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อกลุ่ม</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  disabled={saving}
                  placeholder="เช่น กลุ่ม A"
                  className={fieldClassName}
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ราคาต่อกิโลกรัม</p>
                {productTypes.length === 0 ? (
                  <p className="text-sm text-gray-400">ยังไม่มีประเภทสินค้า</p>
                ) : (
                  <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                    {productTypes.map((type) => (
                      <label key={type.id} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="w-14 shrink-0 text-xs font-medium text-gray-400">{type.code}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-100">
                          {type.name}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={prices[type.id] ?? ''}
                          onChange={(event) =>
                            setPrices((current) => ({ ...current, [type.id]: event.target.value }))
                          }
                          disabled={saving}
                          placeholder="ประกาศ"
                          aria-label={`ราคา ${type.name}`}
                          className={`${fieldClassName} w-28 shrink-0 text-right`}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 px-5 py-3 dark:border-gray-800">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'สร้างกลุ่ม'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
