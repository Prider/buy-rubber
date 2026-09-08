'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';
import { ListPagination } from '@/components/pagination/ListPagination';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getExportExcelButtonText, getExportPdfButtonText, isExportDisabled } from '../ui';
import { isDateRangeInvalid, toInputDate } from '../utils';
import { downloadGangsExcel } from './exportExcel';
import { downloadGangsPdf } from './exportPdf';

const PNL_EPS = 1e-6;
const PAGE_SIZE = 15;
const EXPORT_LIMIT = 200;

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40';

function openDatePicker(input: HTMLInputElement) {
  try {
    input.showPicker?.();
  } catch {
    // ignore
  }
}

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

type GangsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type GangsApiResponse = {
  data: GangCycle[];
  pagination: GangsPagination;
};

function formatThaiDate(value: string | Date | null | undefined): string {
  if (!value) return '–';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '–';
  const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const timeStr = d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${dateStr} ${timeStr}`;
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

function summarizeGangs(rows: GangCycle[]) {
  return rows.reduce(
    (acc, g) => {
      acc.soldKg += g.soldKg || 0;
      acc.revenue += g.revenue || 0;
      acc.cogs += g.cogs || 0;
      acc.profitLoss += g.profitLoss || 0;
      return acc;
    },
    { soldKg: 0, revenue: 0, cogs: 0, profitLoss: 0 },
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<GangsPagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => toInputDate(now));

  const selectedProductType = useMemo(
    () => productTypes.find((pt) => pt.id === selectedProductTypeId) ?? null,
    [productTypes, selectedProductTypeId],
  );

  const summary = useMemo(() => summarizeGangs(gangs), [gangs]);

  const hasRows = gangs.length > 0;
  const rangeInvalid = isDateRangeInvalid(startDate, endDate);
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
  }, [isLoading, productTypeIdFromQuery, router, user?.id]);

  useEffect(() => {
    setPage(1);
  }, [endDate, selectedProductTypeId, startDate]);

  const loadGangs = useCallback(async () => {
    if (!selectedProductTypeId || rangeInvalid) return;

    try {
      setGangsLoading(true);
      setGangsError('');

      const res = await axios.get<GangsApiResponse>('/api/stock/gangs', {
        params: {
          productTypeId: selectedProductTypeId,
          startDate,
          endDate,
          page,
          limit: PAGE_SIZE,
        },
      });

      setGangs(res.data.data || []);
      setPagination(
        res.data.pagination || {
          page,
          limit: PAGE_SIZE,
          total: res.data.data?.length ?? 0,
          totalPages: 1,
        },
      );
    } catch (e) {
      logger.error('Failed to load gangs report', e);
      setGangsError('ไม่สามารถโหลดกำไร/ขาดทุนต่อกองได้');
      setGangs([]);
    } finally {
      setGangsLoading(false);
    }
  }, [endDate, page, rangeInvalid, selectedProductTypeId, startDate]);

  useEffect(() => {
    void loadGangs();
  }, [loadGangs]);

  const fetchAllGangsForExport = useCallback(async (): Promise<GangCycle[]> => {
    if (!selectedProductTypeId || rangeInvalid) return [];

    const res = await axios.get<GangsApiResponse>('/api/stock/gangs', {
      params: {
        productTypeId: selectedProductTypeId,
        startDate,
        endDate,
        page: 1,
        limit: EXPORT_LIMIT,
      },
    });

    return res.data.data || [];
  }, [endDate, rangeInvalid, selectedProductTypeId, startDate]);

  const handleExportExcel = useCallback(async () => {
    if (!hasRows || !selectedProductType || exportBusy) return;
    setExportingExcel(true);
    try {
      const rows = await fetchAllGangsForExport();
      if (rows.length === 0) return;
      downloadGangsExcel({
        rows,
        summary: summarizeGangs(rows),
        product: { code: selectedProductType.code, name: selectedProductType.name },
        dateRange: { startDate, endDate },
      });
    } catch (e) {
      logger.error('Failed to export gangs excel', e);
    } finally {
      setExportingExcel(false);
    }
  }, [endDate, exportBusy, fetchAllGangsForExport, hasRows, selectedProductType, startDate]);

  const handleExportPdf = useCallback(async () => {
    if (!hasRows || !selectedProductType || exportBusy) return;
    setExportingPdf(true);
    try {
      const rows = await fetchAllGangsForExport();
      if (rows.length === 0) return;
      await downloadGangsPdf({
        rows,
        summary: summarizeGangs(rows),
        product: { code: selectedProductType.code, name: selectedProductType.name },
        dateRange: { startDate, endDate },
      });
    } catch (e) {
      logger.error('Failed to export gangs pdf', e);
    } finally {
      setExportingPdf(false);
    }
  }, [endDate, exportBusy, fetchAllGangsForExport, hasRows, selectedProductType, startDate]);

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
              กำไร / ขาดทุนต่อกอง
            </span>
          </h1>

          <div className="flex w-full items-center gap-2.5 sm:w-auto">
            <label
              htmlFor="gang-product-type"
              className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              สินค้า
            </label>
            <select
              id="gang-product-type"
              value={selectedProductTypeId}
              onChange={(e) => setSelectedProductTypeId(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-64 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
            >
              {productTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.code} — {pt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push('/reports/profit-loss')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500"
          >
            <span aria-hidden>←</span>
            รายงานกำไร / ขาดทุน
          </button>
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={isExportDisabled({ hasRows, loading: gangsLoading, exportBusy }) || rangeInvalid}
            className="rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-red-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-md transition hover:from-rose-700 hover:via-pink-700 hover:to-red-600 disabled:cursor-not-allowed disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:shadow-none animate-gradient dark:from-rose-500 dark:via-pink-500 dark:to-red-400"
          >
            {getExportPdfButtonText(exportingPdf)}
          </button>
          <button
            type="button"
            onClick={() => void handleExportExcel()}
            disabled={isExportDisabled({ hasRows, loading: gangsLoading, exportBusy }) || rangeInvalid}
            className="rounded-xl bg-gradient-to-r from-teal-600 via-emerald-500 to-green-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-md transition hover:from-teal-700 hover:via-emerald-600 hover:to-green-600 disabled:cursor-not-allowed disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:shadow-none animate-gradient dark:from-teal-500 dark:via-emerald-400 dark:to-green-400"
          >
            {getExportExcelButtonText(exportingExcel)}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="relative z-20 grid grid-cols-1 gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
        <div className="relative z-20 min-w-0">
          <label
            htmlFor="gang-start-date"
            className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            วันที่เริ่มต้น
          </label>
          <input
            id="gang-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => openDatePicker(e.currentTarget)}
            onFocus={(e) => openDatePicker(e.currentTarget)}
            className={`${inputClass} cursor-pointer`}
          />
        </div>
        <div className="relative z-20 min-w-0">
          <label
            htmlFor="gang-end-date"
            className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            วันที่สิ้นสุด
          </label>
          <input
            id="gang-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => openDatePicker(e.currentTarget)}
            onFocus={(e) => openDatePicker(e.currentTarget)}
            className={`${inputClass} cursor-pointer`}
          />
        </div>
        <div className="relative">
          <span className="mb-1.5 block text-xs font-medium text-transparent select-none" aria-hidden>
            อัปเดต
          </span>
          <button
            type="button"
            onClick={() => {
              if (rangeInvalid || gangsLoading) return;
              void loadGangs();
            }}
            disabled={rangeInvalid || gangsLoading}
            aria-disabled={rangeInvalid || gangsLoading}
            className="w-full rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:animate-none animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 dark:disabled:from-gray-400 dark:disabled:via-gray-400 dark:disabled:to-gray-400"
          >
            {gangsLoading && !rangeInvalid ? 'กำลังโหลด...' : 'อัปเดตรายงาน'}
          </button>
          {rangeInvalid ? (
            <p className="pointer-events-none absolute left-0 top-full mt-1.5 text-xs text-rose-600">
              วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Summary (current page) */}
      {!error && !gangsError && gangs.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'ขายได้ (หน้านี้)', value: `${formatNumber(summary.soldKg)} กก.` },
            { label: 'รายได้ (หน้านี้)', value: formatCurrency(summary.revenue) },
            { label: 'ต้นทุน (หน้านี้)', value: formatCurrency(summary.cogs) },
            { label: 'สุทธิ (หน้านี้)', value: null as string | null, pnl: summary.profitLoss },
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
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">รายการกอง</h2>
              {selectedProductType ? (
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {selectedProductType.code} · {selectedProductType.name}
                </p>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {startDate} → {endDate}
            </p>
          </div>
          {gangsLoading ? (
            <span className="animate-pulse text-xs text-gray-400">กำลังโหลด...</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {pagination.total} กอง
            </span>
          )}
        </div>

        {gangsLoading && gangs.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">กำลังโหลด...</div>
        ) : gangsError ? (
          <div className="px-5 py-16 text-center text-sm text-rose-600 dark:text-rose-300">{gangsError}</div>
        ) : gangs.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">ยังไม่มีข้อมูลกองในช่วงที่เลือก</div>
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

      <ListPagination
        pagination={pagination}
        loading={gangsLoading}
        onPageChange={setPage}
      />
    </div>
  );
}
