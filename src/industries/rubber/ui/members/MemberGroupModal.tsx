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
  'h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-base text-gray-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/15 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:bg-gray-950 md:h-10 md:text-sm';

const priceFieldClassName =
  'h-11 w-[7.25rem] shrink-0 rounded-xl border border-gray-200 bg-white px-3 text-right text-base tabular-nums text-gray-900 outline-none transition [appearance:textfield] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 md:h-10 md:w-28 md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

function priceSummary(group: MemberGroupRecord) {
  if (group.prices.length === 0) return 'ใช้ราคาประกาศ';
  return `ตั้งราคา ${group.prices.length} รายการ`;
}

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
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');
  const productTypesRef = useRef(productTypes);
  productTypesRef.current = productTypes;

  useEffect(() => {
    if (!isOpen) return;
    setEditingId(null);
    setName('');
    setPrices(emptyPrices(productTypesRef.current));
    setError(null);
    setMobileView('list');
  }, [isOpen]);

  if (!isOpen) return null;

  const startNew = () => {
    setEditingId(null);
    setName('');
    setPrices(emptyPrices(productTypes));
    setError(null);
    setMobileView('editor');
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
    setMobileView('editor');
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
      setMobileView('list');
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
      if (editingId === group.id) {
        startNew();
        setMobileView('list');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const editingGroup = groups.find((group) => group.id === editingId) ?? null;
  const mobileTitle = mobileView === 'editor' ? editingGroup?.name || 'กลุ่มใหม่' : 'กลุ่มสมาชิก';

  return (
    <div className="fixed inset-0 z-[1100] flex items-stretch justify-center md:items-center md:p-4">
      <div className="absolute inset-0 bg-gray-950/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-group-title"
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-xl dark:bg-gray-900 md:h-auto md:max-h-[min(720px,calc(100%-2rem))] md:max-w-3xl md:rounded-2xl"
      >
        <div className="flex items-center gap-1 border-b border-gray-100 px-2 py-2 dark:border-gray-800 md:px-4 md:py-3">
          <button
            type="button"
            onClick={() => setMobileView('list')}
            aria-label="กลับ"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden ${
              mobileView === 'editor' ? '' : 'hidden'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1 px-2">
            <h2 id="member-group-title" className="truncate text-base font-semibold text-gray-900 dark:text-white md:text-lg">
              <span className="md:hidden">{mobileTitle}</span>
              <span className="hidden md:inline">กลุ่มสมาชิก</span>
            </h2>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              <span className="md:hidden">
                {mobileView === 'list' ? `${groups.length} กลุ่ม` : 'เว้นราคาไว้ได้ ใช้ราคาประกาศ'}
              </span>
              <span className="hidden md:inline">เว้นช่องราคาไว้ ระบบใช้ราคาประกาศของวันนั้น</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[15rem_1fr]">
          <div
            className={`min-h-0 flex-col overflow-y-auto p-3 ${
              mobileView === 'list' ? 'flex' : 'hidden'
            } md:flex md:border-r md:border-gray-100 md:dark:border-gray-800`}
          >
            <button
              type="button"
              onClick={startNew}
              className="mb-3 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-3 text-sm font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 md:mb-2 md:animate-none md:justify-start md:bg-none md:bg-transparent md:text-gray-700 md:shadow-none md:hover:bg-gray-100 dark:md:text-gray-200 dark:md:hover:bg-gray-800"
            >
              <span aria-hidden="true">+</span>
              กลุ่มใหม่
            </button>
            {groups.length === 0 ? (
              <p className="px-1 py-10 text-center text-sm text-gray-400 md:py-4 md:text-left">ยังไม่มีกลุ่ม</p>
            ) : (
              <div className="flex flex-col gap-2 md:gap-0.5">
                {groups.map((group) => {
                  const selected = editingId === group.id;
                  return (
                    <div
                      key={group.id}
                      className={`flex items-center rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/40 md:rounded-xl md:border-transparent md:bg-transparent md:dark:border-transparent md:dark:bg-transparent ${
                        selected ? 'md:bg-primary-50 md:dark:bg-primary-950/40' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => startEdit(group)}
                        className="flex min-h-14 min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm ${
                              selected
                                ? 'font-semibold text-gray-900 dark:text-white md:text-primary-800 md:dark:text-primary-100'
                                : 'font-medium text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {group.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                            {priceSummary(group)}
                          </span>
                        </span>
                        <svg className="h-4 w-4 shrink-0 text-gray-300 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(group)}
                        disabled={saving}
                        aria-label={`ลบ ${group.name}`}
                        className="mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                })}
              </div>
            )}
          </div>

          <form
            className={`min-h-0 flex-col ${mobileView === 'editor' ? 'flex' : 'hidden'} md:flex`}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 md:p-5">
              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
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

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ราคาต่อกิโลกรัม</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 md:hidden">
                  เว้นไว้ได้ ระบบใช้ราคาประกาศของวันนั้น
                </p>
                {productTypes.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-400">ยังไม่มีประเภทสินค้า</p>
                ) : (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
                    {productTypes.map((type) => (
                      <label
                        key={type.id}
                        className="flex items-center gap-3 border-b border-gray-100 px-3 py-2.5 last:border-b-0 dark:border-gray-800"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {type.name}
                          </span>
                          <span className="block truncate text-[11px] text-gray-400">{type.code}</span>
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={prices[type.id] ?? ''}
                          onChange={(event) =>
                            setPrices((current) => ({ ...current, [type.id]: event.target.value }))
                          }
                          disabled={saving}
                          placeholder="—"
                          aria-label={`ราคา ${type.name}`}
                          className={priceFieldClassName}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-gray-800">
              {editingGroup ? (
                <button
                  type="button"
                  onClick={() => handleDelete(editingGroup)}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-900/30 md:min-h-10"
                >
                  ลบ
                </button>
              ) : null}
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-4 text-sm font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:animate-none animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 md:flex-none"
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
