'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';
import SalesFormCard from '@/components/sales/SalesFormCard';
import SalesTable from '@/components/sales/SalesTable';
import { useDebounce } from '@/hooks/useDebounce';
import { useAlert } from '@/hooks/useAlert';
import {
  buildSalePayload,
  computePagination,
  computeTotalPreview,
  getTodayDate,
  normalizeSaleRow,
  paginateRows,
  parseRequiredNumber,
  SELLING_TYPES,
  toInputDate,
  type ProductType,
  type SaleFormData,
  type SaleRow,
  type SaleRowApi,
} from './page.utils';

export default function SalesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showConfirm } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Search state (debounced) - similar UX to PurchasesList
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [formData, setFormData] = useState<SaleFormData>(() => ({
    date: getTodayDate(),
    companyName: '',
    productTypeId: '',
    weight: '',
    rubberPercent: '',
    pricePerUnit: '',
    expenseType: '',
    expenseCost: '',
    expenseNote: '',
    sellingType: SELLING_TYPES[0],
  }));

  const totalPreview = useMemo(() => computeTotalPreview(formData), [formData]);

  const pagination = useMemo(
    () => computePagination(sales.length, currentPage, pageSize),
    [sales.length, currentPage, pageSize],
  );

  const paginatedSales = useMemo(
    () => paginateRows(sales, currentPage, pageSize),
    [sales, currentPage, pageSize],
  );

  const editingSaleNo = useMemo(() => {
    if (!editingSaleId) return null;
    return sales.find((row) => row.id === editingSaleId)?.saleNo ?? null;
  }, [editingSaleId, sales]);

  useEffect(() => {
    if (pagination.page > pagination.totalPages) {
      setCurrentPage(pagination.totalPages);
    }
  }, [pagination.page, pagination.totalPages]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const salesUrl = debouncedSearchTerm
        ? `/api/sales?search=${encodeURIComponent(debouncedSearchTerm)}`
        : '/api/sales';
      const [productRes, salesRes] = await Promise.all([
        fetch('/api/product-types'),
        fetch(salesUrl),
      ]);

      if (productRes.ok) {
        const types = await productRes.json();
        setProductTypes(types);
      }
      if (salesRes.ok) {
        const saleRows = (await salesRes.json()) as SaleRowApi[];
        setSales(saleRows.map(normalizeSaleRow));
      }
    } catch (_e) {
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isLoading, user, router, loadData]);

  // When search changes, start from the first page slice
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      companyName: '',
      productTypeId: '',
      weight: '',
      rubberPercent: '',
      pricePerUnit: '',
      expenseType: '',
      expenseCost: '',
      expenseNote: '',
      sellingType: SELLING_TYPES[0],
    }));
    setEditingSaleId(null);
  }, []);

  const handleSave = async () => {
    if (!user?.id) {
      setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    if (!formData.companyName || !formData.productTypeId || !formData.weight || !formData.pricePerUnit || !formData.sellingType) {
      setError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    const weight = parseRequiredNumber(formData.weight);
    const pricePerUnit = parseRequiredNumber(formData.pricePerUnit);
    if (weight == null || pricePerUnit == null) {
      setError('กรุณากรอกน้ำหนักและราคาให้ถูกต้อง');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const isEditing = Boolean(editingSaleId);
      const payload = buildSalePayload(formData);

      const res = await fetch(isEditing ? `/api/sales/${editingSaleId}` : '/api/sales', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? payload : { ...payload, userId: user.id }),
      });

      const data = (await res.json()) as SaleRowApi & { error?: string };
      if (!res.ok) {
        setError(data.error || (isEditing ? 'ไม่สามารถแก้ไขรายการขาย' : 'ไม่สามารถบันทึกรายการขาย'));
        return;
      }

      if (isEditing) {
        const normalized = normalizeSaleRow(data as SaleRowApi);
        setSales((prev) => prev.map((row) => (row.id === normalized.id ? normalized : row)));
      } else {
        setSales((prev) => [normalizeSaleRow(data as SaleRowApi), ...prev]);
        setCurrentPage(1);
      }
      resetForm();
    } catch (_e) {
      setError(editingSaleId ? 'ไม่สามารถแก้ไขรายการขาย' : 'ไม่สามารถบันทึกรายการขาย');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = useCallback(
    (row: SaleRow) => {
      if (editingSaleId === row.id) {
        setError('');
        resetForm();
        return;
      }
      setError('');
      setEditingSaleId(row.id);
      setFormData({
        date: toInputDate(row.date),
        companyName: row.companyName,
        productTypeId: row.productTypeId,
        weight: String(row.weight),
        rubberPercent: row.rubberPercent != null ? String(row.rubberPercent) : '',
        pricePerUnit: String(row.pricePerUnit),
        expenseType: row.expenseType ?? '',
        expenseCost: row.expenseCost != null ? String(row.expenseCost) : '',
        expenseNote: row.expenseNote ?? '',
        sellingType: row.sellingType,
      });
    },
    [editingSaleId, resetForm],
  );

  const handleDelete = useCallback(
    async (saleId: string) => {
      const target = sales.find((row) => row.id === saleId);
      if (!target) return;

      const confirmed = await showConfirm(
        'ยืนยันการลบรายการ',
        `คุณแน่ใจหรือไม่ว่าต้องการลบรายการ ${target.saleNo}?`,
        {
          confirmText: 'ลบ',
          cancelText: 'ยกเลิก',
          variant: 'danger',
        },
      );
      if (!confirmed) return;

      setError('');
      setDeletingSaleId(saleId);
      try {
        const res = await fetch(`/api/sales/${saleId}`, { method: 'DELETE' });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error || 'ไม่สามารถลบรายการขาย');
          return;
        }

        setSales((prev) => prev.filter((row) => row.id !== saleId));
        if (editingSaleId === saleId) {
          resetForm();
        }
      } catch (_e) {
        setError('ไม่สามารถลบรายการขาย');
      } finally {
        setDeletingSaleId(null);
      }
    },
    [editingSaleId, sales, showConfirm, resetForm],
  );

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <div className="w-full min-w-0 shrink-0 overflow-x-auto">
        <SalesFormCard
          compact
          error={error}
          productTypes={productTypes}
          formData={formData}
          totalPreview={totalPreview}
          saving={saving}
          isEditing={Boolean(editingSaleId)}
          editingSaleNo={editingSaleNo}
          onInputChange={handleInputChange}
          onSave={handleSave}
          onCancelEdit={resetForm}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SalesTable
          compact
          sales={paginatedSales}
          pagination={pagination}
          loading={loading || saving}
          searchTerm={searchTerm}
          editingSaleId={editingSaleId}
          deletingSaleId={deletingSaleId}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

