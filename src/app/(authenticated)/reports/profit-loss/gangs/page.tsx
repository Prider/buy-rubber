'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getExportExcelButtonText, getExportPdfButtonText, isExportDisabled } from '../ui';
import { downloadGangsExcel } from './exportExcel';
import { downloadGangsPdf } from './exportPdf';

const PNL_EPS = 1e-6;
const gangLimit = 10;

type ProductType = { id: string; code: string; name: string; isActive?: boolean };

type GangCycle = {
  gangNo: number;
  startDate: string | Date;
  endDate: string | Date | null;
  soldKg: number;
  revenue: number;
  cogs: number;
  profitLoss: number;
  salesCount: number;
};

function formatThaiDate(value: string | Date | null | undefined): string {
  if (!value) return '–';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '–';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function pnlTone(value: number): string {
  if (value > PNL_EPS) return 'text-emerald-600 dark:text-emerald-400';
  if (value < -PNL_EPS) return 'text-rose-600 dark:text-rose-400';
  return 'text-gray-600 dark:text-gray-400';
}

function ProfitLossText({ value, className = '' }: { value: number; className?: string }) {
  if (!Number.isFinite(value)) {
    return <span className="text-gray-400 dark:text-gray-500">–</span>;
  }
  const prefix = value > PNL_EPS ? '+' : '';
  return (
    <span className={`tabular-nums font-semibold ${pnlTone(value)} ${className}`}>
      {prefix}
      {formatCurrency(value)}
    </span>
  );
}

export default function ProfitLossGangsReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  const productTypeIdFromQuery = searchParams.get('productTypeId')?.trim() || '';

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [gangsLoading, setGangsLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState('');
  const [gangsError, setGangsError] = useState('');
  const [gangs, setGangs] = useState<GangCycle[]>([]);

  const selectedProductType = useMemo(
    () => productTypes.find((pt) => pt.id === selectedProductTypeId) ?? null,
    [productTypes, selectedProductTypeId],
  );

  const summary = useMemo(() => {
    return gangs.reduce(
      (acc, g) => {
        acc.soldKg += g.soldKg || 0;
        acc.revenue += g.revenue || 0;
        acc.cogs += g.cogs || 0;
        acc.profitLoss += g.profitLoss || 0;
        return acc;
      },
      { soldKg: 0, revenue: 0, cogs: 0, profitLoss: 0 },
    );
  }, [gangs]);

  const hasRows = gangs.length > 0;
  const exportBusy = exportingPdf || exportingExcel;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const loadProductTypes = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get<ProductType[]>('/api/product-types');
        const types = res.data || [];
        setProductTypes(types);

        const preferredId =
          productTypeIdFromQuery && types.some((pt) => pt.id === productTypeIdFromQuery)
            ? productTypeIdFromQuery
            : (types[0]?.id ?? '');
        setSelectedProductTypeId(preferredId);
      } catch (_e) {
        setError('ไม่สามารถโหลดรายการสินค้าได้');
      } finally {
        setLoading(false);
      }
    };

    loadProductTypes();
  }, [isLoading, productTypeIdFromQuery, router, user]);

  useEffect(() => {
    if (!selectedProductTypeId) return;

    const loadGangs = async () => {
      try {
        setGangsLoading(true);
        setGangsError('');

        const res = await axios.get<{ data: GangCycle[] }>('/api/stock/gangs', {
          params: { productTypeId: selectedProductTypeId, page: 1, limit: gangLimit },
        });

        setGangs(res.data.data || []);
      } catch (e) {
        logger.error('Failed to load gangs report', e);
        setGangsError('ไม่สามารถโหลดกำไร/ขาดทุนต่อกองได้');
      } finally {
        setGangsLoading(false);
      }
    };

    void loadGangs();
  }, [selectedProductTypeId]);

  const handleExportExcel = useCallback(async () => {
    if (!hasRows || !selectedProductType || exportBusy) return;
    setExportingExcel(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      downloadGangsExcel({
        rows: gangs,
        summary,
        product: { code: selectedProductType.code, name: selectedProductType.name },
      });
    } finally {
      setExportingExcel(false);
    }
  }, [exportBusy, gangs, hasRows, selectedProductType, summary]);

  const handleExportPdf = useCallback(async () => {
    if (!hasRows || !selectedProductType || exportBusy) return;
    setExportingPdf(true);
    try {
      await downloadGangsPdf({
        rows: gangs,
        summary,
        product: { code: selectedProductType.code, name: selectedProductType.name },
      });
    } finally {
      setExportingPdf(false);
    }
  }, [exportBusy, gangs, hasRows, selectedProductType, summary]);

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/reports/profit-loss"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span aria-hidden>←</span>
          รายงานกำไร / ขาดทุน
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
                กำไร / ขาดทุนต่อกอง
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ล่าสุด {gangLimit} กอง · ตามรอบสต็อกที่ขายจนหมด
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-64">
              <label
                htmlFor="gang-product-type"
                className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                สินค้า
              </label>
              <select
                id="gang-product-type"
                value={selectedProductTypeId}
                onChange={(e) => setSelectedProductTypeId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
              >
                {productTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.code} — {pt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleExportPdf()}
                disabled={isExportDisabled({ hasRows, loading: gangsLoading, exportBusy })}
                className="rounded-xl bg-rose-600 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {getExportPdfButtonText(exportingPdf)}
              </button>
              <button
                type="button"
                onClick={() => void handleExportExcel()}
                disabled={isExportDisabled({ hasRows, loading: gangsLoading, exportBusy })}
                className="rounded-xl bg-teal-600 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {getExportExcelButtonText(exportingExcel)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Summary */}
      {!error && !gangsError && gangs.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'ขายได้', value: `${formatNumber(summary.soldKg)} กก.` },
            { label: 'รายได้', value: formatCurrency(summary.revenue) },
            { label: 'ต้นทุน', value: formatCurrency(summary.cogs) },
            { label: 'สุทธิ', value: null as string | null, pnl: summary.profitLoss },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-100 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/80"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              {item.pnl != null ? (
                <p className="mt-1 text-lg">
                  <ProfitLossText value={item.pnl} />
                </p>
              ) : (
                <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {item.value}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Gang list */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">รายการกอง</h2>
            {selectedProductType ? (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {selectedProductType.code} · {selectedProductType.name}
              </p>
            ) : null}
          </div>
          {gangsLoading ? (
            <span className="text-xs text-gray-400 animate-pulse">กำลังโหลด...</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {gangs.length} กอง
            </span>
          )}
        </div>

        {gangsLoading && gangs.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">กำลังโหลด...</div>
        ) : gangsError ? (
          <div className="px-5 py-16 text-center text-sm text-rose-600 dark:text-rose-300">{gangsError}</div>
        ) : gangs.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">ยังไม่มีข้อมูลกองสำหรับสินค้านี้</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
            {gangs.map((g) => {
              const isOpen = !g.endDate;
              return (
                <li
                  key={g.gangNo}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        กอง {g.gangNo}
                      </span>
                      {isOpen ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          กำลังดำเนินอยู่
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatThaiDate(g.startDate)}
                      <span className="mx-1.5 text-gray-300 dark:text-gray-600">→</span>
                      {isOpen ? 'ปัจจุบัน' : formatThaiDate(g.endDate)}
                      <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                      {formatNumber(g.soldKg)} กก.
                      {g.salesCount > 0 ? (
                        <>
                          <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                          {g.salesCount} รายการขาย
                        </>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-6 sm:items-center sm:justify-end">
                    <div className="hidden text-right sm:block">
                      <p className="text-[11px] text-gray-400">รายได้</p>
                      <p className="text-sm tabular-nums text-gray-700 dark:text-gray-200">
                        {formatCurrency(g.revenue)}
                      </p>
                    </div>
                    <div className="hidden text-right md:block">
                      <p className="text-[11px] text-gray-400">ต้นทุน</p>
                      <p className="text-sm tabular-nums text-gray-700 dark:text-gray-200">
                        {formatCurrency(g.cogs)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400">กำไร / ขาดทุน</p>
                      <ProfitLossText value={g.profitLoss} className="text-base" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
