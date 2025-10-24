'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useReportData } from '@/hooks/useReportData';
import {
  generatePrintPreviewHTML,
  generateDailyPurchaseTableHTML,
  generateMemberSummaryTableHTML,
} from '@/lib/reportPrintUtils';
import ReportFilterCard from '@/components/reports/ReportFilterCard';
import ReportSummaryCards from '@/components/reports/ReportSummaryCards';
import DailyPurchaseTable from '@/components/reports/DailyPurchaseTable';
import MemberSummaryTable from '@/components/reports/MemberSummaryTable';

export default function ReportsPage() {
  const router = useRouter();
  const {
    loading,
    reportType,
    setReportType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    data,
    generateReport,
    getTotalAmount,
    getTotalWeight,
    getReportTitle,
  } = useReportData();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handlePrint = () => {
    window.print();
  };

  const handlePrintPreview = () => {
    if (!data) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อดูตัวอย่างการพิมพ์');
      return;
    }

    const reportTitle = getReportTitle();
    const dateRange = `ระหว่างวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`;
    
    let tableContent = '';
    if (reportType === 'daily_purchase') {
      tableContent = generateDailyPurchaseTableHTML(data);
    } else if (reportType === 'member_summary') {
      tableContent = generateMemberSummaryTableHTML(data);
    }

    const htmlContent = generatePrintPreviewHTML(reportTitle, dateRange, tableContent, data.length);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Layout>
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
                      ระหว่างวันที่ {new Date(startDate).toLocaleDateString('th-TH')} - {new Date(endDate).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className="no-print flex items-center gap-3">
                    <button
                      onClick={handlePrintPreview}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>ดูตัวอย่าง PDF</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>พิมพ์รายงาน</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {reportType === 'daily_purchase' && <DailyPurchaseTable data={data} />}
                {reportType === 'member_summary' && <MemberSummaryTable data={data} />}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

