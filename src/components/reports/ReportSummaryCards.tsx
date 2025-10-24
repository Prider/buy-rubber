import { formatCurrency, formatNumber } from '@/lib/utils';
import { ReportType } from '@/hooks/useReportData';

interface ReportSummaryCardsProps {
  data: any[];
  reportType: ReportType;
  totalAmount: number;
  totalWeight: number;
}

export default function ReportSummaryCards({
  data,
  reportType,
  totalAmount,
  totalWeight,
}: ReportSummaryCardsProps) {
  return (
    <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Records Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-blue-200/50 dark:border-blue-800/30">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl backdrop-blur-sm shadow-sm">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            จำนวนรายการ
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
            {data.length}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            {reportType === 'daily_purchase' ? 'รายการรับซื้อ' : 'สมาชิก'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      </div>

      {/* Total Weight Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-purple-200/50 dark:border-purple-800/30">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl backdrop-blur-sm shadow-sm">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            น้ำหนักรวม
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
            {formatNumber(totalWeight)}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
            กิโลกรัม
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-200/30 dark:bg-purple-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      </div>

      {/* Total Amount Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-green-200/50 dark:border-green-800/30">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl backdrop-blur-sm shadow-sm">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
            ยอดเงินรวม
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            บาท
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-green-200/30 dark:bg-green-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      </div>
    </div>
  );
}

