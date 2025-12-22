import { formatCurrency, formatNumber } from '@/lib/utils';
import { ReportType } from '@/hooks/useReportData';

interface ReportSummaryCardsProps {
  data: any[];
  reportType: ReportType;
  totalAmount: number;
  totalWeight: number;
  expenseSummary?: Array<{ category: string; totalAmount: number; count: number }>;
}

export default function ReportSummaryCards({
  data,
  reportType,
  totalAmount,
  totalWeight,
  expenseSummary = [],
}: ReportSummaryCardsProps) {
  const averageExpense = reportType === 'expense_summary' && data.length > 0 ? totalAmount / data.length : 0;
  const topExpenseCategory = reportType === 'expense_summary' && expenseSummary.length > 0 ? expenseSummary[0] : null;

  if (reportType === 'expense_summary') {
    return (
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-900/40 dark:to-blue-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200/60 dark:border-slate-700/40">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-white/80 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm shadow-sm">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              จำนวนรายการ
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">
              {data.length.toLocaleString('th-TH')}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">รายการค่าใช้จ่าย</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-rose-50 to-orange-100 dark:from-rose-900/30 dark:to-orange-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-rose-200/60 dark:border-rose-700/40">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-white/80 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm shadow-sm">
                <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              ยอดใช้จ่ายเฉลี่ยต่อรายการ
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">
              {formatCurrency(averageExpense || 0)}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
              จาก {data.length.toLocaleString('th-TH')} รายการ
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-200/30 dark:bg-rose-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-emerald-200/60 dark:border-emerald-700/40">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-white/80 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm shadow-sm">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11m-6-6h6m6 6h-6m0 0v10M9 4v6m6 0V4" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              หมวดใช้จ่ายสูงสุด
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">
              {topExpenseCategory ? topExpenseCategory.category : '-'}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              {topExpenseCategory ? `${formatCurrency(topExpenseCategory.totalAmount)} • ${topExpenseCategory.count.toLocaleString('th-TH')} รายการ` : 'ไม่มีข้อมูล'}
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Records Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/10 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/30">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-white/80 dark:bg-gray-900/40 rounded-lg backdrop-blur-sm shadow-sm">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            จำนวนรายการ
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">
            {data.length}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            {reportType === 'daily_purchase' ? 'รายการรับซื้อ' : 'สมาชิก'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      </div>

      {/* Total Weight Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/10 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-purple-200/50 dark:border-purple-800/30">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-white/80 dark:bg-gray-900/40 rounded-lg backdrop-blur-sm shadow-sm">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            น้ำหนักรวม
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">
            {formatNumber(totalWeight)}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
            กิโลกรัม
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-200/30 dark:bg-purple-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      </div>

      {/* Total Amount Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-green-200/50 dark:border-green-800/30">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-white/80 dark:bg-gray-900/40 rounded-lg backdrop-blur-sm shadow-sm">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
            ยอดเงินรวม
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
            บาท
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-200/30 dark:bg-green-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      </div>
    </div>
  );
}

