'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';

type ViewMode = 'daily' | 'monthly';

interface ProfitLossRow {
  period: string;
  sales: number;
  purchases: number;
  expenses: number;
  purchasePricePerKg: number;
  salePricePerKg: number;
  net: number;
}

interface ReportResponse {
  periods: ProfitLossRow[];
  totals: {
    sales: number;
    purchases: number;
    expenses: number;
    net: number;
  };
}

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function periodLabel(period: string, mode: ViewMode): string {
  if (mode === 'monthly') {
    const [year, month] = period.split('-').map(Number);
    return new Date(year, (month || 1) - 1, 1).toLocaleDateString('th-TH', {
      month: 'short',
      year: 'numeric',
    });
  }
  return new Date(period).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
}

function escapeCsvValue(raw: string): string {
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export default function ProfitLossReportPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProfitLossRow[]>([]);
  const [totals, setTotals] = useState({ sales: 0, purchases: 0, expenses: 0, net: 0 });
  const [error, setError] = useState('');

  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState<string>(toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState<string>(toInputDate(now));

  const chartData = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        periodLabel: periodLabel(row.period, viewMode),
      })),
    [rows, viewMode]
  );

  const hasRows = rows.length > 0;
  const isProfit = totals.net >= 0;
  const rangeInvalid = new Date(startDate) > new Date(endDate);

  const fetchData = useCallback(async () => {
    if (rangeInvalid) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get<ReportResponse>('/api/reports/profit-loss', {
        params: { startDate, endDate, view: viewMode },
      });
      setRows(response.data.periods || []);
      setTotals(response.data.totals || { sales: 0, purchases: 0, expenses: 0, net: 0 });
    } catch (err) {
      logger.error('Failed to load profit-loss report', err);
      setError('ไม่สามารถโหลดรายงานกำไร/ขาดทุนได้');
      setRows([]);
      setTotals({ sales: 0, purchases: 0, expenses: 0, net: 0 });
    } finally {
      setLoading(false);
    }
  }, [endDate, rangeInvalid, startDate, viewMode]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    if (isLoading || !user || rangeInvalid) return;
    void fetchData();
  }, [endDate, fetchData, isLoading, rangeInvalid, startDate, user, viewMode]);

  const handleExportCsv = useCallback(() => {
    const header = ['Period', 'Sales', 'Purchases', 'Expenses', 'Net'];
    const lines = [header.join(',')];

    for (const row of rows) {
      lines.push(
        [
          escapeCsvValue(periodLabel(row.period, viewMode)),
          row.sales.toFixed(2),
          row.purchases.toFixed(2),
          row.expenses.toFixed(2),
          row.net.toFixed(2),
        ].join(',')
      );
    }

    lines.push(
      [
        'Total',
        totals.sales.toFixed(2),
        totals.purchases.toFixed(2),
        totals.expenses.toFixed(2),
        totals.net.toFixed(2),
      ].join(',')
    );

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profit-loss-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [endDate, rows, startDate, totals, viewMode]);

  const handleExportExcel = useCallback(() => {
    const tableRows = rows
      .map(
        (row) => `
          <tr>
            <td>${periodLabel(row.period, viewMode)}</td>
            <td>${row.sales.toFixed(2)}</td>
            <td>${row.purchases.toFixed(2)}</td>
            <td>${row.expenses.toFixed(2)}</td>
            <td>${row.net.toFixed(2)}</td>
          </tr>
        `
      )
      .join('');

    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <table border="1">
            <thead>
              <tr>
                <th>Period</th>
                <th>Sales</th>
                <th>Purchases</th>
                <th>Expenses</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr>
                <td><b>Total</b></td>
                <td><b>${totals.sales.toFixed(2)}</b></td>
                <td><b>${totals.purchases.toFixed(2)}</b></td>
                <td><b>${totals.expenses.toFixed(2)}</b></td>
                <td><b>${totals.net.toFixed(2)}</b></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profit-loss-${startDate}-to-${endDate}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }, [endDate, rows, startDate, totals, viewMode]);

  const handleExportPdf = useCallback(async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let position = 0;
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(`profit-loss-${startDate}-to-${endDate}.pdf`);
  }, [endDate, startDate]);

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
            onClick={handleExportPdf}
            disabled={!hasRows || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white"
          >
            Export PDF
          </button>
          <button
            onClick={handleExportCsv}
            disabled={!hasRows || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!hasRows || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white"
          >
            Export Excel
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

      <div ref={reportRef} className="space-y-6">
        <div
          className={`rounded-2xl p-5 border ${
            isProfit
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">ผลลัพธ์สุทธิ (ยอดขาย - ยอดรับซื้อ - ค่าใช้จ่าย)</p>
          <p className={`text-3xl font-bold mt-1 ${isProfit ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {isProfit ? 'Profit:' : 'Loss:'} {formatCurrency(totals.net)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodLabel" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="purchasePricePerKg"
                  name="Purchase price/kg"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="salePricePerKg"
                  name="Sale price/kg"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2">Blue = Expenses, Red = Purchase price/kg, Green = Sale price/kg</p>
        </div>

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
                      <td className={`px-4 py-3 font-semibold ${profit ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
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
                  <td className={`px-4 py-3 ${totals.net >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
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
