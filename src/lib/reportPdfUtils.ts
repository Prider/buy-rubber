'use client';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency, formatNumber } from './utils';
import { ReportType } from '@/hooks/useReportData';

interface ExpenseCategorySummary {
  category: string;
  totalAmount: number;
  count: number;
}

interface DownloadReportPDFParams {
  reportTitle: string;
  reportType: ReportType;
  data: any[];
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalWeight: number;
  expenseSummary?: ExpenseCategorySummary[];
}

const ROWS_PER_PAGE = 15;

const renderTableRows = (reportType: ReportType, rows: any[]) => {
  const isDailyPurchase = reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:');
  if (isDailyPurchase) {
    return rows
      .map(
        (item) => `
          <tr>
            <td>${new Date(item.date).toLocaleDateString('th-TH')}</td>
            <td>${item.purchaseNo || '-'}</td>
            <td>${item.member?.name || '-'}</td>
            <td>${item.productType?.name || '-'}</td>
            <td class=\"number\">${formatNumber(item.dryWeight)}</td>
            <td class=\"number\">${formatCurrency(item.totalAmount)}</td>
          </tr>
        `
      )
      .join('');
  }

  if (reportType === 'member_summary') {
    return rows
      .map(
        (item) => `
          <tr>
            <td>${item.member?.name || '-'}</td>
            <td class=\"number\">${item.count?.toLocaleString('th-TH')}</td>
            <td class=\"number\">${formatNumber(item.totalWeight)}</td>
            <td class=\"number\">${formatCurrency(item.totalAmount)}</td>
          </tr>
        `
      )
      .join('');
  }

  return rows
    .map(
      (item) => `
        <tr>
          <td>${new Date(item.date || item.createdAt).toLocaleDateString('th-TH')}</td>
          <td>${item.expenseNo || '-'}</td>
          <td>${item.category || '-'}</td>
          <td>${item.description || '-'}</td>
          <td class=\"number\">${formatCurrency(item.amount || 0)}</td>
        </tr>
      `
    )
    .join('');
};

const renderTableHeaders = (reportType: ReportType) => {
  const isDailyPurchase = reportType === 'daily_purchase' || reportType.startsWith('daily_purchase:');
  if (isDailyPurchase) {
    return `
      <tr>
        <th>วันที่</th>
        <th>เลขที่</th>
        <th>สมาชิก</th>
        <th>ประเภทสินค้า</th>
        <th>น้ำหนัก (กก.)</th>
        <th>ยอดเงิน</th>
      </tr>
    `;
  }

  if (reportType === 'member_summary') {
    return `
      <tr>
        <th>สมาชิก</th>
        <th>จำนวนครั้ง</th>
        <th>น้ำหนักรวม (กก.)</th>
        <th>ยอดเงินรวม</th>
      </tr>
    `;
  }

  return `
    <tr>
      <th>วันที่</th>
      <th>เลขที่</th>
      <th>หมวดค่าใช้จ่าย</th>
      <th>รายละเอียด</th>
      <th>จำนวนเงิน</th>
    </tr>
  `;
};

const renderSummarySection = ({
  reportType,
  totalAmount,
  totalWeight,
  dataLength,
  expenseSummary,
}: {
  reportType: ReportType;
  totalAmount: number;
  totalWeight: number;
  dataLength: number;
  expenseSummary: ExpenseCategorySummary[];
}) => {
  const summaryLines = [
    `<p><strong>จำนวนรายการ:</strong> ${dataLength.toLocaleString('th-TH')} รายการ</p>`,
    `<p><strong>ยอดรวม:</strong> ${formatCurrency(totalAmount)}</p>`,
  ];

  if (reportType !== 'expense_summary') {
    summaryLines.push(`<p><strong>น้ำหนักรวม:</strong> ${formatNumber(totalWeight)} กิโลกรัม</p>`);
  }

  const expenseSummaryTable =
    reportType === 'expense_summary' && expenseSummary.length > 0
      ? `
        <div class=\"summary-table\">
          <h3>สรุปตามหมวดค่าใช้จ่าย</h3>
          <table>
            <thead>
              <tr>
                <th>หมวดค่าใช้จ่าย</th>
                <th>จำนวนรายการ</th>
                <th>ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              ${expenseSummary
                .map(
                  (item) => `
                    <tr>
                      <td>${item.category}</td>
                      <td class=\"number\">${item.count.toLocaleString('th-TH')}</td>
                      <td class=\"number\">${formatCurrency(item.totalAmount)}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
      : '';

  return `
    <div class=\"summary\">
      <h3>สรุปผลรวม</h3>
      ${summaryLines.join('')}
      ${expenseSummaryTable}
    </div>
  `;
};

