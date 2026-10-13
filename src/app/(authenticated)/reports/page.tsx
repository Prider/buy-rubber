'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { REPORT_PAGE_SIZE, useReportData } from '@/hooks/useReportData';
import { useReportProductTypeGroups } from '@/hooks/useReportProductTypeGroups';
import { useAlert } from '@/hooks/useAlert';
import GamerLoader from '@/components/GamerLoader';
import {
  generatePrintPreviewHTML,
  generateDailyPurchaseTableHTML,
  generateSellSummaryTableHTML,
  generateMemberSummaryTableHTML,
  generateExpenseTableHTML,
} from '@/lib/reportPrintUtils';
import ReportFilterCard from '@/components/reports/ReportFilterCard';
import ReportTabs, { type ReportTabId } from '@/components/reports/ReportTabs';
import { useReportGroupManagementModal } from '@/hooks/useReportGroupManagementModal';
import { getSelectedGroupId, isDailyPurchaseReport, isSellSummaryReport } from '@/lib/reportProductTypeGroups';
import ReportSummaryCards from '@/components/reports/ReportSummaryCards';
import DailyPurchaseTable from '@/components/reports/DailyPurchaseTable';
import SellSummaryTable from '@/components/reports/SellSummaryTable';
import MemberSummaryTable from '@/components/reports/MemberSummaryTable';
import ExpenseReportTable from '@/components/reports/ExpenseReportTable';
import ReportActionButtons from '@/components/reports/ReportActionButtons';
import { downloadReportPDF } from '@/lib/reportPdfUtils';
import { ListPagination } from '@/components/pagination/ListPagination';
import ProfitLossReport from './profit-loss/ProfitLossReport';

const EMBEDDED_TABS = ['profit_loss'] as const;
type EmbeddedTab = (typeof EMBEDDED_TABS)[number];

function isEmbeddedTabId(value: string): value is EmbeddedTab {
  return (EMBEDDED_TABS as readonly string[]).includes(value);
}

function embeddedTabFromSearch(value: string | null): EmbeddedTab | null {
  if (value && isEmbeddedTabId(value)) return value;
  return null;
}

function isEmbeddedTab(tab: ReportTabId): tab is EmbeddedTab {
  return isEmbeddedTabId(tab);
}

const ReportGroupManagementModal = dynamic(
  () => import(/* webpackPrefetch: true */ '@/components/reports/ReportGroupManagementModal'),
  { ssr: false, loading: () => null },
);

