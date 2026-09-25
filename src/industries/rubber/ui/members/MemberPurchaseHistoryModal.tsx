'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMemberPurchaseHistory } from '@/industries/rubber/hooks/useMemberPurchaseHistory';
import { PurchaseSummary, QuickFilter } from '@/industries/rubber/types/memberHistory';
import { HeaderIcon } from '@/industries/rubber/ui/members/history/HeaderIcon';
import { SummaryCard, SUMMARY_CARD_CONFIG } from '@/industries/rubber/ui/members/history/SummaryCard';
import { QuickFilters } from '@/industries/rubber/ui/members/history/QuickFilters';
import { DateInput } from '@/industries/rubber/ui/members/history/DateInput';
import { LoadingState } from '@/industries/rubber/ui/members/history/LoadingState';
import { EmptyState } from '@/industries/rubber/ui/members/history/EmptyState';
import { PurchasesTable } from '@/industries/rubber/ui/members/history/PurchasesTable';
import { PaginationControls } from '@/industries/rubber/ui/members/history/PaginationControls';
import { CloseIcon } from '@/industries/rubber/ui/members/history/Icons';

interface MemberPurchaseHistoryModalProps {
  isOpen: boolean;
  member: any;
  onClose: () => void;
}

const QUICK_FILTERS: QuickFilter[] = [
  { label: 'วันนี้', value: 0 },
  { label: 'สัปดาห์นี้', value: 7 },
  { label: 'เดือนนี้', value: 30 },
  { label: 'ทั้งหมด', value: null },
];

export const MemberPurchaseHistoryModal: React.FC<MemberPurchaseHistoryModalProps> = ({
  isOpen,
  member,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { loading, purchases, summary, totalPages } = useMemberPurchaseHistory({
    memberId: member?.id,
    currentPage,
    startDate,
    endDate,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedQuickFilter(null);
      setStartDate('');
      setEndDate('');
      setCurrentPage(1);
    }
  }, [isOpen]);

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

  const hasPurchases = purchases.length > 0;


  const summaryCards = useMemo(
    () =>
      SUMMARY_CARD_CONFIG.map((card) => ({
        ...card,
        value: card.formatter(summary as PurchaseSummary),
        subText: card.subText(summary as PurchaseSummary),
      })),
    [summary]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200.dark:border-gray-700 rounded-t-2xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <HeaderIcon />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ประวัติการรับซื้อ</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{member?.name} ({member?.code})</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* <button
                  onClick={handleDownload}
                  disabled={isDownloading || !hasPurchases}
                  className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <DownloadIcon />
                  {isDownloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด PDF'}
                </button> */}
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <CloseIcon />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {summaryCards.map((card) => (
                <SummaryCard key={card.title} {...card} />
              ))}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-600">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🔍 ตัวกรองด่วน</label>
                <QuickFilters filters={QUICK_FILTERS} activeFilter={selectedQuickFilter} onFilterSelect={handleQuickFilter} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateInput
                  label="📅 วันที่เริ่ม"
                  value={startDate}
                  onChange={(value) => {
                    setStartDate(value);
                    setCurrentPage(1);
                    setSelectedQuickFilter(null);
                  }}
                />
                <DateInput
                  label="📅 วันที่สิ้นสุด"
                  value={endDate}
                  onChange={(value) => {
                    setEndDate(value);
                    setCurrentPage(1);
                    setSelectedQuickFilter(null);
                  }}
                />
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : !hasPurchases ? (
              <EmptyState />
            ) : (
              <>
                <PurchasesTable purchases={purchases} totalCount={summary?.totalPurchases ?? purchases.length} />
                {totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

