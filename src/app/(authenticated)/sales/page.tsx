'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';
import { formatCurrency, formatNumber } from '@/lib/utils';

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
  sellingType: string;
}

function getTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const SELLING_TYPES = ['จ่ายสด', 'ขายล่วง', 'ฝาก'];
const EXPENSE_TYPES = ['ค่าขนส่ง', 'ค่าแรง', 'ค่าบริการ', 'อื่นๆ'];

export default function SalesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);

  const [formData, setFormData] = useState<SaleFormData>({
    date: getTodayDate(),
    companyName: '',
    productTypeId: '',
    weight: '',
    rubberPercent: '',
    pricePerUnit: '',
    expenseType: '',
    sellingType: SELLING_TYPES[0],
  });

  const totalPreview = useMemo(() => {
    const w = parseFloat(formData.weight) || 0;
    const p = parseFloat(formData.pricePerUnit) || 0;
    const total = w * p;
    return total > 0 ? total : 0;
  }, [formData.weight, formData.pricePerUnit]);

  const loadData = async () => {
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
        const saleRows = await salesRes.json();
        setSales(saleRows);
      }
    } catch (_e) {
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isLoading, user, router]);

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

    setSaving(true);
    setError('');
    try {
      const payload = {
        userId: user.id,
        date: formData.date,
        companyName: formData.companyName,
        productTypeId: formData.productTypeId,
        weight: parseFloat(formData.weight),
        rubberPercent: formData.rubberPercent === '' ? null : parseFloat(formData.rubberPercent),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        expenseType: formData.expenseType || null,
        sellingType: formData.sellingType,
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'ไม่สามารถบันทึกรายการขาย');
        return;
      }

      setSales((prev) => [data, ...prev]);
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
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-hidden">
        <div className="lg:col-span-2 h-full overflow-hidden flex flex-col">
          <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">บันทึกการขาย</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">กรอกข้อมูลการขายสินค้า</p>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {error && (
                <div className="p-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1">วันที่</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-700 text-white border-gray-600" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">ชื่อบริษัทปลายทาง</label>
                <input name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-700 text-white border-gray-600" placeholder="เช่น บริษัท A" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">ประเภทสินค้า</label>
                <select name="productTypeId" value={formData.productTypeId} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-700 text-white border-gray-600">
                  <option value="">เลือกประเภทสินค้า</option>
                  {productTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>{pt.code} - {pt.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">น้ำหนักที่ขาย (กก.)</label>
                  <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-700 text-white border-gray-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">เปอร์เซ็นต์ยาง (%)</label>
                  <input type="number" step="0.01" name="rubberPercent" value={formData.rubberPercent} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-700 text-white border-gray-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">ราคา (บาท/กก.)</label>
                  <input type="number" step="0.01" name="pricePerUnit" value={formData.pricePerUnit} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-700 text-white border-gray-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">ชนิดค่าใช้จ่าย</label>
                  <select name="expenseType" value={formData.expenseType} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-700 text-white border-gray-600">
                    <option value="">ไม่ระบุ</option>
                    {EXPENSE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">รูปแบบการขาย</label>
                <select name="sellingType" value={formData.sellingType} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-700 text-white border-gray-600">
                  {SELLING_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm">
                ยอดรวมประมาณการ: <span className="font-semibold">{formatCurrency(totalPreview)}</span>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึก Selling Transactions'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 h-full overflow-hidden flex flex-col">
          <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ตารางรายการขาย</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">วันที่</th>
                    <th className="px-3 py-2 text-left">เลขที่</th>
                    <th className="px-3 py-2 text-left">บริษัท</th>
                    <th className="px-3 py-2 text-left">ประเภทสินค้า</th>
                    <th className="px-3 py-2 text-right">น้ำหนัก</th>
                    <th className="px-3 py-2 text-right">%ยาง</th>
                    <th className="px-3 py-2 text-right">ราคา</th>
                    <th className="px-3 py-2 text-left">ชนิดค่าใช้จ่าย</th>
                    <th className="px-3 py-2 text-left">รูปแบบขาย</th>
                    <th className="px-3 py-2 text-right">ยอดรวม</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-gray-500">ยังไม่มีข้อมูลการขาย</td>
                    </tr>
                  ) : (
                    sales.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2">{new Date(row.date).toLocaleDateString('th-TH')}</td>
                        <td className="px-3 py-2">{row.saleNo}</td>
                        <td className="px-3 py-2">{row.companyName}</td>
                        <td className="px-3 py-2">{row.productType?.name || '-'}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(row.weight)}</td>
                        <td className="px-3 py-2 text-right">{row.rubberPercent != null ? formatNumber(row.rubberPercent) : '-'}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(row.pricePerUnit)}</td>
                        <td className="px-3 py-2">{row.expenseType || '-'}</td>
                        <td className="px-3 py-2">{row.sellingType}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency(row.totalAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