const generateReportHTML = ({
  reportTitle,
  reportType,
  rows,
  page,
  totalPages,
  startDate,
  endDate,
  totalAmount,
  totalWeight,
  dataLength,
  expenseSummary,
  includeSummary,
}: {
  reportTitle: string;
  reportType: ReportType;
  rows: any[];
  page: number;
  totalPages: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalWeight: number;
  dataLength: number;
  expenseSummary: ExpenseCategorySummary[];
  includeSummary: boolean;
}) => {
  const printedDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rangeLabel = `ช่วงวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`;
  const pageLabel = totalPages > 1 ? `หน้า ${page}/${totalPages}` : '';
  const startIndex = (page - 1) * ROWS_PER_PAGE + 1;
  const endIndex = startIndex + rows.length - 1;
  const rowLabel = `แสดงรายการ ${startIndex.toLocaleString('th-TH')} - ${endIndex.toLocaleString('th-TH')}`;

  return `
    <html>
      <head>
        <meta charset=\"utf-8\" />
        <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">
        <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>
        <link href=\"https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&display=swap\" rel=\"stylesheet\">
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', Arial, sans-serif; margin: 16px 40px; color: #000; }
          .wrapper { padding: 28px 40px; border: 1px solid #ddd; border-radius: 16px; }
          h1 { text-align: center; margin-bottom: 12px; font-size: 24px; }
          .meta { text-align: center; margin-bottom: 16px; font-size: 14px; color: #374151; }
          .info { margin-bottom: 16px; font-size: 13px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; color: #000000; }
          th, td { border: 1px solid #ddd; padding: 10px; font-size: 13px; }
          th { background: #f4f4f4; font-weight: 600; text-align: left; }
          td.number { text-align: right; }
          .summary { margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
          .summary h3 { margin-bottom: 8px; font-size: 16px; }
          .summary p { margin: 4px 0; font-size: 13px; }
          .summary-table { margin-top: 12px; }
          .summary-table table th { background: #ecfdf5; }
          footer { margin-top: 24px; text-align: center; font-size: 11px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class=\"wrapper\">
          <h1>${reportTitle}</h1>
          <div class=\"meta\">${rangeLabel}${pageLabel ? ` • ${pageLabel}` : ''}</div>
          <div class=\"info\">
            <p><strong>วันที่จัดทำ:</strong> ${printedDate}</p>
            <p><strong>${rowLabel}</strong></p>
          </div>
          <table>
            <thead>
              ${renderTableHeaders(reportType)}
            </thead>
            <tbody>
              ${renderTableRows(reportType, rows)}
            </tbody>
          </table>
          ${
            includeSummary
              ? renderSummarySection({
                  reportType,
                  totalAmount,
                  totalWeight,
                  dataLength,
                  expenseSummary,
                })
              : ''
          }
          <footer>รายงานจัดทำโดยระบบจัดการรับซื้อยาง</footer>
        </div>
      </body>
    </html>
  `;
};

export async function downloadReportPDF({
  reportTitle,
  reportType,
  data,
  startDate,
  endDate,
  totalAmount,
  totalWeight,
  expenseSummary = [],
}: DownloadReportPDFParams) {
  if (!Array.isArray(data) || data.length === 0) {
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageMarginTop = 10;
  const pageMarginBottom = 10;
  const pdfWidth = doc.internal.pageSize.getWidth();
  const availableHeight = doc.internal.pageSize.getHeight() - pageMarginTop - pageMarginBottom;
  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));

  for (let page = 0; page < totalPages; page += 1) {
    const startIndex = page * ROWS_PER_PAGE;
    const rows = data.slice(startIndex, startIndex + ROWS_PER_PAGE);
    const includeSummary = page === totalPages - 1;

    const html = generateReportHTML({
      reportTitle,
      reportType,
      rows,
      page: page + 1,
      totalPages,
      startDate,
      endDate,
      totalAmount,
      totalWeight,
      dataLength: data.length,
      expenseSummary,
      includeSummary,
    });

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '0';
    container.style.width = '794px';
    container.style.color = '#000';
    container.style.background = '#fff';
    document.body.appendChild(container);

    await new Promise<void>((resolve) => setTimeout(resolve, 120));

    const canvas = await html2canvas(container, { scale: 1, useCORS: true });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    const drawHeight = Math.min(imgHeight, availableHeight);

    if (page > 0) {
      doc.addPage();
    }

    doc.addImage(imgData, 'PNG', 0, pageMarginTop, pdfWidth, drawHeight);
  }

  const fileName = `${reportTitle}_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