function tabFromReportType(reportType: string): ReportTabId {
  if (isSellSummaryReport(reportType)) return 'sell_summary';
  if (reportType === 'member_summary') return 'member_summary';
  if (reportType === 'expense_summary') return 'expense_summary';
  return 'daily_purchase';
}

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const { showWarning } = useAlert();
  const [tablePage, setTablePage] = useState(1);
  const purchaseGroupManager = useReportProductTypeGroups('purchase');
  const saleGroupManager = useReportProductTypeGroups('sale');
  const {
    groups: reportGroupRecords,
    loading: groupsLoading,
    saving: groupsSaving,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  } = purchaseGroupManager;
  const {
    groups: sellGroupRecords,
    loading: sellGroupsLoading,
    saving: sellGroupsSaving,
    loadGroups: loadSellGroups,
    createGroup: createSellGroup,
    updateGroup: updateSellGroup,
    deleteGroup: deleteSellGroup,
  } = saleGroupManager;
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
    sellReportGroups,
    totalPages,
    totalCount,
    generateReport,
    fetchExportRows,
    getTotalAmount,
    getTotalWeight,
    getReportTitle,
  } = useReportData(reportGroupRecords, sellGroupRecords);

  const embeddedFromUrl = embeddedTabFromSearch(searchParams.get('tab'));
  const [embeddedTab, setEmbeddedTab] = useState<EmbeddedTab | null>(embeddedFromUrl);
  const activeTab: ReportTabId = embeddedTab ?? tabFromReportType(reportType);

  useEffect(() => {
    setEmbeddedTab(embeddedTabFromSearch(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    void loadGroups();
    void loadSellGroups();
  }, [loadGroups, loadSellGroups]);

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

  const rowOffset = useMemo(() => (tablePage - 1) * REPORT_PAGE_SIZE, [tablePage]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleTabChange = useCallback(
    (tab: ReportTabId) => {
      if (isEmbeddedTab(tab)) {
        setEmbeddedTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        params.delete('productTypeId');
        router.replace(`/reports?${params.toString()}`, { scroll: false });
        return;
      }

      setEmbeddedTab(null);
      if (searchParams.get('tab') || searchParams.get('productTypeId')) {
        router.replace('/reports', { scroll: false });
      }
      setTablePage(1);
      setReportType(tab);
    },
    [router, searchParams, setReportType],
  );

  const handleGroupsChanged = useCallback(async () => {
    const selectedGroupId = getSelectedGroupId(reportType);
    if (isSellSummaryReport(reportType)) {
      const nextGroups = await loadSellGroups();
      if (selectedGroupId && !nextGroups.some((group) => group.id === selectedGroupId)) {
        setReportType('sell_summary');
      }
      return;
    }

    const nextGroups = await loadGroups();
    if (selectedGroupId && !nextGroups.some((group) => group.id === selectedGroupId)) {
      setReportType('daily_purchase');
    }
  }, [loadGroups, loadSellGroups, reportType, setReportType]);

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
    if (isDailyPurchaseReport(reportType)) {
      tableContent = generateDailyPurchaseTableHTML(exported.rows);
    } else if (isSellSummaryReport(reportType)) {
      tableContent = generateSellSummaryTableHTML(exported.rows);
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden max-md:-mx-4 max-md:-mt-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:rounded-2xl lg:border lg:border-gray-100 lg:bg-white lg:shadow-sm lg:dark:border-gray-700 lg:dark:bg-gray-800">
        <header className="shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900 md:border-gray-200 md:bg-transparent md:px-0 md:py-0 lg:px-5 dark:md:border-gray-700 dark:md:bg-transparent">
          <div className="flex min-w-0 flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <h1 className="hidden shrink-0 text-lg font-semibold tracking-tight lg:block">
              <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
                รายงาน
              </span>
            </h1>
            <ReportTabs activeTab={activeTab} onTabChange={handleTabChange} />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 md:px-0 lg:px-0">
      <div id="report-tabpanel" role="tabpanel" aria-labelledby={`report-tab-${activeTab}`} className={isEmbeddedTab(activeTab) ? 'min-h-0 flex-1 overflow-y-auto' : 'shrink-0'}>
        {activeTab === 'profit_loss' ? (
          <div className="lg:px-5 lg:py-5">
            <ProfitLossReport />
          </div>
        ) : null}

        {!isEmbeddedTab(activeTab) ? (
        <div className="lg:border-b lg:border-gray-100 lg:px-5 lg:py-4 lg:dark:border-gray-700">
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
          reportGroups={activeTab === 'sell_summary' ? sellReportGroups : reportGroups}
          onManageGroups={
            activeTab === 'daily_purchase' || activeTab === 'sell_summary' ? groupModal.open : undefined
          }
          selectMode={activeTab}
        />
        </div>
        ) : null}
      </div>

      <ReportGroupManagementModal
        isOpen={groupModal.isOpen}
        onClose={groupModal.close}
        productTypes={productTypes}
        kind={activeTab === 'sell_summary' ? 'sale' : 'purchase'}
        groups={activeTab === 'sell_summary' ? sellGroupRecords : reportGroupRecords}
        loading={activeTab === 'sell_summary' ? sellGroupsLoading : groupsLoading}
        saving={activeTab === 'sell_summary' ? sellGroupsSaving : groupsSaving}
        onCreateGroup={activeTab === 'sell_summary' ? createSellGroup : createGroup}
        onUpdateGroup={activeTab === 'sell_summary' ? updateSellGroup : updateGroup}
        onDeleteGroup={activeTab === 'sell_summary' ? deleteSellGroup : deleteGroup}
        onRefresh={handleGroupsChanged}
      />

      {!isEmbeddedTab(activeTab) && data && (
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

          <div className="shrink-0 py-3 lg:px-5 lg:py-2">
            <ReportSummaryCards
              reportType={reportType}
              totalAmount={getTotalAmount()}
              totalWeight={getTotalWeight()}
              totalCount={totalCount}
              expenseSummary={expenseSummary}
            />
          </div>

          <div className="lg:border-t lg:border-gray-100 lg:dark:border-gray-700">
          <section
            id="print-area"
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:dark:bg-transparent"
          >
            <div className="flex shrink-0 flex-col gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
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
              {isDailyPurchaseReport(reportType) && (
                <DailyPurchaseTable data={data ?? []} offset={rowOffset} />
              )}
              {isSellSummaryReport(reportType) && (
                <SellSummaryTable data={data ?? []} offset={rowOffset} />
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
            </div>
          </section>
          </div>
        </>
      )}

      {!isEmbeddedTab(activeTab) && !data && !loading ? (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-dashed border-gray-200 px-5 py-16 text-center dark:border-gray-700 lg:rounded-none lg:border-none">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'daily_purchase' || activeTab === 'sell_summary'
              ? 'เลือกประเภทรายงานและช่วงวันที่ แล้วกดสร้างรายงาน'
              : 'เลือกช่วงวันที่ แล้วกดสร้างรายงาน'}
          </p>
        </div>
      ) : null}
        </div>
        {!isEmbeddedTab(activeTab) && data ? (
          <div className="no-print shrink-0">
            <ListPagination
              embedded
              pagination={{
                page: tablePage,
                limit: REPORT_PAGE_SIZE,
                total: totalCount,
                totalPages,
              }}
              loading={paging}
              onPageChange={goToPage}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
