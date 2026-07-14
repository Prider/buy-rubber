import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '@/lib/utils';
import type { ProfitLossRow, ProfitLossTotals, ViewMode } from './types';
import { periodLabel } from './utils';

/** Row slots available after header/summary on page 1 */
export const PDF_SLOTS_FIRST_PAGE = 26;
/** Row slots available on continuation pages */
export const PDF_SLOTS_PER_PAGE = 34;

const PDF_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', Arial, sans-serif;
    margin: 0;
    color: #000;
    background: #fff;
  }
  .wrapper { padding: 24px 36px; }
  h1 { margin: 0 0 4px; text-align: center; font-size: 20px; font-weight: 700; }
  .subtitle { margin: 0 0 12px; text-align: center; font-size: 12px; color: #444; }
  .page-header { margin-bottom: 12px; text-align: center; }
  .page-header h2 { margin: 0 0 2px; font-size: 16px; font-weight: 700; }
  .page-header p { margin: 0; font-size: 11px; color: #444; }
  .meta {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
    font-size: 11px;
    color: #333;
  }
  .summary {
    border: 1px solid #bbb;
    padding: 12px 14px;
    margin-bottom: 14px;
  }
  .summary-label { margin: 0 0 2px; font-size: 11px; color: #444; }
  .summary-value { margin: 0; font-size: 22px; font-weight: 700; color: #000; }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    font-size: 11px;
  }
  .section-title {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
    color: #000;
  }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th, td { border: 1px solid #bbb; padding: 5px 8px; font-size: 11px; }
  th { background: #f0f0f0; font-weight: 700; text-align: left; color: #000; }
  td.number { text-align: right; }
  tr.total td { font-weight: 700; background: #f0f0f0; }
  footer { margin-top: 4px; text-align: center; font-size: 10px; color: #666; }
`;

export interface ProfitLossPdfPage {
  periodRows: ProfitLossRow[];
  showFullHeader: boolean;
  showSummary: boolean;
  showPeriodTotal: boolean;
  showFooter: boolean;
  pageNumber: number;
  totalPages: number;
}

export function buildProfitLossPdfPages(
  rows: ProfitLossRow[],
  firstPageSlots = PDF_SLOTS_FIRST_PAGE,
  perPageSlots = PDF_SLOTS_PER_PAGE
): ProfitLossPdfPage[] {
  if (rows.length === 0) return [];

  const periodChunks: ProfitLossRow[][] = [];
  periodChunks.push(rows.slice(0, firstPageSlots));
  for (let i = firstPageSlots; i < rows.length; i += perPageSlots) {
    periodChunks.push(rows.slice(i, i + perPageSlots));
  }

  const totalPages = periodChunks.length;

  return periodChunks.map((chunk, index) => ({
    periodRows: chunk,
    showFullHeader: index === 0,
    showSummary: index === 0,
    showPeriodTotal: index === periodChunks.length - 1,
    showFooter: index === periodChunks.length - 1,
    pageNumber: index + 1,
    totalPages,
  }));
}

function renderPeriodTableRows(rows: ProfitLossRow[], viewMode: ViewMode): string {
  return rows
    .map(
      (row) => `
        <tr>
          <td>${periodLabel(row.period, viewMode)}</td>
          <td class="number">${formatCurrency(row.sales)}</td>
          <td class="number">${formatCurrency(row.purchases)}</td>
          <td class="number">${formatCurrency(row.expenses)}</td>
          <td class="number">${formatCurrency(row.net)}</td>
        </tr>
      `
    )
    .join('');
}

export function generateProfitLossPdfHtml({
  page,
  totals,
  startDate,
  endDate,
  viewMode,
  printedAt = new Date(),
}: {
  page: ProfitLossPdfPage;
  totals: ProfitLossTotals;
  startDate: string;
  endDate: string;
  viewMode: ViewMode;
  printedAt?: Date;
}): string {
  const printedDate = printedAt.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const rangeLabel = `${new Date(startDate).toLocaleDateString('th-TH')} – ${new Date(endDate).toLocaleDateString('th-TH')}`;
  const viewLabel = viewMode === 'monthly' ? 'รายเดือน' : 'รายวัน';
  const netLabel = totals.net >= 0 ? 'Net Profit' : 'Net Loss';
  const pageLabel = page.totalPages > 1 ? `หน้า ${page.pageNumber}/${page.totalPages}` : '';

  const headerSection = page.showFullHeader
    ? `
      <h1>รายงานกำไร / ขาดทุน</h1>
      <p class="subtitle">Profit &amp; Loss Report${pageLabel ? ` • ${pageLabel}` : ''}</p>
      <div class="meta">
        <span><strong>ช่วงวันที่:</strong> ${rangeLabel}</span>
        <span><strong>มุมมอง:</strong> ${viewLabel}</span>
        <span><strong>วันที่จัดทำ:</strong> ${printedDate}</span>
      </div>
    `
    : `
      <div class="page-header">
        <h2>รายงานกำไร / ขาดทุน</h2>
        <p>${pageLabel}</p>
      </div>
    `;

  const summarySection = page.showSummary
    ? `
      <div class="summary">
        <p class="summary-label">ผลลัพธ์สุทธิ (ยอดขาย - ยอดรับซื้อ - ค่าใช้จ่าย)</p>
        <p class="summary-value">${netLabel}: ${formatCurrency(totals.net)}</p>
        <div class="summary-grid">
          <span><strong>Sales:</strong> ${formatCurrency(totals.sales)}</span>
          <span><strong>Purchases:</strong> ${formatCurrency(totals.purchases)}</span>
          <span><strong>Expenses:</strong> ${formatCurrency(totals.expenses)}</span>
        </div>
      </div>
    `
    : '';

  const periodSection = `
      <p class="section-title">${page.showFullHeader ? 'Period breakdown' : 'Period breakdown (continued)'}</p>
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Sales</th>
            <th>Purchases</th>
            <th>Expenses</th>
            <th>Net (Profit / Loss)</th>
          </tr>
        </thead>
        <tbody>
          ${renderPeriodTableRows(page.periodRows, viewMode)}
          ${
            page.showPeriodTotal
              ? `
            <tr class="total">
              <td>Total</td>
              <td class="number">${formatCurrency(totals.sales)}</td>
              <td class="number">${formatCurrency(totals.purchases)}</td>
              <td class="number">${formatCurrency(totals.expenses)}</td>
              <td class="number">${formatCurrency(totals.net)}</td>
            </tr>
          `
              : ''
          }
        </tbody>
      </table>
    `;

  const footerSection = page.showFooter
    ? '<footer>รายงานจัดทำโดยระบบจัดการรับซื้อยาง</footer>'
    : '';

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
        <style>${PDF_STYLES}</style>
      </head>
      <body>
        <div class="wrapper">
          ${headerSection}
          ${summarySection}
          ${periodSection}
          ${footerSection}
        </div>
      </body>
    </html>
  `;
}

async function renderHtmlToCanvas(html: string): Promise<HTMLCanvasElement> {
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

  try {
    return await html2canvas(container, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadProfitLossPdf({
  rows,
  totals,
  startDate,
  endDate,
  viewMode,
}: {
  rows: ProfitLossRow[];
  totals: ProfitLossTotals;
  startDate: string;
  endDate: string;
  viewMode: ViewMode;
}): Promise<void> {
  const pages = buildProfitLossPdfPages(rows);
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageMarginTop = 10;
  const pageMarginBottom = 10;
  const pdfWidth = doc.internal.pageSize.getWidth();
  const availableHeight = doc.internal.pageSize.getHeight() - pageMarginTop - pageMarginBottom;

  for (let index = 0; index < pages.length; index += 1) {
    const html = generateProfitLossPdfHtml({
      page: pages[index],
      totals,
      startDate,
      endDate,
      viewMode,
    });

    const canvas = await renderHtmlToCanvas(html);
    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    const drawHeight = Math.min(imgHeight, availableHeight);

    if (index > 0) {
      doc.addPage();
    }

    doc.addImage(imgData, 'PNG', 0, pageMarginTop, pdfWidth, drawHeight);
  }

  doc.save(`profit-loss-${startDate}-to-${endDate}.pdf`);
}
