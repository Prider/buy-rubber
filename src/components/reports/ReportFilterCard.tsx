import { ReportType } from '@/hooks/useReportData';

interface ProductType {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface ReportFilterCardProps {
  reportType: ReportType;
  setReportType: (type: ReportType) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  loading: boolean;
  onGenerate: () => void;
  productTypes?: ProductType[];
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
  productTypes = [],
}: ReportFilterCardProps) {
  const isDateRangeInvalid =
    startDate && endDate ? new Date(startDate) > new Date(endDate) : false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">ตัวกรองรายงาน</h2>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              ประเภทรายงาน
            </label>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="input w-full pl-3 pr-3 py-1.5 appearance-none bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
              >
                <option value="daily_purchase">📊 รายงานรับซื้อประจำวัน (ทั้งหมด)</option>
                {productTypes.map((pt) => (
                  <option key={pt.id} value={`daily_purchase:${pt.id}`}>
                    📊 รายงานรับซื้อประจำวัน - {pt.name}
                  </option>
                ))}
                <option value="member_summary">👥 สรุปรายสมาชิกที่รับซื้อยาง</option>
                <option value="expense_summary">💸 รายงานค่าใช้จ่ายที่เกิดขึ้น</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              วันที่เริ่มต้น
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`input w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm ${
                  isDateRangeInvalid
                    ? 'border-red-400 focus:border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-600 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              วันที่สิ้นสุด
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`input w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm ${
                  isDateRangeInvalid
                    ? 'border-red-400 focus:border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-600 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 opacity-0 pointer-events-none">
              &nbsp;
            </label>
            <button
              onClick={onGenerate}
              disabled={loading || isDateRangeInvalid}
              className="group w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>กำลังสร้าง...</span>
                </>
              ) : (
                <>
                  <svg 
                    className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:rotate-3" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                  <span>สร้างรายงาน</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

