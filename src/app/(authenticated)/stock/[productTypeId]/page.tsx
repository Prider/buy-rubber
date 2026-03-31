'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import GamerLoader from '@/components/GamerLoader';
import { ListPagination } from '@/components/pagination/ListPagination';
import { formatCurrency, formatNumber } from '@/lib/utils';

type LedgerEntry = {
  id: string;
  refType: string;
  refNo: string | null;
  qtyChangeKg: number;
  unitCostPerKg: number | null;
  totalCost: number | null;
  balanceQtyKg: number;
  balanceAvgCostPerKg: number;
  date: string;
  notes: string | null;
};

type LedgerResponse = {
  productType: { id: string; code: string; name: string };
  position: { quantityKg: number; avgCostPerKg: number };
  entries: LedgerEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export default function StockDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ productTypeId: string }>();
  const productTypeId = params.productTypeId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [position, setPosition] = useState<{ quantityKg: number; avgCostPerKg: number } | null>(null);
  const [productType, setProductType] = useState<{ id: string; code: string; name: string } | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 1,
  });

  const [page, setPage] = useState(1);
  const limit = 30;

  const title = useMemo(() => {
    if (!productType) return 'รายละเอียดสต็อก';
    return `สต็อกสินค้า: ${productType.code}`;
  }, [productType]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!productTypeId || !user) return;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const url = `/api/stock/ledger?productTypeId=${encodeURIComponent(productTypeId)}&page=${page}&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load ledger');
        const data = (await res.json()) as LedgerResponse;
        setProductType(data.productType);
        setPosition(data.position);
        setEntries(data.entries);
        setPagination(data.pagination);
      } catch (_e) {
        setError('ไม่สามารถโหลด ledger ได้');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [productTypeId, user, page]);

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-900 pb-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
                {title}
              </span>
            </h1>
            {productType ? <p className="text-gray-600 dark:text-gray-400">{productType.name}</p> : null}
          </div>
          {position ? (
            <div className="flex w-full flex-wrap items-center justify-center gap-3 text-sm md:w-auto md:flex-1">
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                คงเหลือปัจจุบัน: <span className="font-semibold">{formatNumber(position.quantityKg)}</span> กก.
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                ต้นทุนเฉลี่ย: <span className="font-semibold">{formatCurrency(position.avgCostPerKg)}</span> / กก.
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => router.push('/stock')}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            กลับไปหน้าสต็อกสินค้า
          </button>
        </div>
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}
        <div className="overflow-auto mb-4">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">วันที่</th>
                <th className="px-4 py-3 text-left">ประเภท</th>
                <th className="px-4 py-3 text-left">เลขที่อ้างอิง</th>
                <th className="px-4 py-3 text-right">เปลี่ยนสต็อก (kg)</th>
                <th className="px-4 py-3 text-right">หน่วยต้นทุน</th>
                <th className="px-4 py-3 text-right">คงเหลือ (kg)</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    ยังไม่มี ledger
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="border-t border-gray-100 dark:border-gray-600">
                    <td className="px-4 py-3">{new Date(e.date).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3">
                      <span className={e.refType === 'PURCHASE' ? 'text-green-600' : 'text-red-600'}>{e.refType}</span>
                    </td>
                    <td className="px-4 py-3">{e.refNo ?? '-'}</td>
                    <td className={`px-4 py-3 text-right ${e.qtyChangeKg >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatNumber(e.qtyChangeKg)}
                    </td>
                    <td className="px-4 py-3 text-right">{e.unitCostPerKg != null ? formatCurrency(e.unitCostPerKg) : '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatNumber(e.balanceQtyKg)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <ListPagination pagination={pagination} loading={loading} onPageChange={setPage} />
        </div>
    </div>
  );
}

