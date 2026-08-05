import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { GangExportProduct, GangExportRow, GangExportSummary } from './exportExcel';
import { formatGangDate } from './exportExcel';

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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function generateGangsPdfHtml({
  rows,
  summary,
  product,
  printedAt = new Date(),
}: {
  rows: GangExportRow[];
  summary: GangExportSummary;
  product: GangExportProduct;
  printedAt?: Date;
}): string {
  const printedDate = printedAt.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const netLabel = summary.profitLoss >= 0 ? 'Net Profit' : 'Net Loss';

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>กอง ${row.gangNo}</td>
          <td>${escapeHtml(formatGangDate(row.startDate))}</td>
          <td>${escapeHtml(row.endDate ? formatGangDate(row.endDate) : 'กำลังดำเนินอยู่')}</td>
          <td class="number">${formatNumber(row.soldKg)}</td>
          <td class="number">${formatCurrency(row.revenue)}</td>
          <td class="number">${formatCurrency(row.cogs)}</td>
          <td class="number">${formatCurrency(row.profitLoss)}</td>
        </tr>
      `,
    )
    .join('');

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
          <h1>รายงานกำไร / ขาดทุนต่อกอง</h1>
          <p class="subtitle">Profit &amp; Loss by Stock Cycle</p>
          <div class="meta">
            <span><strong>สินค้า:</strong> ${escapeHtml(product.code)} - ${escapeHtml(product.name)}</span>
            <span><strong>จำนวนกอง:</strong> ${rows.length}</span>
            <span><strong>วันที่จัดทำ:</strong> ${printedDate}</span>
          </div>

          <div class="summary">
            <p class="summary-label">ผลลัพธ์สุทธิของกองที่แสดง (รายได้ - ต้นทุน)</p>
            <p class="summary-value">${netLabel}: ${formatCurrency(summary.profitLoss)}</p>
            <div class="summary-grid">
              <span><strong>ขายได้:</strong> ${formatNumber(summary.soldKg)} กก.</span>
              <span><strong>รายได้:</strong> ${formatCurrency(summary.revenue)}</span>
              <span><strong>ต้นทุน:</strong> ${formatCurrency(summary.cogs)}</span>
            </div>
          </div>

          <p class="section-title">รายการกอง</p>
          <table>
            <thead>
              <tr>
                <th>กอง</th>
                <th>เริ่ม</th>
                <th>จบ</th>
                <th>ขายได้ (kg)</th>
                <th>รายได้</th>
                <th>ต้นทุน</th>
                <th>กำไร/ขาดทุน</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total">
                <td colspan="3">รวม</td>
                <td class="number">${formatNumber(summary.soldKg)}</td>
                <td class="number">${formatCurrency(summary.revenue)}</td>
                <td class="number">${formatCurrency(summary.cogs)}</td>
                <td class="number">${formatCurrency(summary.profitLoss)}</td>
              </tr>
            </tbody>
          </table>

          <footer>รายงานจัดทำโดยระบบจัดการรับซื้อยาง</footer>
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

export async function downloadGangsPdf({
  rows,
  summary,
  product,
}: {
  rows: GangExportRow[];
  summary: GangExportSummary;
  product: GangExportProduct;
}): Promise<void> {
  const html = generateGangsPdfHtml({ rows, summary, product });
  const canvas = await renderHtmlToCanvas(html);
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageMarginTop = 10;
  const pageMarginBottom = 10;
  const pdfWidth = doc.internal.pageSize.getWidth();
  const availableHeight = doc.internal.pageSize.getHeight() - pageMarginTop - pageMarginBottom;
  const imgData = canvas.toDataURL('image/png');
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  const drawHeight = Math.min(imgHeight, availableHeight);

  doc.addImage(imgData, 'PNG', 0, pageMarginTop, pdfWidth, drawHeight);

  const safeCode = product.code.replace(/[^\w.-]+/g, '_') || 'product';
  doc.save(`profit-loss-gangs-${safeCode}.pdf`);
}
