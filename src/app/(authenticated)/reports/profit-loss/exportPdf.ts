import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '@/lib/utils';
import { CHART_SERIES, type ProfitLossRow, type ProfitLossTotals, type ViewMode } from './types';
import { getViewModeLabel } from './ui';
import { periodLabel } from './utils';

/** Row slots available after header, summary, and chart on page 1 */
export const PDF_SLOTS_FIRST_PAGE = 16;
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
  .chart { margin: 0 0 16px; }
  .chart-subtitle { margin: 0 0 8px; font-size: 11px; color: #444; }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; margin: 0 0 6px; font-size: 11px; color: #333; }
  .legend-item { display: inline-flex; align-items: center; gap: 6px; }
  .legend-swatch { width: 10px; height: 10px; border-radius: 2px; }
  .chart svg { display: block; width: 100%; height: auto; }
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

const compactAmount = new Intl.NumberFormat('th-TH', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function renderProfitLossChart(rows: ProfitLossRow[], viewMode: ViewMode): string {
  if (rows.length === 0) return '';

  const width = 720;
  const height = 210;
  const pad = { top: 8, right: 68, bottom: 36, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const expenseMax = niceCeiling(Math.max(...rows.map((row) => row.expenses), 0));
  const prices = rows.flatMap((row) =>
    [row.purchasePricePerKg, row.salePricePerKg].filter((value) => value > 0),
  );
  const priceMin = prices.length > 0 ? Math.floor(Math.min(...prices) - 2) : 0;
  const priceMax = prices.length > 0 ? Math.ceil(Math.max(...prices) + 2) : 1;

  const groupW = plotW / rows.length;
  const innerGap = 3;
  const barW = Math.max(2, Math.min(22, (groupW - 16 - innerGap * 2) / 3));
  const clusterW = barW * 3 + innerGap * 2;
  const labelStep = groupW >= 52 ? 1 : Math.ceil(52 / groupW);

  const yOf = (value: number, min: number, max: number) => {
    const span = max - min || 1;
    return pad.top + plotH * (1 - (value - min) / span);
  };

  const grid: string[] = [];
  for (let tick = 0; tick <= 4; tick += 1) {
    const ratio = tick / 4;
    const y = pad.top + plotH * (1 - ratio);
    const expenseLabel = compactAmount.format(expenseMax * ratio);
    const priceLabel = formatCurrency(priceMin + (priceMax - priceMin) * ratio);
    grid.push(
      `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="#e5e7eb" stroke-dasharray="4 6" />`,
      `<text x="${pad.left - 8}" y="${y + 3}" text-anchor="end" font-size="10" fill="#64748b">${escapeXml(expenseLabel)}</text>`,
      `<text x="${width - pad.right + 8}" y="${y + 3}" text-anchor="start" font-size="10" fill="#64748b">${escapeXml(priceLabel)}</text>`,
    );
  }

  const series = [
    { key: 'expenses' as const, color: CHART_SERIES[0].color, min: 0, max: expenseMax },
    { key: 'purchasePricePerKg' as const, color: CHART_SERIES[1].color, min: priceMin, max: priceMax },
    { key: 'salePricePerKg' as const, color: CHART_SERIES[2].color, min: priceMin, max: priceMax },
  ];

  const bars: string[] = [];
  const labels: string[] = [];

  rows.forEach((row, index) => {
    const center = pad.left + groupW * index + groupW / 2;
    const startX = center - clusterW / 2;

    series.forEach((item, seriesIndex) => {
      const value = row[item.key];
      if (value <= 0) return;
      const y = yOf(value, item.min, item.max);
      const base = yOf(item.min, item.min, item.max);
      const barHeight = Math.max(0, base - y);
      const x = startX + seriesIndex * (barW + innerGap);
      bars.push(
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="2" fill="${item.color}" />`,
      );
    });

    if (index % labelStep === 0) {
      labels.push(
        `<text x="${center.toFixed(1)}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#64748b">${escapeXml(periodLabel(row.period, viewMode))}</text>`,
      );
    }
  });

  const legend = CHART_SERIES.map(
    (item) =>
      `<span class="legend-item"><span class="legend-swatch" style="background:${item.color}"></span>${escapeXml(item.label)}</span>`,
  ).join('');

  return `
    <div class="chart">
      <p class="section-title">แนวโน้ม</p>
      <p class="chart-subtitle">ค่าใช้จ่าย · ราคาซื้อ/กก. · ราคาขาย/กก.</p>
      <div class="legend">${legend}</div>
      <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="แนวโน้ม">
        ${grid.join('')}
        ${bars.join('')}
        ${labels.join('')}
      </svg>
    </div>
  `;
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
  chartRows,
  printedAt = new Date(),
}: {
  page: ProfitLossPdfPage;
  totals: ProfitLossTotals;
  startDate: string;
  endDate: string;
  viewMode: ViewMode;
  chartRows?: ProfitLossRow[];
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
  const viewLabel = getViewModeLabel(viewMode);
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

  const chartSection = page.showFullHeader
    ? renderProfitLossChart(chartRows ?? page.periodRows, viewMode)
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
          ${chartSection}
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

export function generateProfitLossPreviewHtml({
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
}): string {
  const html = generateProfitLossPdfHtml({
    page: {
      periodRows: rows,
      showFullHeader: true,
      showSummary: true,
      showPeriodTotal: true,
      showFooter: true,
      pageNumber: 1,
      totalPages: 1,
    },
    totals,
    startDate,
    endDate,
    viewMode,
    chartRows: rows,
  });

  return html.replace(
    '</body>',
    `<style>
      body { background: #f3f4f6; }
      .wrapper {
        width: 210mm;
        min-height: 297mm;
        margin: 16px auto;
        background: #fff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
      }
      .print-button {
        position: fixed;
        right: 24px;
        bottom: 24px;
        border: 0;
        border-radius: 12px;
        padding: 12px 20px;
        background: #111827;
        color: #fff;
        font: 600 14px Sarabun, sans-serif;
        cursor: pointer;
      }
      @media print {
        body { background: #fff; }
        .wrapper { width: auto; min-height: 0; margin: 0; box-shadow: none; }
        .print-button { display: none; }
      }
    </style>
    <button class="print-button" onclick="window.print()">พิมพ์รายงาน</button>
    </body>`,
  );
}

export async function downloadProfitLossPdf({
  rows,
  totals,
  startDate,
  endDate,
  viewMode,
  onProgress,
}: {
  rows: ProfitLossRow[];
  totals: ProfitLossTotals;
  startDate: string;
  endDate: string;
  viewMode: ViewMode;
  onProgress?: (completed: number, total: number) => void;
}): Promise<void> {
  const pages = buildProfitLossPdfPages(rows);
  const total = Math.max(pages.length, 1);
  onProgress?.(0, total);
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
      chartRows: rows,
    });

    const canvas = await renderHtmlToCanvas(html);
    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    const drawHeight = Math.min(imgHeight, availableHeight);

    if (index > 0) {
      doc.addPage();
    }

    doc.addImage(imgData, 'PNG', 0, pageMarginTop, pdfWidth, drawHeight);
    onProgress?.(index + 1, total);
  }

  doc.save(`profit-loss-${startDate}-to-${endDate}.pdf`);
}
