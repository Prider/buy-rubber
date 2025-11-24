'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatCurrency, formatDate } from '@/lib/utils';
import GamerLoader from '@/components/GamerLoader';

interface MemberServiceFeeModalProps {
  isOpen: boolean;
  member: any;
  onClose: () => void;
}

interface ServiceFee {
  id: string;
  serviceFeeNo: string;
  purchaseNo: string | null;
  date: string;
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
        limit: '10',
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
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-5xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    ประวัติค่าบริการ
                  </h3>
                  <p className="text-purple-100 text-sm">
                    {member?.name} ({member?.code})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-purple-100 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    จำนวนรายการ
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalRecords} รายการ
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    ยอดรวม
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(summary.totalAmount)}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    ประเภท
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Object.keys(summary.categorySummary || {}).length} ประเภท
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter.label}
                    onClick={() => handleQuickFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedQuickFilter === filter.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Date Range */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSelectedQuickFilter(null);
                      setCurrentPage(1);
                    }}
                    className="input w-full"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSelectedQuickFilter(null);
                      setCurrentPage(1);
                    }}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <GamerLoader className="py-12" message="กำลังโหลดข้อมูล..." />
            ) : serviceFees.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-2">
                  <svg
                    className="w-16 h-16 mx-auto"
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
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>วันที่</th>
                      <th>เลขที่เอกสาร</th>
                      <th>เลขที่รับซื้อ</th>
                      <th>ประเภท</th>
                      <th className="text-right">จำนวนเงิน</th>
                      <th>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceFees.map((fee) => (
                      <tr key={fee.id}>
                        <td>{formatDate(new Date(fee.date))}</td>
                        <td className="font-medium">{fee.serviceFeeNo}</td>
                        <td className="font-medium text-blue-600 dark:text-blue-400">
                          {fee.purchaseNo || '-'}
                        </td>
                        <td>{fee.category}</td>
                        <td className="text-right font-semibold text-purple-600 dark:text-purple-400">
                          {formatCurrency(fee.amount)}
                        </td>
                        <td className="text-gray-600 dark:text-gray-400">
                          {fee.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← ก่อนหน้า
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  หน้า {currentPage} จาก {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

