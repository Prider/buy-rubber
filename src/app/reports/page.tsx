'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('daily_purchase');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'daily_purchase':
          response = await axios.get('/api/purchases', {
            params: { startDate, endDate },
          });
          setData(response.data);
          break;
        case 'member_summary':
          response = await axios.get('/api/purchases', {
            params: { startDate, endDate },
          });
          // Group by member
          const grouped = response.data.reduce((acc: any, p: any) => {
            const key = p.memberId;
            if (!acc[key]) {
              acc[key] = {
                member: p.member,
                count: 0,
                totalWeight: 0,
                totalAmount: 0,
              };
            }
            acc[key].count++;
            acc[key].totalWeight += p.dryWeight;
            acc[key].totalAmount += p.totalAmount;
            return acc;
          }, {});
          setData(Object.values(grouped));
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Generate report error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Open print dialog which shows preview in modern browsers
    window.print();
  };

  const handlePrintPreview = () => {
    // Create a new window for preview
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อดูตัวอย่างการพิมพ์');
      return;
    }

    const reportTitle = getReportTitle();
    const dateRange = `ระหว่างวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`;
    
    let tableContent = '';
    
    if (reportType === 'daily_purchase') {
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เลขที่</th>
              <th>สมาชิก</th>
              <th>น้ำหนัก (กก.)</th>
              <th>ยอดเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item: any) => `
              <tr>
                <td>${new Date(item.date).toLocaleDateString('th-TH')}</td>
                <td>${item.purchaseNo}</td>
                <td>${item.member?.name || '-'}</td>
                <td>${formatNumber(item.dryWeight)}</td>
                <td>${formatCurrency(item.totalAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'member_summary') {
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>สมาชิก</th>
              <th>จำนวนครั้ง</th>
              <th>น้ำหนักรวม (กก.)</th>
              <th>ยอดเงินรวม</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item: any) => `
              <tr>
                <td>${item.member?.name || '-'}</td>
                <td>${item.count}</td>
                <td>${formatNumber(item.totalWeight)}</td>
                <td style="font-weight: bold; color: #059669;">${formatCurrency(item.totalAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTitle}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Sarabun', 'Helvetica Neue', Arial, sans-serif;
            padding: 40px;
            background: #f5f5f5;
          }
          .page {
            background: white;
            padding: 40px;
            margin: 0 auto;
            max-width: 210mm;
            min-height: 297mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
          }
          .header h1 {
            font-size: 28px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 14px;
            color: #64748b;
          }
          .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 12px;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 14px;
          }
          th {
            background: #2563eb;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          tr:hover {
            background-color: #f1f5f9;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
          .print-button {
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
            transition: all 0.3s;
          }
          .print-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .page {
              box-shadow: none;
              padding: 20px;
              max-width: 100%;
            }
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>${reportTitle}</h1>
            <p>${dateRange}</p>
          </div>
          <div class="meta-info">
            <span>พิมพ์วันที่: ${new Date().toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
            <span>จำนวนรายการ: ${data.length} รายการ</span>
          </div>
          ${tableContent}
          <div class="footer">
            <p>ระบบจัดการรับซื้อยาง | สร้างโดยระบบอัตโนมัติ</p>
          </div>
        </div>
        <button class="print-button" onclick="window.print()">🖨️ พิมพ์รายงาน</button>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily_purchase':
        return 'รายงานรับซื้อประจำวัน';
      case 'member_summary':
        return 'สรุปรายสมาชิก';
      case 'payment_summary':
        return 'สรุปการจ่ายเงิน';
      default:
        return 'รายงาน';
    }
  };

  const getTotalAmount = () => {
    if (!data) return 0;
    if (reportType === 'daily_purchase') {
      return data.reduce((sum: number, item: any) => sum + item.totalAmount, 0);
    } else if (reportType === 'member_summary') {
      return data.reduce((sum: number, item: any) => sum + item.totalAmount, 0);
    }
    return 0;
  };

  const getTotalWeight = () => {
    if (!data) return 0;
    if (reportType === 'daily_purchase') {
      return data.reduce((sum: number, item: any) => sum + item.dryWeight, 0);
    } else if (reportType === 'member_summary') {
      return data.reduce((sum: number, item: any) => sum + item.totalWeight, 0);
    }
    return 0;
  };

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">รายงาน</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">รายงานและวิเคราะห์กิจการรับซื้อยาง</p>
        </div>

        {/* Filter Card - Modern Design */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ตัวกรองรายงาน</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ประเภทรายงาน
                </label>
                <div className="relative">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="input w-full pl-4 pr-10 py-3 appearance-none bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="daily_purchase">📊 รายงานรับซื้อประจำวัน</option>
                    <option value="member_summary">👥 สรุปรายสมาชิก</option>
                    <option value="payment_summary">💰 สรุปการจ่ายเงิน</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  วันที่เริ่มต้น
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  วันที่สิ้นสุด
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={generateReport}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 dark:from-indigo-500 dark:to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>กำลังสร้าง...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>สร้างรายงาน</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

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
            <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Records Card */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-blue-200/50 dark:border-blue-800/30">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl backdrop-blur-sm shadow-sm">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    จำนวนรายการ
                  </p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                    {data.length}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {reportType === 'daily_purchase' ? 'รายการรับซื้อ' : 'สมาชิก'}
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              </div>

              {/* Total Weight Card */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-purple-200/50 dark:border-purple-800/30">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl backdrop-blur-sm shadow-sm">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                    น้ำหนักรวม
                  </p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatNumber(getTotalWeight())}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    กิโลกรัม
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-200/30 dark:bg-purple-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              </div>

              {/* Total Amount Card */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-green-200/50 dark:border-green-800/30">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl backdrop-blur-sm shadow-sm">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
                    ยอดเงินรวม
                  </p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(getTotalAmount())}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    บาท
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-green-200/30 dark:bg-green-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              </div>
            </div>

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
            {reportType === 'daily_purchase' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        วันที่
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        เลขที่
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        สมาชิก
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        น้ำหนัก (กก.)
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        ยอดเงิน
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.map((item: any, idx: number) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300">
                              {idx + 1}
                            </span>
                            {new Date(item.date).toLocaleDateString('th-TH', { 
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {item.purchaseNo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.member?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600 dark:text-purple-400">
                          {formatNumber(item.dryWeight)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'member_summary' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        สมาชิก
                      </th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        จำนวนครั้ง
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        น้ำหนักรวม (กก.)
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        ยอดเงินรวม
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.map((item: any, idx: number) => (
                      <tr key={item.member?.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                              idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                              idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                              'bg-gradient-to-br from-blue-400 to-blue-600'
                            }`}>
                              {idx + 1}
                            </div>
                            <span>{item.member?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {item.count} ครั้ง
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600 dark:text-purple-400">
                          {formatNumber(item.totalWeight)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600 dark:text-green-400 text-lg">
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

