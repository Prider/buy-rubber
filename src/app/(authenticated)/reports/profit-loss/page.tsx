'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { downloadProfitLossExcel } from './exportExcel';
import { downloadProfitLossPdf } from './exportPdf';
import { ProfitLossChart } from './ProfitLossChart';
import {
  EMPTY_TOTALS,
  type ProfitLossReportResponse,
  type ProfitLossRow,
  type ProfitLossTotals,
  type ViewMode,
} from './types';
import {
  getExportExcelButtonText,
  getExportPdfButtonText,
  getNetResultLabel,
  isExportDisabled,
} from './ui';
import { isDateRangeInvalid, periodLabel, toInputDate } from './utils';

const PNL_EPS = 1e-6;

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40';

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

export default function ProfitLossReportPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [rows, setRows] = useState<ProfitLossRow[]>([]);
  const [totals, setTotals] = useState<ProfitLossTotals>(EMPTY_TOTALS);
  const [error, setError] = useState('');

  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => toInputDate(now));

  const chartData = useMemo(
    () => rows.map((row) => ({ ...row, periodLabel: periodLabel(row.period, viewMode) })),
    [rows, viewMode],
  );

  const hasRows = rows.length > 0;
  const rangeInvalid = isDateRangeInvalid(startDate, endDate);
  const exportBusy = exportingPdf || exportingExcel;

  const fetchData = useCallback(async () => {
    if (rangeInvalid) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get<ProfitLossReportResponse>('/api/reports/profit-loss', {
        params: { startDate, endDate, view: viewMode },
      });
      setRows(response.data.periods || []);
      setTotals(response.data.totals || EMPTY_TOTALS);
    } catch (err) {
      logger.error('Failed to load profit-loss report', err);
      setError('ไม่สามารถโหลดรายงานกำไร/ขาดทุนได้');
      setRows([]);
      setTotals(EMPTY_TOTALS);
    } finally {
      setLoading(false);
    }
  }, [endDate, rangeInvalid, startDate, viewMode]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.push('/login');
  }, [isLoading, router, user]);

  useEffect(() => {
    if (isLoading || !user || rangeInvalid) return;
    void fetchData();
  }, [endDate, fetchData, isLoading, rangeInvalid, startDate, user, viewMode]);

  const handleExportExcel = useCallback(async () => {
    if (!hasRows || exportBusy) return;
    setExportingExcel(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      downloadProfitLossExcel({ rows, totals, viewMode, startDate, endDate });
    } finally {
      setExportingExcel(false);
    }
  }, [endDate, exportBusy, hasRows, rows, startDate, totals, viewMode]);

  const handleExportPdf = useCallback(async () => {
    if (!hasRows || exportBusy) return;
    setExportingPdf(true);
    try {
      await downloadProfitLossPdf({ rows, totals, startDate, endDate, viewMode });
    } finally {
      setExportingPdf(false);
    }
  }, [endDate, exportBusy, hasRows, rows, startDate, totals, viewMode]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
              กำไร / ขาดทุน
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ตามช่วงเวลา · ขาย − รับซื้อ − ค่าใช้จ่าย
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/reports/profit-loss/gangs"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
          >
            ดูต่อกองตามสินค้า
            <span aria-hidden className="text-base leading-none">→</span>
          </Link>
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={isExportDisabled({ hasRows, loading, exportBusy })}
            className="rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {getExportPdfButtonText(exportingPdf)}
          </button>
          <button
            type="button"
            onClick={() => void handleExportExcel()}
            disabled={isExportDisabled({ hasRows, loading, exportBusy })}
            className="rounded-xl bg-teal-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {getExportExcelButtonText(exportingExcel)}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            วันที่เริ่มต้น
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            วันที่สิ้นสุด
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            มุมมอง
          </label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className={inputClass}
          >
            <option value="monthly">รายเดือน</option>
            <option value="weekly">รายสัปดาห์</option>
            <option value="daily">รายวัน</option>
          </select>
        </div>
        <div>
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading || rangeInvalid}
            className="w-full rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? 'กำลังโหลด...' : 'อัปเดตรายงาน'}
          </button>
          {rangeInvalid ? (
            <p className="mt-1.5 text-xs text-rose-600">วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด</p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Summary */}
      {!error ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'ยอดขาย', value: formatCurrency(totals.sales) },
            { label: 'ยอดรับซื้อ', value: formatCurrency(totals.purchases) },
            { label: 'ค่าใช้จ่าย', value: formatCurrency(totals.expenses) },
            { label: getNetResultLabel(totals.net), value: null as string | null, pnl: totals.net },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-100 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/80"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              {item.pnl != null ? (
                <p className="mt-1 text-lg">
                  <ProfitLossText value={item.pnl} />
                  <span className="sr-only">
                    {getNetResultLabel(totals.net)}: {formatCurrency(totals.net)}
                  </span>
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

      <ProfitLossChart data={chartData} />

      {/* Period list */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">รายการตามช่วงเวลา</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {startDate} → {endDate}
            </p>
          </div>
          {loading ? (
            <span className="animate-pulse text-xs text-gray-400">กำลังโหลด...</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {rows.length} ช่วง
            </span>
          )}
        </div>

        {loading && rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">กำลังโหลด...</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">ยังไม่มีข้อมูลในช่วงที่เลือก</div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/80">
              {rows.map((row) => (
                <li
                  key={row.period}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {periodLabel(row.period, viewMode)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                      ขาย {formatCurrency(row.sales)} · รับซื้อ {formatCurrency(row.purchases)} · ค่าใช้จ่าย{' '}
                      {formatCurrency(row.expenses)}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-6 sm:items-center sm:justify-end">
                    <div className="hidden text-right sm:block">
                      <p className="text-[11px] text-gray-400">ขาย</p>
                      <p className="text-sm tabular-nums text-gray-700 dark:text-gray-200">
                        {formatCurrency(row.sales)}
                      </p>
                    </div>
                    <div className="hidden text-right md:block">
                      <p className="text-[11px] text-gray-400">รับซื้อ</p>
                      <p className="text-sm tabular-nums text-gray-700 dark:text-gray-200">
                        {formatCurrency(row.purchases)}
                      </p>
                    </div>
                    <div className="hidden text-right lg:block">
                      <p className="text-[11px] text-gray-400">ค่าใช้จ่าย</p>
                      <p className="text-sm tabular-nums text-gray-700 dark:text-gray-200">
                        {formatCurrency(row.expenses)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400">สุทธิ</p>
                      <ProfitLossText value={row.net} className="text-base" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/30 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">รวมทั้งหมด</p>
              <div className="flex items-end justify-between gap-6 sm:items-center sm:justify-end">
                <div className="hidden text-right sm:block">
                  <p className="text-[11px] text-gray-400">ขาย</p>
                  <p className="text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                    {formatCurrency(totals.sales)}
                  </p>
                </div>
                <div className="hidden text-right md:block">
                  <p className="text-[11px] text-gray-400">รับซื้อ</p>
                  <p className="text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                    {formatCurrency(totals.purchases)}
                  </p>
                </div>
                <div className="hidden text-right lg:block">
                  <p className="text-[11px] text-gray-400">ค่าใช้จ่าย</p>
                  <p className="text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                    {formatCurrency(totals.expenses)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-400">สุทธิ</p>
                  <ProfitLossText value={totals.net} className="text-base" />
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
