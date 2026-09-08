'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useReportData } from '@/hooks/useReportData';
import { useReportProductTypeGroups } from '@/hooks/useReportProductTypeGroups';
import { useAlert } from '@/hooks/useAlert';
import GamerLoader from '@/components/GamerLoader';
import {
  generatePrintPreviewHTML,
  generateDailyPurchaseTableHTML,
  generateMemberSummaryTableHTML,
  generateExpenseTableHTML,
} from '@/lib/reportPrintUtils';
import ReportFilterCard from '@/components/reports/ReportFilterCard';
import { useReportGroupManagementModal } from '@/hooks/useReportGroupManagementModal';
import { getDailyPurchaseGroupId } from '@/lib/reportProductTypeGroups';
import ReportSummaryCards from '@/components/reports/ReportSummaryCards';
import DailyPurchaseTable from '@/components/reports/DailyPurchaseTable';
import MemberSummaryTable from '@/components/reports/MemberSummaryTable';
import ExpenseReportTable from '@/components/reports/ExpenseReportTable';
import ReportActionButtons from '@/components/reports/ReportActionButtons';
import { downloadReportPDF } from '@/lib/reportPdfUtils';
import { PaginationControls } from '@/components/members/history/PaginationControls';

const ReportGroupManagementModal = dynamic(
  () => import(/* webpackPrefetch: true */ '@/components/reports/ReportGroupManagementModal'),
  { ssr: false, loading: () => null },
);

const PAGE_SIZE = 15;

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showWarning } = useAlert();
  const [tablePage, setTablePage] = useState(1);
  const groupManager = useReportProductTypeGroups();
  const {
    groups: reportGroupRecords,
    loading: groupsLoading,
    saving: groupsSaving,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  } = groupManager;
  const groupModal = useReportGroupManagementModal();
  const {
    loading,
    paging,
    exporting,
    reportType,
    setReportType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    data,
    expenseSummary,
    productTypes,
    reportGroups,
    totalPages,
    totalCount,
    generateReport,
    fetchExportRows,
    getTotalAmount,
    getTotalWeight,
    getReportTitle,
  } = useReportData(reportGroupRecords);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const hasData = totalCount > 0;

  const dateRangeLabel = useMemo(
    () =>
      `ระหว่างวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`,
    [startDate, endDate],
  );

  const rowOffset = useMemo(() => (tablePage - 1) * PAGE_SIZE, [tablePage]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleGroupsChanged = useCallback(async () => {
    const nextGroups = await loadGroups();
    const selectedGroupId = getDailyPurchaseGroupId(reportType);
    if (selectedGroupId && !nextGroups.some((group) => group.id === selectedGroupId)) {
      setReportType('daily_purchase');
    }
  }, [loadGroups, reportType, setReportType]);

  const handlePrintPreview = useCallback(async () => {
    if (!hasData) return;

    const exported = await fetchExportRows();
    if (!exported) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showWarning(
        'ไม่สามารถเปิดหน้าต่างใหม่ได้',
        'กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อดูตัวอย่างการพิมพ์\n\nหากใช้เบราว์เซอร์บล็อกป๊อปอัพ กรุณาอนุญาตสำหรับเว็บไซต์นี้',
      );
      return;
    }

    const reportTitle = getReportTitle();
    let tableContent = '';
    const isDailyPurchase = reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:');
    if (isDailyPurchase) {
      tableContent = generateDailyPurchaseTableHTML(exported.rows);
    } else if (reportType === 'member_summary') {
      tableContent = generateMemberSummaryTableHTML(exported.rows);
    } else if (reportType === 'expense_summary') {
      tableContent = generateExpenseTableHTML(exported.rows, exported.expenseSummary);
    }

    const htmlContent = generatePrintPreviewHTML(
      reportTitle,
      dateRangeLabel,
      tableContent,
      exported.rows.length,
    );
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [dateRangeLabel, fetchExportRows, getReportTitle, hasData, reportType, showWarning]);

  const handleDownloadPDF = useCallback(async () => {
    if (!hasData) return;

    const exported = await fetchExportRows();
    if (!exported) return;

    downloadReportPDF({
      reportTitle: getReportTitle(),
      reportType,
      data: exported.rows,
      startDate,
      endDate,
      totalAmount: exported.totals.totalAmount,
      totalWeight: exported.totals.totalWeight,
      expenseSummary: exported.expenseSummary,
    });
  }, [endDate, fetchExportRows, getReportTitle, hasData, reportType, startDate]);

  const goToPage = useCallback(
    (page: number) => {
      setTablePage(page);
      void generateReport(page);
    },
    [generateReport],
  );

  useEffect(() => {
    setTablePage(1);
  }, [reportType, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
              รายงาน
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            รับซื้อ · สมาชิก · ค่าใช้จ่าย
          </p>
        </div>

        <Link
          href="/reports/profit-loss"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 sm:self-auto"
        >
          ดูกำไร / ขาดทุน
          <span aria-hidden className="text-base leading-none">
            →
          </span>
        </Link>
      </div>

      <ReportFilterCard
        reportType={reportType}
        setReportType={setReportType}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        loading={loading}
        onGenerate={() => {
          setTablePage(1);
          void generateReport(1);
        }}
        reportGroups={reportGroups}
        onManageGroups={groupModal.open}
      />

      <ReportGroupManagementModal
        isOpen={groupModal.isOpen}
        onClose={groupModal.close}
        productTypes={productTypes}
        groups={reportGroupRecords}
        loading={groupsLoading}
        saving={groupsSaving}
        onCreateGroup={createGroup}
        onUpdateGroup={updateGroup}
        onDeleteGroup={deleteGroup}
        onRefresh={handleGroupsChanged}
      />

      {data && (
        <>
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #print-area,
              #print-area * {
                visibility: visible;
              }
              #print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th,
              td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f3f4f6 !important;
                font-weight: bold;
              }
            }
          `}</style>

          <ReportSummaryCards
            reportType={reportType}
            totalAmount={getTotalAmount()}
            totalWeight={getTotalWeight()}
            totalCount={totalCount}
            expenseSummary={expenseSummary}
          />

          <section
            id="print-area"
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{getReportTitle()}</h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{dateRangeLabel}</p>
              </div>
              <ReportActionButtons
                onPreview={handlePrintPreview}
                onDownloadPDF={handleDownloadPDF}
                onPrint={handlePrint}
                disabled={!hasData || exporting}
              />
            </div>

            <div className={`p-5 ${paging ? 'opacity-60' : ''}`}>
              {(reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:')) && (
                <DailyPurchaseTable data={data ?? []} offset={rowOffset} />
              )}
              {reportType === 'member_summary' && (
                <MemberSummaryTable data={data ?? []} offset={rowOffset} />
              )}
              {reportType === 'expense_summary' && (
                <ExpenseReportTable
                  data={data ?? []}
                  categorySummary={expenseSummary}
                  totalAmount={getTotalAmount()}
                />
              )}
              {hasData && totalPages > 1 && (
                <PaginationControls
                  currentPage={tablePage}
                  totalPages={totalPages}
                  onPrev={() => goToPage(Math.max(1, tablePage - 1))}
                  onNext={() => goToPage(Math.min(totalPages, tablePage + 1))}
                />
              )}
            </div>
          </section>
        </>
      )}

      {!data && !loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-16 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            เลือกประเภทรายงานและช่วงวันที่ แล้วกดสร้างรายงาน
          </p>
        </div>
      ) : null}
    </div>
  );
}
