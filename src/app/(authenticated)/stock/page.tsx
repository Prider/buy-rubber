'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import GamerLoader from '@/components/GamerLoader';
import { ListPagination } from '@/components/pagination/ListPagination';
import { useAlert } from '@/hooks/useAlert';
import { getMaxProductTypes } from '@/lib/maxProductTypes';
import { formatCurrency, formatNumber } from '@/lib/utils';

const ProductTypeFormModal = dynamic(
  () => import(/* webpackPrefetch: true */ '@/components/prices/ProductTypeFormModal'),
  { ssr: false, loading: () => null },
);

type StockPositionRow = {
  productTypeId: string;
  productType: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    isActive?: boolean;
  };
  quantityKg: number;
  avgCostPerKg: number;
  avgSellingPricePerKg?: number | null;
  soldKg?: number | null;
};

const MAX_PRODUCT_TYPES = getMaxProductTypes();

const actionClass = 'rounded-md px-2 py-1 text-xs font-medium transition-colors';

const PNL_EPS = 1e-6;

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

function toProductType(row: StockPositionRow): ProductType {
  return {
    id: row.productType.id,
    code: row.productType.code,
    name: row.productType.name,
    description: row.productType.description || '',
    isActive: row.productType.isActive,
  };
}

function profitLossValue(row: StockPositionRow): number | null {
  if (row.avgSellingPricePerKg == null) return null;
  if (row.soldKg != null && row.soldKg > 0) {
    return (row.avgSellingPricePerKg - row.avgCostPerKg) * row.soldKg;
  }
  return null;
}

function ProfitLossCell({ value }: { value: number | null | undefined }) {
  if (value == null || !Number.isFinite(value)) {
    return <span className="text-gray-400 dark:text-gray-500">–</span>;
  }

  const isGain = value > PNL_EPS;
  const isLoss = value < -PNL_EPS;
  const cls = isGain
    ? 'text-green-600 dark:text-green-400 font-semibold tabular-nums'
    : isLoss
      ? 'text-red-600 dark:text-red-400 font-semibold tabular-nums'
      : 'text-gray-600 dark:text-gray-400 tabular-nums';
  const prefix = isGain ? '+' : '';

  return (
    <span className={cls}>
      {prefix}
      {formatCurrency(value)}
    </span>
  );
}

