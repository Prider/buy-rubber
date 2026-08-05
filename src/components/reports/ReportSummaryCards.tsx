import { formatCurrency, formatNumber } from '@/lib/utils';
import { ReportType } from '@/hooks/useReportData';

interface ReportSummaryCardsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  reportType: ReportType;
  totalAmount: number;
  totalWeight: number;
  expenseSummary?: Array<{ category: string; totalAmount: number; count: number }>;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/80">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function ReportSummaryCards({
  data,
  reportType,
  totalAmount,
  totalWeight,
  expenseSummary = [],
}: ReportSummaryCardsProps) {
  const averageExpense =
    reportType === 'expense_summary' && data.length > 0 ? totalAmount / data.length : 0;
  const topExpenseCategory =
    reportType === 'expense_summary' && expenseSummary.length > 0 ? expenseSummary[0] : null;

  if (reportType === 'expense_summary') {
    return (
      <div className="no-print grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="จำนวนรายการ"
          value={data.length.toLocaleString('th-TH')}
          hint="รายการค่าใช้จ่าย"
        />
        <StatCard
          label="เฉลี่ยต่อรายการ"
          value={formatCurrency(averageExpense || 0)}
          hint={`จาก ${data.length.toLocaleString('th-TH')} รายการ`}
        />
        <StatCard
          label="หมวดสูงสุด"
          value={topExpenseCategory ? topExpenseCategory.category : '-'}
          hint={
            topExpenseCategory
              ? `${formatCurrency(topExpenseCategory.totalAmount)} · ${topExpenseCategory.count.toLocaleString('th-TH')} รายการ`
              : 'ไม่มีข้อมูล'
          }
        />
      </div>
    );
  }

  const isDaily =
    reportType === 'daily_purchase' || String(reportType).startsWith('daily_purchase:');

  return (
    <div className="no-print grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard
        label="จำนวนรายการ"
        value={String(data.length)}
        hint={isDaily ? 'รายการรับซื้อ' : 'สมาชิก'}
      />
      <StatCard label="น้ำหนักรวม" value={formatNumber(totalWeight)} hint="กิโลกรัม" />
      <StatCard label="ยอดเงินรวม" value={formatCurrency(totalAmount)} hint="บาท" />
    </div>
  );
}
