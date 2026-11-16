import ExpensePieChart from '@/components/dashboard/ExpensePieChart';
import type { ActivityRow } from '@/components/dashboard/ActivityList';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ReportType } from '@/hooks/useReportData';

interface ReportSummaryCardsProps {
  reportType: ReportType;
  totalAmount: number;
  totalWeight: number;
  totalCount: number;
  expenseSummary?: Array<{ category: string; totalAmount: number; count: number }>;
}

function StatCard({
  label,
  value,
  hint,
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? 'min-w-[9.5rem] flex-1 rounded-xl border border-gray-100 bg-white/80 px-2.5 py-1.5 dark:border-gray-700 dark:bg-gray-800/80 lg:bg-gray-50 lg:dark:bg-gray-900/40'
          : 'rounded-2xl border border-gray-100 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/80 lg:bg-gray-50 lg:dark:bg-gray-900/40'
      }
    >
      <p className={compact ? 'text-[11px] leading-4 text-gray-500 dark:text-gray-400' : 'text-xs text-gray-500 dark:text-gray-400'}>
        {label}
      </p>
      <p
        className={
          compact
            ? 'mt-0.5 text-sm font-semibold leading-5 tabular-nums text-gray-900 dark:text-gray-100'
            : 'mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100'
        }
      >
        {value}
        {compact && hint ? (
          <span className="ml-1 text-[11px] font-normal text-gray-400 dark:text-gray-500">{hint}</span>
        ) : null}
      </p>
      {!compact && hint ? <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function ReportSummaryCards({
  reportType,
  totalAmount,
  totalWeight,
  totalCount,
  expenseSummary = [],
}: ReportSummaryCardsProps) {
  const isExpenseSummary = reportType === 'expense_summary';

  if (isExpenseSummary) {
    const pieRows: ActivityRow[] = expenseSummary.map((item) => ({
      id: item.category,
      title: item.category,
      detail: '',
      amount: item.totalAmount,
      when: '',
    }));

    return (
      <div className="no-print h-72 min-h-0">
        <ExpensePieChart
          title="ค่าใช้จ่ายตามหมวด"
          rows={pieRows}
          emptyLabel="ยังไม่มีค่าใช้จ่าย"
          detail={`จำนวนรายการ ${totalCount.toLocaleString('th-TH')}`}
        />
      </div>
    );
  }

  const isDaily =
    reportType === 'daily_purchase' || String(reportType).startsWith('daily_purchase:');
  const isSell =
    reportType === 'sell_summary' || String(reportType).startsWith('sell_summary:');
  const countHint = isDaily
    ? 'รายการรับซื้อ'
    : isSell
      ? 'รายการขาย'
      : 'สมาชิก';
  const showAveragePrice = isDaily || isSell;
  const averagePrice = showAveragePrice && totalWeight > 0 ? totalAmount / totalWeight : 0;

  return (
    <div className="no-print flex flex-wrap gap-2">
      <StatCard
        compact
        label="จำนวนรายการ"
        value={totalCount.toLocaleString('th-TH')}
        hint={countHint}
      />
      <StatCard compact label="น้ำหนักรวม" value={formatNumber(totalWeight)} hint="กิโลกรัม" />
      <StatCard compact label="ยอดเงินรวม" value={formatCurrency(totalAmount)} hint="บาท" />
      {showAveragePrice ? (
        <StatCard compact label="ราคาเฉลี่ย" value={formatNumber(averagePrice)} hint="บาท/กก." />
      ) : null}
    </div>
  );
}