function StockRowActions({
  layout,
  isInactive,
  onHistory,
  onEdit,
  onSuspend,
  onReactivate,
  onDelete,
}: {
  layout: 'table' | 'card';
  isInactive: boolean;
  onHistory: () => void;
  onEdit: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}) {
  const buttonClass =
    layout === 'card'
      ? 'min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-colors'
      : actionClass;

  return (
    <div
      className={
        layout === 'card'
          ? 'grid grid-cols-2 gap-2'
          : 'flex items-center justify-end gap-1 whitespace-nowrap'
      }
    >
      <button
        type="button"
        onClick={onHistory}
        className={`${buttonClass} text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30`}
      >
        ประวัติ
      </button>
      <button
        type="button"
        onClick={onEdit}
        className={`${buttonClass} text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700`}
      >
        แก้ไข
      </button>
      {isInactive ? (
        <button
          type="button"
          onClick={onReactivate}
          className={`${buttonClass} text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30`}
        >
          เปิดใช้งาน
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onSuspend}
            className={`${buttonClass} text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/30`}
          >
            กำลังนำส่ง
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${buttonClass} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30`}
          >
            ลบ
          </button>
        </>
      )}
    </div>
  );
}

export default function StockPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError, showConfirm } = useAlert();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<StockPositionRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 30;

  const [showProductTypeForm, setShowProductTypeForm] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [productTypeForm, setProductTypeForm] = useState({
    code: '',
    name: '',
    description: '',
  });

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => a.productType.code.localeCompare(b.productType.code));
  }, [rows]);

  const pagination = useMemo(() => {
    const total = sortedRows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(currentPage, totalPages);
    return { page, limit, total, totalPages };
  }, [sortedRows.length, currentPage]);

  const pagedRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return sortedRows.slice(start, end);
  }, [sortedRows, pagination.page, pagination.limit]);

  useEffect(() => {
    if (currentPage !== pagination.page) {
      setCurrentPage(pagination.page);
    }
  }, [currentPage, pagination.page]);

  const loadStockPositions = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    try {
      if (!silent) setLoading(true);
      setError('');
      const res = await fetch('/api/stock/positions?includeInactive=1');
      if (!res.ok) throw new Error('Failed to load stock positions');
      const data = (await res.json()) as StockPositionRow[];
      setRows(data);
    } catch (_e) {
      setError('ไม่สามารถโหลดยอดสต็อกได้');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    loadStockPositions();
  }, [isLoading, user, router, loadStockPositions]);

  const handleProductTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProductType) {
        await axios.put(`/api/product-types/${editingProductType.id}`, {
          name: productTypeForm.name,
          description: productTypeForm.description,
        });
      } else {
        await axios.post('/api/product-types', productTypeForm);
      }

      closeProductTypeForm();
      await loadStockPositions({ silent: true });
      showSuccess(
        'สำเร็จ',
        editingProductType ? 'แก้ไขประเภทสินค้าเรียบร้อย' : 'เพิ่มประเภทสินค้าเรียบร้อย',
        { autoClose: true, autoCloseDelay: 3000 }
      );
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'เกิดข้อผิดพลาด';
      showError('เกิดข้อผิดพลาด', errorMsg);
    }
  };

  const handleEditProductType = (productType: ProductType) => {
    setEditingProductType(productType);
    setProductTypeForm({
      code: productType.code,
      name: productType.name,
      description: productType.description || '',
    });
    setShowProductTypeForm(true);
  };

  const handleDeleteProductType = async (productType: ProductType) => {
    const confirmed = await showConfirm(
      'ยืนยันการลบประเภทสินค้า',
      `คุณต้องการลบประเภทสินค้า "${productType.name}" (${productType.code}) หรือไม่?\n\nถ้ามีประวัติรับซื้อ การขาย หรือสต็อก ระบบจะปิดการใช้งานแทนการลบจริง เพื่อเก็บข้อมูลเดิมไว้\nถ้าไม่มีข้อมูลอ้างอิง ระบบจะลบจริง (รวมราคาที่ผูกกับประเภทนี้)`,
      {
        confirmText: 'ดำเนินการ',
        cancelText: 'ยกเลิก',
        variant: 'danger',
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await axios.delete<{ success?: boolean; deactivated?: boolean }>(
        `/api/product-types/${productType.id}`
      );
      await loadStockPositions({ silent: true });
      if (res.data?.deactivated) {
        showSuccess(
          'ปิดการใช้งานแล้ว',
          `ประเภทสินค้า "${productType.name}" ถูกปิดการใช้งานแล้ว (ยังใช้ในประวัติเดิมได้) กดเปิดใช้งานได้ในภายหลัง`,
          { autoClose: true, autoCloseDelay: 4000 }
        );
      } else {
        showSuccess('ลบสำเร็จ', `ลบประเภทสินค้า "${productType.name}" เรียบร้อยแล้ว`, {
          autoClose: true,
          autoCloseDelay: 3000,
        });
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'ไม่สามารถลบประเภทสินค้าได้';
      showError('เกิดข้อผิดพลาด', errorMsg);
    }
  };

  const handleSuspendProductType = async (productType: ProductType) => {
    const confirmed = await showConfirm(
      'ยืนยันการปิดรับซื้อชั่วคราว',
      `ประเภทสินค้า "${productType.name}" (${productType.code}) จะไม่สามารถรับซื้อเพิ่มได้จนกว่าจะเปิดใช้งานอีกครั้ง\n\nประวัติรับซื้อเดิมยังอยู่`,
      {
        confirmText: 'กำลังนำส่ง',
        cancelText: 'ยกเลิก',
        variant: 'warning',
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.put(`/api/product-types/${productType.id}`, {
        name: productType.name,
        description: productType.description || '',
        isActive: false,
      });
      await loadStockPositions({ silent: true });
      showSuccess(
        'กำลังนำส่ง',
        `ประเภทสินค้า "${productType.name}" ปิดรับซื้อชั่วคราวแล้ว กดเปิดใช้งานได้เมื่อต้องการรับซื้ออีกครั้ง`,
        { autoClose: true, autoCloseDelay: 4000 }
      );
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'ไม่สามารถปิดรับซื้อได้';
      showError('เกิดข้อผิดพลาด', errorMsg);
    }
  };

  const handleReactivateProductType = async (productType: ProductType) => {
    try {
      await axios.put(`/api/product-types/${productType.id}`, {
        name: productType.name,
        description: productType.description || '',
        isActive: true,
      });
      await loadStockPositions({ silent: true });
      showSuccess('เปิดใช้งานแล้ว', `ประเภทสินค้า "${productType.name}" พร้อมใช้งานอีกครั้ง`, {
        autoClose: true,
        autoCloseDelay: 3000,
      });
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'ไม่สามารถเปิดใช้งานได้';
      showError('เกิดข้อผิดพลาด', errorMsg);
    }
  };

  const openProductTypeForm = () => {
    setEditingProductType(null);
    setProductTypeForm({ code: '', name: '', description: '' });
    setShowProductTypeForm(true);
  };

  const closeProductTypeForm = () => {
    setShowProductTypeForm(false);
    setEditingProductType(null);
    setProductTypeForm({ code: '', name: '', description: '' });
  };

  const handleProductTypeFormChange = (field: string, value: string) => {
    setProductTypeForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  const activeCount = sortedRows.filter((row) => row.productType.isActive !== false).length;
  const inactiveCount = sortedRows.length - activeCount;
  const isMaxReached = sortedRows.length >= MAX_PRODUCT_TYPES;

  return (
    <>
      <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-900 pb-8">
        {error ? <p className="mb-4 text-red-600">{error}</p> : null}

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <div>
              <h1 className="text-base font-semibold">
                <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
                  สต็อกคงเหลือ
                </span>
              </h1>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                ใช้งาน {activeCount} · กำลังนำส่ง {inactiveCount} · สูงสุด {MAX_PRODUCT_TYPES}
              </p>
            </div>
            <button
              type="button"
              onClick={openProductTypeForm}
              disabled={isMaxReached}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400 lg:min-h-0 lg:w-auto lg:justify-start"
            >
              <span aria-hidden="true">+</span>
              <span>{isMaxReached ? 'ครบจำนวนสูงสุด' : 'เพิ่มประเภท'}</span>
            </button>
          </div>

          {isMaxReached && (
            <p className="border-b border-gray-100 px-5 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              สามารถเพิ่มประเภทสินค้าได้สูงสุด {MAX_PRODUCT_TYPES} รายการ
            </p>
          )}

          <div className="lg:hidden">
            {sortedRows.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">ยังไม่มีประเภทสินค้า</p>
            ) : (
              <ul className="flex flex-col gap-3 p-3 md:grid md:grid-cols-2 md:p-4">
                {pagedRows.map((row) => {
                  const productType = toProductType(row);
                  const isInactive = productType.isActive === false;
                  const struck = isInactive
                    ? 'line-through decoration-2 decoration-yellow-400 dark:decoration-yellow-300'
                    : '';
                  return (
                    <li
                      key={row.productTypeId}
                      className={`rounded-xl border p-3 ${
                        isInactive
                          ? 'border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-gray-900/40'
                          : 'border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/stock/${row.productTypeId}`)}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <span className="min-w-0">
                          <span className={`block font-mono text-xs text-gray-500 dark:text-gray-400 ${struck}`}>
                            {row.productType.code}
                          </span>
                          <span className={`mt-0.5 block text-base font-semibold text-gray-900 dark:text-gray-100 ${struck}`}>
                            {row.productType.name}
                          </span>
                        </span>
                        {isInactive ? (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            กำลังนำส่ง
                          </span>
                        ) : null}
                      </button>

                      <dl className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-gray-800">
                          <dt className="text-[11px] text-gray-500 dark:text-gray-400">สต็อกคงเหลือ (kg)</dt>
                          <dd className={`mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100 ${struck}`}>
                            {formatNumber(row.quantityKg)}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-gray-800">
                          <dt className="text-[11px] text-gray-500 dark:text-gray-400">ต้นทุน / kg</dt>
                          <dd className={`mt-0.5 text-sm tabular-nums text-gray-900 dark:text-gray-100 ${struck}`}>
                            {formatCurrency(row.avgCostPerKg)}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-gray-800">
                          <dt className="text-[11px] text-gray-500 dark:text-gray-400">ราคาขาย / kg</dt>
                          <dd className={`mt-0.5 text-sm tabular-nums text-gray-900 dark:text-gray-100 ${struck}`}>
                            {row.avgSellingPricePerKg != null ? formatCurrency(row.avgSellingPricePerKg) : '-'}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-white px-3 py-2 dark:bg-gray-800">
                          <dt className="text-[11px] text-gray-500 dark:text-gray-400">กำไร/ขาดทุน</dt>
                          <dd className={`mt-0.5 text-sm ${struck}`}>
                            <ProfitLossCell value={profitLossValue(row)} />
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-3">
                        <StockRowActions
                          layout="card"
                          isInactive={isInactive}
                          onHistory={() => router.push(`/stock/${row.productTypeId}`)}
                          onEdit={() => handleEditProductType(productType)}
                          onSuspend={() => handleSuspendProductType(productType)}
                          onReactivate={() => handleReactivateProductType(productType)}
                          onDelete={() => handleDeleteProductType(productType)}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="hidden overflow-auto lg:block">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">รหัสสินค้า</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">ชื่อสินค้า</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">สต็อกคงเหลือ (kg)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">ราคาเฉลี่ยต้นทุน / kg</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">ราคาขายเฉลี่ย / kg</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">กำไร/ขาดทุน</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {pagedRows.map((row) => {
                  const productType = toProductType(row);
                  const isInactive = productType.isActive === false;
                  const struck = isInactive
                    ? 'line-through decoration-2 decoration-yellow-400 dark:decoration-yellow-300'
                    : '';
                  return (
                    <tr
                      key={row.productTypeId}
                      title="ดูรายละเอียด"
                      className={`cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/40 ${
                        isInactive ? 'bg-gray-50/80 dark:bg-gray-900/30' : ''
                      }`}
                      onClick={() => router.push(`/stock/${row.productTypeId}`)}
                    >
                      <td className={`px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 ${struck}`}>
                        {row.productType.code}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span className={`font-medium text-gray-900 dark:text-gray-100 ${struck}`}>
                            {row.productType.name}
                          </span>
                          {isInactive ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              กำลังนำส่ง
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${struck}`}>
                        {formatNumber(row.quantityKg)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums ${struck}`}>{formatCurrency(row.avgCostPerKg)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${struck}`}>
                        {row.avgSellingPricePerKg != null ? formatCurrency(row.avgSellingPricePerKg) : '-'}
                      </td>
                      <td className={`px-4 py-3 text-right ${struck}`}>
                        <ProfitLossCell value={profitLossValue(row)} />
                      </td>
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <StockRowActions
                          layout="table"
                          isInactive={isInactive}
                          onHistory={() => router.push(`/stock/${row.productTypeId}`)}
                          onEdit={() => handleEditProductType(productType)}
                          onSuspend={() => handleSuspendProductType(productType)}
                          onReactivate={() => handleReactivateProductType(productType)}
                          onDelete={() => handleDeleteProductType(productType)}
                        />
                      </td>
                    </tr>
                  );
                })}

                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      ยังไม่มีประเภทสินค้า
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <ListPagination pagination={pagination} loading={loading} onPageChange={setCurrentPage} />
        </div>
      </div>

      <ProductTypeFormModal
        isOpen={showProductTypeForm}
        editingProductType={editingProductType}
        formData={productTypeForm}
        onClose={closeProductTypeForm}
        onSubmit={handleProductTypeSubmit}
        onChange={handleProductTypeFormChange}
      />
    </>
  );
}
