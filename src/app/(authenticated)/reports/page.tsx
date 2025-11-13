'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReportData } from '@/hooks/useReportData';
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

export default function ReportsPage() {
  const router = useRouter();
  const [tablePage, setTablePage] = useState(1);
  const PAGE_SIZE = 15;
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
    generateReport,
    getTotalAmount,
    getTotalWeight,
    getReportTitle,
  } = useReportData();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const totalPages = useMemo(() => {
    if (!data || data.length === 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  }, [PAGE_SIZE, data]);

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
  }, [PAGE_SIZE, data, tablePage]);

  const rowOffset = useMemo(() => (tablePage - 1) * PAGE_SIZE, [PAGE_SIZE, tablePage]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePrintPreview = useCallback(() => {
    if (!hasData || !data) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อดูตัวอย่างการพิมพ์');
      return;
    }

    const reportTitle = getReportTitle();
    const dateRange = dateRangeLabel;

    let tableContent = '';
    if (reportType === 'daily_purchase') {
      tableContent = generateDailyPurchaseTableHTML(data);
    } else if (reportType === 'member_summary') {
      tableContent = generateMemberSummaryTableHTML(data);
    } else if (reportType === 'expense_summary') {
      tableContent = generateExpenseTableHTML(data, expenseSummary);
    }

    const htmlContent = generatePrintPreviewHTML(reportTitle, dateRange, tableContent, data.length);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [data, dateRangeLabel, expenseSummary, getReportTitle, hasData, reportType]);

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

  useEffect(() => {
    if (!data || data.length === 0) {
      setTablePage(1);
      return;
    }
    if (tablePage > totalPages) {
      setTablePage(totalPages);
    }
  }, [data, tablePage, totalPages]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">รายงาน</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">รายงานและวิเคราะห์กิจการรับซื้อยาง</p>
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
              {reportType === 'daily_purchase' && <DailyPurchaseTable data={paginatedData} offset={rowOffset} />}
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

