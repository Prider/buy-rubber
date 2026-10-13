'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMemberPurchaseHistory } from '@/hooks/useMemberPurchaseHistory';
import { PurchaseSummary, QuickFilter } from '@/types/memberHistory';
import { HeaderIcon } from '@/components/members/history/HeaderIcon';
import { SummaryCard, SUMMARY_CARD_CONFIG } from '@/components/members/history/SummaryCard';
import { QuickFilters } from '@/components/members/history/QuickFilters';
import { DateInput } from '@/components/members/history/DateInput';
import { LoadingState } from '@/components/members/history/LoadingState';
import { EmptyState } from '@/components/members/history/EmptyState';
import { PurchasesTable } from '@/components/members/history/PurchasesTable';
import { PaginationControls } from '@/components/members/history/PaginationControls';
import { CloseIcon } from '@/components/members/history/Icons';

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
        <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white text-left shadow-xl dark:bg-gray-800">
          <div className="rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 dark:border-gray-700 dark:from-blue-900/30 dark:to-indigo-900/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <HeaderIcon />
                <div>
                  <h2 className="text-lg font-bold leading-tight text-gray-900 dark:text-white">ประวัติการรับซื้อ</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{member?.name} ({member?.code})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-4">
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              {summaryCards.map((card) => (
                <SummaryCard key={card.title} {...card} />
              ))}
            </div>

            <div className="mb-3 flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 lg:flex-row lg:items-center">
              <span className="shrink-0 text-xs font-medium text-gray-700 dark:text-gray-300">ตัวกรองด่วน</span>
              <QuickFilters filters={QUICK_FILTERS} activeFilter={selectedQuickFilter} onFilterSelect={handleQuickFilter} />
              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <DateInput
                  label="วันที่เริ่ม"
                  value={startDate}
                  onChange={(value) => {
                    setStartDate(value);
                    setCurrentPage(1);
                    setSelectedQuickFilter(null);
                  }}
                />
                <DateInput
                  label="วันที่สิ้นสุด"
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
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <PurchasesTable purchases={purchases} totalCount={summary?.totalPurchases ?? purchases.length} />
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

