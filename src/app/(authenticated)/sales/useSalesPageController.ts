'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useAlert } from '@/hooks/useAlert';
import {
  buildSalePayload,
  computePagination,
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

type SalesFieldError = Partial<Record<'weight' | 'pricePerUnit', string>>;

type StockPositionMap = Record<string, { quantityKg: number; avgCostPerKg: number }>;

export function useSalesPageController() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showConfirm } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<SalesFieldError>({});
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [stockPositionMap, setStockPositionMap] = useState<StockPositionMap>({});
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;
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

  const pagination = useMemo(
    () => computePagination(sales.length, currentPage, pageSize),
    [sales.length, currentPage, pageSize],
  );

  const paginatedSales = useMemo(
    () => paginateRows(sales, currentPage, pageSize),
    [sales, currentPage, pageSize],
  );

  const hasValidationError = useMemo(() => Object.keys(fieldErrors).length > 0, [fieldErrors]);

  const isSubmitReady = useMemo(() => {
    if (
      !formData.companyName.trim() ||
      !formData.productTypeId ||
      !formData.weight ||
      !formData.pricePerUnit ||
      !formData.sellingType
    ) {
      return false;
    }

    const weight = parseRequiredNumber(formData.weight);
    const pricePerUnit = parseRequiredNumber(formData.pricePerUnit);
    return weight != null && pricePerUnit != null;
  }, [formData]);

  const selectedStockInfo = useMemo(() => {
    if (!formData.productTypeId) return null;
    return stockPositionMap[formData.productTypeId] ?? null;
  }, [formData.productTypeId, stockPositionMap]);

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

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const salesUrl = debouncedSearchTerm
        ? `/api/sales?search=${encodeURIComponent(debouncedSearchTerm)}`
        : '/api/sales';
      const [stockPositionsRes, productTypesRes, salesListRes] = await Promise.all([
        fetch('/api/stock/positions'),
        fetch('/api/product-types'),
        fetch(salesUrl),
      ]);

      if (productTypesRes.ok) {
        const types = await productTypesRes.json();
        setProductTypes(types);
      }

      if (stockPositionsRes.ok) {
        const rows = (await stockPositionsRes.json()) as Array<{
          productTypeId: string;
          quantityKg: number;
          avgCostPerKg: number;
        }>;
        const nextMap: StockPositionMap = {};
        for (const row of rows) {
          nextMap[row.productTypeId] = {
            quantityKg: row.quantityKg ?? 0,
            avgCostPerKg: row.avgCostPerKg ?? 0,
          };
        }
        setStockPositionMap(nextMap);
      }

      if (salesListRes.ok) {
        const saleRows = (await salesListRes.json()) as SaleRowApi[];
        setSales(saleRows.map(normalizeSaleRow));
      }
    } catch {
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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'weight' || name === 'pricePerUnit') {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, []);

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
    setFieldErrors({});
  }, []);

  const handleSave = useCallback(async () => {
    if (!user?.id) {
      setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    if (
      !formData.companyName ||
      !formData.productTypeId ||
      !formData.weight ||
      !formData.pricePerUnit ||
      !formData.sellingType
    ) {
      setError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    const weight = parseRequiredNumber(formData.weight);
    const pricePerUnit = parseRequiredNumber(formData.pricePerUnit);
    if (weight == null || pricePerUnit == null) {
      setFieldErrors({
        ...(weight == null ? { weight: 'invalid' } : {}),
        ...(pricePerUnit == null ? { pricePerUnit: 'invalid' } : {}),
      });
      setError('กรุณากรอกน้ำหนักและราคาให้ถูกต้อง');
      return;
    }

    const isEditing = Boolean(editingSaleId);
    const selectedStockKg = selectedStockInfo?.quantityKg ?? null;
    const EPS = 1e-6;
    if (!isEditing && selectedStockKg != null && weight > selectedStockKg + EPS) {
      setFieldErrors({ weight: 'exceeds-stock' });
      setError('น้ำหนักที่ขายต้องไม่เกินสต็อกคงเหลือ');
      return;
    }

    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
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
    } catch {
      setError(editingSaleId ? 'ไม่สามารถแก้ไขรายการขาย' : 'ไม่สามารถบันทึกรายการขาย');
    } finally {
      setSaving(false);
    }
  }, [editingSaleId, formData, resetForm, selectedStockInfo?.quantityKg, user?.id]);

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

        const stockRes = await fetch('/api/stock/positions');
        if (stockRes.ok) {
          const rows = (await stockRes.json()) as Array<{
            productTypeId: string;
            quantityKg: number;
            avgCostPerKg: number;
          }>;
          const nextMap: StockPositionMap = {};
          for (const row of rows) {
            nextMap[row.productTypeId] = {
              quantityKg: row.quantityKg ?? 0,
              avgCostPerKg: row.avgCostPerKg ?? 0,
            };
          }
          setStockPositionMap(nextMap);
        }
      } catch {
        setError('ไม่สามารถลบรายการขาย');
      } finally {
        setDeletingSaleId(null);
      }
    },
    [editingSaleId, resetForm, sales, showConfirm],
  );

  return {
    isLoading,
    loading,
    saving,
    error,
    fieldErrors,
    productTypes,
    formData,
    paginatedSales,
    pagination,
    searchTerm,
    editingSaleId,
    deletingSaleId,
    selectedStockInfo,
    editingSaleNo,
    hasValidationError,
    isSubmitReady,
    setCurrentPage,
    handleSearchChange,
    handleClearSearch,
    handleInputChange,
    handleSave,
    handleEdit,
    handleDelete,
    resetForm,
  };
}
