'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
    [rows, viewMode]
  );

  const hasRows = rows.length > 0;
  const isProfit = totals.net >= 0;
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
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
              รายงานกำไร / ขาดทุน
            </span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Profit &amp; Loss Report</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void handleExportPdf()}
            disabled={isExportDisabled({ hasRows, loading, exportBusy })}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white"
          >
            {getExportPdfButtonText(exportingPdf)}
          </button>
          <button
            onClick={() => void handleExportExcel()}
            disabled={isExportDisabled({ hasRows, loading, exportBusy })}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white"
          >
            {getExportExcelButtonText(exportingExcel)}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">มุมมอง</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="input w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            >
              <option value="monthly">รายเดือน</option>
              <option value="daily">รายวัน</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              onClick={() => void fetchData()}
              disabled={loading || rangeInvalid}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white"
            >
              {loading ? 'กำลังโหลด...' : 'อัปเดตรายงาน'}
            </button>
            {rangeInvalid && <p className="mt-1 text-xs text-red-600">วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด</p>}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div
          className={`rounded-2xl p-5 border ${
            isProfit
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">ผลลัพธ์สุทธิ (ยอดขาย - ยอดรับซื้อ - ค่าใช้จ่าย)</p>
          <p className={`text-3xl font-bold mt-1 ${isProfit ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {getNetResultLabel(totals.net)}: {formatCurrency(totals.net)}
          </p>
        </div>

        <ProfitLossChart data={chartData} />

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr className="text-left text-gray-700 dark:text-gray-200">
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Sales</th>
                  <th className="px-4 py-3">Purchases</th>
                  <th className="px-4 py-3">Expenses</th>
                  <th className="px-4 py-3">Net (Profit / Loss)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const profit = row.net >= 0;
                  return (
                    <tr
                      key={row.period}
                      className={profit ? 'bg-green-50/70 dark:bg-green-900/10' : 'bg-red-50/70 dark:bg-red-900/10'}
                    >
                      <td className="px-4 py-3">{periodLabel(row.period, viewMode)}</td>
                      <td className="px-4 py-3">{formatCurrency(row.sales)}</td>
                      <td className="px-4 py-3">{formatCurrency(row.purchases)}</td>
                      <td className="px-4 py-3">{formatCurrency(row.expenses)}</td>
                      <td
                        className={`px-4 py-3 font-semibold ${
                          profit ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                        }`}
                      >
                        {formatCurrency(row.net)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3">{formatCurrency(totals.sales)}</td>
                  <td className="px-4 py-3">{formatCurrency(totals.purchases)}</td>
                  <td className="px-4 py-3">{formatCurrency(totals.expenses)}</td>
                  <td
                    className={`px-4 py-3 ${
                      totals.net >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    {formatCurrency(totals.net)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
