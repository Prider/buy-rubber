'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';
import SalesFormCard from '@/components/sales/SalesFormCard';
import SalesTable from '@/components/sales/SalesTable';
import SalesPagination from '@/components/sales/SalesPagination';

interface ProductType {
  id: string;
  code: string;
  name: string;
}

interface SaleRow {
  id: string;
  saleNo: string;
  date: string;
  companyName: string;
  productTypeId: string;
  productType?: { name: string; code: string };
  weight: number;
  rubberPercent: number | null;
  pricePerUnit: number;
  expenseType: string | null;
  expenseCost: number | null;
  expenseNote: string | null;
  sellingType: string;
  totalAmount: number;
}

interface SaleFormData {
  date: string;
  companyName: string;
  productTypeId: string;
  weight: string;
  rubberPercent: string;
  pricePerUnit: string;
  expenseType: string;
  expenseCost: string;
  expenseNote: string;
  sellingType: string;
}

type SaleRowApi = Omit<SaleRow, 'expenseNote'> & {
  notes?: string | null;
  expenseNote?: string | null;
};

const SELLING_TYPES = ['จ่ายสด', 'ขายล่วง', 'ฝาก'];
// Note: expense types are rendered in `SalesFormCard`

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseOptionalNumber(v: string): number | null {
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseRequiredNumber(v: string): number | null {
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function SalesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  const totalPreview = useMemo(() => {
    const w = parseRequiredNumber(formData.weight) ?? 0;
    const p = parseRequiredNumber(formData.pricePerUnit) ?? 0;
    const expenseCost = parseOptionalNumber(formData.expenseCost) ?? 0;
    const total = w * p - expenseCost;
    return total > 0 ? total : 0;
  }, [formData.weight, formData.pricePerUnit, formData.expenseCost]);

  const pagination = useMemo(() => {
    const total = sales.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    return {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages,
      hasMore: currentPage < totalPages,
    };
  }, [sales.length, currentPage]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sales.slice(start, end);
  }, [sales, currentPage]);

  useEffect(() => {
    if (pagination.page > pagination.totalPages) {
      setCurrentPage(pagination.totalPages);
    }
  }, [pagination.page, pagination.totalPages]);

  const normalizeSaleRow = useCallback((row: SaleRowApi): SaleRow => {
    const { notes, expenseNote, ...rest } = row;
    return { ...rest, expenseNote: expenseNote ?? notes ?? null };
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [productRes, salesRes] = await Promise.all([
        fetch('/api/product-types'),
        fetch('/api/sales'),
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
  }, [normalizeSaleRow]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isLoading, user, router, loadData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
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
  };

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
      const payload = {
        userId: user.id,
        date: formData.date,
        companyName: formData.companyName.trim(),
        productTypeId: formData.productTypeId,
        weight,
        rubberPercent: formData.rubberPercent === '' ? null : parseFloat(formData.rubberPercent),
        pricePerUnit,
        expenseType: formData.expenseType || null,
        expenseCost: parseOptionalNumber(formData.expenseCost),
        notes: formData.expenseNote.trim() ? formData.expenseNote : null,
        sellingType: formData.sellingType,
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as SaleRowApi & { error?: string };
      if (!res.ok) {
        setError(data.error || 'ไม่สามารถบันทึกรายการขาย');
        return;
      }

      setSales((prev) => [normalizeSaleRow(data as SaleRowApi), ...prev]);
      setCurrentPage(1);
      resetForm();
    } catch (_e) {
      setError('ไม่สามารถบันทึกรายการขาย');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
        <div className="shrink-0 w-full min-w-0">
          <SalesFormCard
            error={error}
            productTypes={productTypes}
            formData={formData}
            totalPreview={totalPreview}
            saving={saving}
            onInputChange={handleInputChange}
            onSave={handleSave}
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
          <SalesTable sales={paginatedSales} />
          <SalesPagination
            pagination={pagination}
            loading={saving}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}

