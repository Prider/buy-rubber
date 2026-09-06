import { downloadBlob } from '../utils';

export type GangExportRow = {
  gangNo: number;
  startDate: string | Date;
  endDate: string | Date | null;
  soldKg: number;
  revenue: number;
  cogs: number;
  profitLoss: number;
  salesCount: number;
};

export type GangExportSummary = {
  soldKg: number;
  revenue: number;
  cogs: number;
  profitLoss: number;
};

export type GangExportProduct = {
  code: string;
  name: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function formatGangDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const timeStr = d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${dateStr} ${timeStr}`;
}

export function buildGangsExcelHtml({
  rows,
  summary,
  product,
}: {
  rows: GangExportRow[];
  summary: GangExportSummary;
  product: GangExportProduct;
}): string {
  const tableRows = rows
    .map(
      (row) => `
          <tr>
            <td>${row.gangNo}</td>
            <td>${escapeHtml(formatGangDate(row.startDate))}</td>
            <td>${escapeHtml(row.endDate ? formatGangDate(row.endDate) : 'กำลังดำเนินอยู่')}</td>
            <td>${Number(row.soldKg).toFixed(2)}</td>
            <td>${Number(row.revenue).toFixed(2)}</td>
            <td>${Number(row.cogs).toFixed(2)}</td>
            <td>${Number(row.profitLoss).toFixed(2)}</td>
            <td>${row.salesCount}</td>
          </tr>
        `,
    )
    .join('');

  return `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <h2>รายงานกำไร / ขาดทุนต่อกอง</h2>
          <p>สินค้า: ${escapeHtml(product.code)} - ${escapeHtml(product.name)}</p>
          <table border="1">
            <thead>
              <tr>
                <th>กอง</th>
                <th>เริ่ม</th>
                <th>จบ</th>
                <th>ขายได้ (kg)</th>
                <th>รายได้</th>
                <th>ต้นทุน</th>
                <th>กำไร/ขาดทุน</th>
                <th>จำนวนรายการขาย</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr>
                <td colspan="3"><b>รวม</b></td>
                <td><b>${Number(summary.soldKg).toFixed(2)}</b></td>
                <td><b>${Number(summary.revenue).toFixed(2)}</b></td>
                <td><b>${Number(summary.cogs).toFixed(2)}</b></td>
                <td><b>${Number(summary.profitLoss).toFixed(2)}</b></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
}

export function downloadGangsExcel({
  rows,
  summary,
  product,
}: {
  rows: GangExportRow[];
  summary: GangExportSummary;
  product: GangExportProduct;
}): void {
  const html = buildGangsExcelHtml({ rows, summary, product });
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const safeCode = product.code.replace(/[^\w.-]+/g, '_') || 'product';
  downloadBlob(blob, `profit-loss-gangs-${safeCode}.xls`);
}
