import { ReportType } from '@/hooks/useReportData';
import { ReportGroupOption } from '@/lib/reportProductTypeGroups';

interface ReportFilterCardProps {
  reportType: ReportType;
  setReportType: (type: ReportType) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  loading: boolean;
  onGenerate: () => void;
  reportGroups?: ReportGroupOption[];
  onManageGroups?: () => void;
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40';

function openDatePicker(input: HTMLInputElement) {
  try {
    input.showPicker?.();
  } catch {
    // showPicker can throw if the input is not user-activated in some browsers
  }
}

export default function ReportFilterCard({
  reportType,
  setReportType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  loading,
  onGenerate,
  reportGroups = [],
  onManageGroups,
}: ReportFilterCardProps) {
  const isDateRangeInvalid = startDate && endDate ? new Date(startDate) > new Date(endDate) : false;

  return (
    <div className="relative z-20 space-y-3 overflow-visible">
      <div className="grid grid-cols-1 gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              ประเภทรายงาน
            </label>
            {onManageGroups ? (
              <button
                type="button"
                onClick={onManageGroups}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-violet-700 underline-offset-2 transition hover:underline dark:text-violet-300"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                จัดการกลุ่มรายงาน
              </button>
            ) : null}
          </div>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className={inputClass}
          >
            <option value="daily_purchase">รายงานรับซื้อประจำวัน (ทั้งหมด)</option>
            {reportGroups.map((group) => (
              <option key={group.id} value={group.reportType}>
                รายงานรับซื้อประจำวัน - {group.label}
              </option>
            ))}
            <option value="member_summary">สรุปรายสมาชิกที่รับซื้อยาง</option>
            <option value="expense_summary">รายงานค่าใช้จ่ายที่เกิดขึ้น</option>
          </select>
        </div>

        <div className="relative z-20 min-w-0">
          <label
            htmlFor="report-start-date"
            className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            วันที่เริ่มต้น
          </label>
          <input
            id="report-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => openDatePicker(e.currentTarget)}
            onFocus={(e) => openDatePicker(e.currentTarget)}
            className={`${inputClass} relative z-20 cursor-pointer ${
              isDateRangeInvalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : ''
            }`}
          />
        </div>

        <div className="relative z-20 min-w-0">
          <label
            htmlFor="report-end-date"
            className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            วันที่สิ้นสุด
          </label>
          <input
            id="report-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => openDatePicker(e.currentTarget)}
            onFocus={(e) => openDatePicker(e.currentTarget)}
            className={`${inputClass} relative z-20 cursor-pointer ${
              isDateRangeInvalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : ''
            }`}
          />
        </div>

        <div className="relative">
          <span className="mb-1.5 block text-xs font-medium text-transparent select-none" aria-hidden>
            สร้าง
          </span>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading || isDateRangeInvalid}
            className="w-full rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
          </button>
          {isDateRangeInvalid ? (
            <p className="pointer-events-none absolute left-0 top-full mt-1.5 text-xs text-rose-600">
              วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
