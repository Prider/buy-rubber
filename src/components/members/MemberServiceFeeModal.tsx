'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatCurrency } from '@/lib/utils';
import GamerLoader from '@/components/GamerLoader';
import { PaginationControls } from '@/components/members/history/PaginationControls';

interface MemberServiceFeeModalProps {
  isOpen: boolean;
  member: any;
  onClose: () => void;
}

function ServiceFeeDateCell({ value }: { value: string }) {
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return <>–</>;

  const localHours = dateObj.getHours();
  const localMinutes = dateObj.getMinutes();
  const isDateOnly =
    (localHours === 7 && localMinutes === 0) ||
    (value.includes('T00:00:00') && localHours === 7);

  const day = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(dateObj);

  if (isDateOnly) {
    return <div className="leading-tight">{day}</div>;
  }

  const time = new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);

  return (
    <>
      <div className="leading-tight">{day}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
    </>
  );
}

interface ServiceFee {
  id: string;
  serviceFeeNo: string;
  purchaseNo: string | null;
  date: string;
  createdAt?: string; // Actual creation timestamp
  category: string;
  amount: number;
  notes: string | null;
}

interface ServiceFeeSummary {
  totalRecords: number;
  totalAmount: number;
  categorySummary: Record<string, { count: number; amount: number }>;
}

const QUICK_FILTERS = [
  { label: 'วันนี้', value: 0 },
  { label: 'สัปดาห์นี้', value: 7 },
  { label: 'เดือนนี้', value: 30 },
  { label: 'ทั้งหมด', value: null },
];

export const MemberServiceFeeModal: React.FC<MemberServiceFeeModalProps> = ({
  isOpen,
  member,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [serviceFees, setServiceFees] = useState<ServiceFee[]>([]);
  const [summary, setSummary] = useState<ServiceFeeSummary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedQuickFilter(null);
      setStartDate('');
      setEndDate('');
      setCurrentPage(1);
      setServiceFees([]);
      setSummary(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && member?.id) {
      fetchServiceFees();
    }
  }, [isOpen, member?.id, currentPage, startDate, endDate]);

  const fetchServiceFees = async () => {
    if (!member?.id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '8',
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const { data } = await axios.get(
        `/api/members/${member.id}/servicefees?${params}`
      );
      setServiceFees(data.serviceFees || []);
      setSummary(data.summary);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch service fees:', error);
      setServiceFees([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = (days: number | null) => {
    if (days === null) {
      setStartDate('');
      setEndDate('');
      setSelectedQuickFilter(null);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setSelectedQuickFilter(days);
    }
    setCurrentPage(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500/75 transition-opacity dark:bg-gray-900/75" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white text-left shadow-xl dark:bg-gray-800">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight text-white">ประวัติค่าบริการ</h3>
                  <p className="text-xs text-purple-100">
                    {member?.name} ({member?.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/10"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-4">
          {summary && (
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">จำนวนรายการ</div>
                <div className="mt-0.5 text-lg font-bold leading-tight text-gray-900 dark:text-white">
                  {summary.totalRecords} รายการ
                </div>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 dark:border-purple-800 dark:bg-purple-950/50">
                <div className="text-xs font-medium text-purple-800 dark:text-purple-200">ยอดรวม</div>
                <div className="mt-0.5 text-lg font-bold leading-tight tabular-nums text-purple-950 dark:text-purple-100">
                  {formatCurrency(summary.totalAmount)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">ประเภท</div>
                <div className="mt-0.5 text-lg font-bold leading-tight text-gray-900 dark:text-white">
                  {Object.keys(summary.categorySummary || {}).length} ประเภท
                </div>
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 lg:flex-row lg:items-center">
            <span className="shrink-0 text-xs font-medium text-gray-700 dark:text-gray-300">ตัวกรองด่วน</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => handleQuickFilter(filter.value)}
                  className={`inline-flex min-h-8 items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedQuickFilter === filter.value
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="shrink-0">วันที่เริ่ม</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedQuickFilter(null);
                    setCurrentPage(1);
                  }}
                  className="h-8 w-[9.25rem] rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="shrink-0">วันที่สิ้นสุด</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedQuickFilter(null);
                    setCurrentPage(1);
                  }}
                  className="h-8 w-[9.25rem] rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                />
              </label>
            </div>
          </div>
            {loading ? (
              <GamerLoader className="py-8" message="กำลังโหลดข้อมูล..." />
            ) : serviceFees.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-2 text-gray-400 dark:text-gray-500">
                  <svg
                    className="mx-auto h-10 w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  ไม่พบประวัติค่าบริการ
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">รายการค่าบริการ</h3>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    ทั้งหมด {summary?.totalRecords ?? serviceFees.length} รายการ
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">วันที่</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">เลขที่รับซื้อ</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">ประเภท</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-200">จำนวนเงิน</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {serviceFees.map((fee, index) => (
                        <tr
                          key={fee.id}
                          className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/60 dark:bg-gray-750'
                          }`}
                        >
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                            <ServiceFeeDateCell value={fee.createdAt || fee.date} />
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                            {fee.purchaseNo || '-'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {fee.category}
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-purple-600 dark:text-purple-400">
                            {formatCurrency(fee.amount)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {fee.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <PaginationControls
                    embedded
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

