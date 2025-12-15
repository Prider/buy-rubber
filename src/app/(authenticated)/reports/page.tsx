'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useReportData } from '@/hooks/useReportData';
import { useAlert } from '@/hooks/useAlert';
import GamerLoader from '@/components/GamerLoader';
import {
  generatePrintPreviewHTML,
  generateDailyPurchaseTableHTML,
  generateMemberSummaryTableHTML,
  generateExpenseTableHTML,
} from '@/lib/reportPrintUtils';
import ReportFilterCard from '@/components/reports/ReportFilterCard';
import ReportSummaryCards from '@/components/reports/ReportSummaryCards';
import DailyPurchaseTable from '@/components/reports/DailyPurchaseTable';
import MemberSummaryTable from '@/components/reports/MemberSummaryTable';
import ExpenseReportTable from '@/components/reports/ExpenseReportTable';
import ReportActionButtons from '@/components/reports/ReportActionButtons';
import { downloadReportPDF } from '@/lib/reportPdfUtils';
import { PaginationControls } from '@/components/members/history/PaginationControls';

const PAGE_SIZE = 15;

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showWarning } = useAlert();
  const [tablePage, setTablePage] = useState(1);
  const {
    loading,
    reportType,
    setReportType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    data,
    expenseSummary,
    productTypes,
    generateReport,
    getTotalAmount,
    getTotalWeight,
    getReportTitle,
  } = useReportData();

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (isLoading) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, isLoading, router]);

  const totalPages = useMemo(() => {
    if (!data || data.length === 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  }, [data]);

  const hasData = useMemo(() => Array.isArray(data) && data.length > 0, [data]);

  const dateRangeLabel = useMemo(
    () =>
      `ระหว่างวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`,
    [startDate, endDate]
  );

  const paginatedData = useMemo(() => {
    if (!data) {
      return [];
    }
    const startIndex = (tablePage - 1) * PAGE_SIZE;
    return data.slice(startIndex, startIndex + PAGE_SIZE);
  }, [data, tablePage]);

  const rowOffset = useMemo(() => (tablePage - 1) * PAGE_SIZE, [tablePage]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePrintPreview = useCallback(() => {
    if (!hasData || !data) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showWarning('ไม่สามารถเปิดหน้าต่างใหม่ได้', 'กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อดูตัวอย่างการพิมพ์\n\nหากใช้เบราว์เซอร์บล็อกป๊อปอัพ กรุณาอนุญาตสำหรับเว็บไซต์นี้');
      return;
    }

    const reportTitle = getReportTitle();
    const dateRange = dateRangeLabel;

    let tableContent = '';
    const isDailyPurchase = reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:');
    if (isDailyPurchase) {
      tableContent = generateDailyPurchaseTableHTML(data);
    } else if (reportType === 'member_summary') {
      tableContent = generateMemberSummaryTableHTML(data);
    } else if (reportType === 'expense_summary') {
      tableContent = generateExpenseTableHTML(data, expenseSummary);
    }

    const htmlContent = generatePrintPreviewHTML(reportTitle, dateRange, tableContent, data.length);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [data, dateRangeLabel, expenseSummary, getReportTitle, hasData, reportType, showWarning]);

  const handleDownloadPDF = useCallback(() => {
    if (!hasData || !data) return;

    downloadReportPDF({
      reportTitle: getReportTitle(),
      reportType,
      data,
      startDate,
      endDate,
      totalAmount: getTotalAmount(),
      totalWeight: getTotalWeight(),
      expenseSummary,
    });
  }, [data, endDate, expenseSummary, getReportTitle, getTotalAmount, getTotalWeight, hasData, reportType, startDate]);

  useEffect(() => {
    setTablePage(1);
  }, [reportType, startDate, endDate]);

  // Adjust tablePage when data or totalPages changes, but avoid infinite loop
  useEffect(() => {
    if (!data || data.length === 0) {
      setTablePage(1);
      return;
    }
    // Only adjust if current page is out of bounds
    const maxPage = Math.max(1, totalPages);
    setTablePage((currentPage) => {
      if (currentPage > maxPage) {
        return maxPage;
      }
      return currentPage;
    });
  }, [data, totalPages]);

  // Show loader while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
              รายงาน
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">รายงานและวิเคราะห์กิจการรับซื้อยาง</p>
        </div>
      </div>

      {/* Filter Card */}
      <ReportFilterCard
        reportType={reportType}
        setReportType={setReportType}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        loading={loading}
        onGenerate={generateReport}
        productTypes={productTypes}
      />

      {/* Report Result */}
      {data && (
        <>
          {/* Print Styles */}
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
              th, td {
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

          {/* Summary Cards */}
          <ReportSummaryCards
            data={data}
            reportType={reportType}
            totalAmount={getTotalAmount()}
            totalWeight={getTotalWeight()}
            expenseSummary={expenseSummary}
          />

          {/* Report Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300" id="print-area">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getReportTitle()}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {dateRangeLabel}
                  </p>
                </div>
                <ReportActionButtons
                  onPreview={handlePrintPreview}
                  onDownloadPDF={handleDownloadPDF}
                  onPrint={handlePrint}
                  disabled={!hasData}
                />
              </div>
            </div>
            
            <div className="p-6">
              {(reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:')) && (
                <DailyPurchaseTable data={paginatedData} offset={rowOffset} />
              )}
              {reportType === 'member_summary' && <MemberSummaryTable data={paginatedData} offset={rowOffset} />}
              {reportType === 'expense_summary' && (
                <ExpenseReportTable data={paginatedData} categorySummary={expenseSummary} totalAmount={getTotalAmount()} />
              )}
              {hasData && totalPages > 1 && (
                <PaginationControls
                  currentPage={tablePage}
                  totalPages={totalPages}
                  onPrev={() => setTablePage((prev) => Math.max(1, prev - 1))}
                  onNext={() => setTablePage((prev) => Math.min(totalPages, prev + 1))}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

