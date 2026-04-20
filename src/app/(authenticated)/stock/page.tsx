'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import GamerLoader from '@/components/GamerLoader';
import ProductTypeManagement from '@/components/prices/ProductTypeManagement';
import { ListPagination } from '@/components/pagination/ListPagination';
import { useAlert } from '@/hooks/useAlert';
import { usePriceData } from '@/hooks/usePriceData';
import { formatCurrency, formatNumber } from '@/lib/utils';

const ProductTypeFormModal = dynamic(
  () => import('@/components/prices/ProductTypeFormModal'),
  { ssr: false, loading: () => null }
);

type StockPositionRow = {
  productTypeId: string;
  productType: { id: string; code: string; name: string };
  quantityKg: number;
  avgCostPerKg: number;
  avgSellingPricePerKg?: number | null;
  soldKg?: number | null;
};

const PNL_EPS = 1e-6;

interface ProductType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
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

export default function StockPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError, showConfirm } = useAlert();
  const { productTypes, loadData } = usePriceData();

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
    return [...rows].sort((a, b) => b.quantityKg - a.quantityKg);
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
      const res = await fetch('/api/stock/positions');
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
      await loadData();
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
      await loadData();
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

  const handleReactivateProductType = async (productType: ProductType) => {
    try {
      await axios.put(`/api/product-types/${productType.id}`, {
        name: productType.name,
        description: productType.description || '',
        isActive: true,
      });
      await loadData();
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

  return (
    <>
      <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-900 pb-8">
        <div className="space-y-6 mb-6">
          <ProductTypeManagement
            productTypes={productTypes}
            onAdd={openProductTypeForm}
            onEdit={handleEditProductType}
            onDelete={handleDeleteProductType}
            onReactivate={handleReactivateProductType}
          />
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
                จัดการสต็อกสินค้า
              </span>
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {sortedRows.length} รายการ
            </p>
          </div>
          {error ? <p className="text-red-600 mt-2">{error}</p> : null}
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              แสดงจำนวนสต็อก (kg), ราคาเฉลี่ยต้นทุนต่อ kg, ราคาขายเฉลี่ยต่อ kg และกำไร/ขาดทุน
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">รหัสสินค้า</th>
                <th className="px-4 py-3 text-left">ชื่อสินค้า</th>
                <th className="px-4 py-3 text-right">สต็อกคงเหลือ (kg)</th>
                <th className="px-4 py-3 text-right">ราคาเฉลี่ยต้นทุน / kg</th>
                <th className="px-4 py-3 text-right">ราคาขายเฉลี่ย / kg</th>
                <th className="px-4 py-3 text-right">กำไร/ขาดทุน</th>
              </tr>
            </thead>

            <tbody>
              {pagedRows.map((row) => (
                <tr
                  key={row.productTypeId}
                  title="ดูรายละเอียด"
                  className="group cursor-pointer border-t border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  onClick={() => router.push(`/stock/${row.productTypeId}`)}
                >
                  <td className="px-4 py-3">{row.productType.code}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{row.productType.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatNumber(row.quantityKg)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.avgCostPerKg)}</td>
                  <td className="px-4 py-3 text-right">
                    {row.avgSellingPricePerKg != null ? formatCurrency(row.avgSellingPricePerKg) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ProfitLossCell
                      value={
                        row.avgSellingPricePerKg != null
                          ? row.soldKg != null && row.soldKg > 0
                            ? (row.avgSellingPricePerKg - row.avgCostPerKg) * row.soldKg
                            : null
                          : null
                      }
                    />
                  </td>
                </tr>
              ))}

              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    ไม่มีข้อมูลสต็อก
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
