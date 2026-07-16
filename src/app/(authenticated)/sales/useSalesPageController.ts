'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useAlert } from '@/hooks/useAlert';
import {
  buildSalePayload,
  computePagination,
  getTodayDate,
  normalizeSaleRow,
  parseRequiredNumber,
  SELLING_TYPES,
  toInputDate,
  type ProductType,
  type SaleFormData,
  type SaleRow,
  type SaleRowApi,
  type SalesPagination,
} from './page.utils';

type SalesFieldError = Partial<Record<'weight' | 'pricePerUnit', string>>;

type StockPositionMap = Record<string, { quantityKg: number; avgCostPerKg: number }>;

type SalesListResponse =
  | SaleRowApi[]
  | {
      data: SaleRowApi[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };

const PAGE_SIZE = 10;

function emptyPagination(page = 1): SalesPagination {
  return {
    page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasMore: false,
  };
}

export function useSalesPageController() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showConfirm } = useAlert();

  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<SalesFieldError>({});
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [stockPositionMap, setStockPositionMap] = useState<StockPositionMap>({});
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [pagination, setPagination] = useState<SalesPagination>(emptyPagination);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const lookupsLoadedRef = useRef(false);
  const salesAbortRef = useRef<AbortController | null>(null);

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

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const applyStockPositions = useCallback((rows: Array<{
    productTypeId: string;
    quantityKg: number;
    avgCostPerKg: number;
  }>) => {
    const nextMap: StockPositionMap = {};
    for (const row of rows) {
      nextMap[row.productTypeId] = {
        quantityKg: row.quantityKg ?? 0,
        avgCostPerKg: row.avgCostPerKg ?? 0,
      };
    }
    setStockPositionMap(nextMap);
  }, []);

  const loadLookups = useCallback(async () => {
    const [stockPositionsRes, productTypesRes] = await Promise.all([
      fetch('/api/stock/positions'),
      fetch('/api/product-types'),
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
      applyStockPositions(rows);
    }
  }, [applyStockPositions]);

  const loadSales = useCallback(async (page: number, search: string) => {
    salesAbortRef.current?.abort();
    const controller = new AbortController();
    salesAbortRef.current = controller;

    try {
      setListLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search.trim()) {
        params.set('search', search.trim());
      }

      const salesListRes = await fetch(`/api/sales?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!salesListRes.ok) {
        setError('ไม่สามารถโหลดข้อมูลได้');
        return;
      }

      const body = (await salesListRes.json()) as SalesListResponse;

      if (Array.isArray(body)) {
        setSales(body.map(normalizeSaleRow));
        setPagination(computePagination(body.length, page, PAGE_SIZE));
      } else {
        setSales((body.data ?? []).map(normalizeSaleRow));
        const p = body.pagination;
        setPagination({
          page: p.page,
          limit: p.limit,
          total: p.total,
          totalPages: p.totalPages || 1,
          hasMore: p.page < p.totalPages,
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      if (salesAbortRef.current === controller) {
        salesAbortRef.current = null;
        setListLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (!lookupsLoadedRef.current) {
          setInitialLoading(true);
          await loadLookups();
          if (cancelled) return;
          lookupsLoadedRef.current = true;
        }

        await loadSales(currentPage, debouncedSearchTerm);
      } catch {
        if (!cancelled) setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      salesAbortRef.current?.abort();
    };
  }, [isLoading, user, router, currentPage, debouncedSearchTerm, loadLookups, loadSales]);

  useEffect(() => {
    if (pagination.page > pagination.totalPages) {
      setCurrentPage(pagination.totalPages);
    }
  }, [pagination.page, pagination.totalPages]);

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

  const refreshStock = useCallback(async () => {
    const stockRes = await fetch('/api/stock/positions');
    if (stockRes.ok) {
      const rows = (await stockRes.json()) as Array<{
        productTypeId: string;
        quantityKg: number;
        avgCostPerKg: number;
      }>;
      applyStockPositions(rows);
    }
  }, [applyStockPositions]);

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

      resetForm();
      if (!isEditing) {
        setCurrentPage(1);
      }
      await Promise.all([
        loadSales(isEditing ? currentPage : 1, debouncedSearchTerm),
        refreshStock(),
      ]);
    } catch {
      setError(editingSaleId ? 'ไม่สามารถแก้ไขรายการขาย' : 'ไม่สามารถบันทึกรายการขาย');
    } finally {
      setSaving(false);
    }
  }, [
    currentPage,
    debouncedSearchTerm,
    editingSaleId,
    formData,
    loadSales,
    refreshStock,
    resetForm,
    selectedStockInfo?.quantityKg,
    user?.id,
  ]);

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

        if (editingSaleId === saleId) {
          resetForm();
        }

        const nextPage =
          sales.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        if (nextPage !== currentPage) {
          setCurrentPage(nextPage);
        } else {
          await loadSales(currentPage, debouncedSearchTerm);
        }
        await refreshStock();
      } catch {
        setError('ไม่สามารถลบรายการขาย');
      } finally {
        setDeletingSaleId(null);
      }
    },
    [
      currentPage,
      debouncedSearchTerm,
      editingSaleId,
      loadSales,
      refreshStock,
      resetForm,
      sales,
      showConfirm,
    ],
  );

  return {
    isLoading,
    loading: initialLoading,
    listLoading,
    saving,
    error,
    fieldErrors,
    productTypes,
    formData,
    paginatedSales: sales,
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
