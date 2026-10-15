import { ReportType } from '@/hooks/useReportData';
import { formatCurrency } from './utils';
import {
  reportColumns,
  reportRangeLabel,
  reportSummaryLines,
  ReportExpenseSummary,
} from './reportDocument';

interface PrintPreviewParams {
  reportTitle: string;
  reportType: ReportType;
  rows: any[];
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalWeight: number;
  totalCount: number;
  expenseSummary?: ReportExpenseSummary[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTable(headers: string[], aligns: Array<'left' | 'right'>, body: string[][]): string {
  const head = headers
    .map((header, index) => `<th class="${aligns[index]}">${escapeHtml(header)}</th>`)
    .join('');
  const rows = body
    .map(
      (row) =>
        `<tr>${row
          .map((cell, index) => `<td class="${aligns[index]}">${escapeHtml(cell)}</td>`)
          .join('')}</tr>`,
    )
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function generatePrintPreviewHTML({
  reportTitle,
  reportType,
  rows,
  startDate,
  endDate,
  totalAmount,
  totalWeight,
  totalCount,
  expenseSummary = [],
}: PrintPreviewParams): string {
  const columns = reportColumns(reportType);
  const summary = reportSummaryLines(reportType, totalAmount, totalWeight, totalCount);
  const table = renderTable(
    columns.map((column) => column.header),
    columns.map((column) => column.align),
    rows.map((row) => columns.map((column) => column.value(row))),
  );
  const expenseTable =
    reportType === 'expense_summary' && expenseSummary.length > 0
      ? `<h2>สรุปตามหมวดค่าใช้จ่าย</h2>${renderTable(
          ['หมวดค่าใช้จ่าย', 'จำนวนรายการ', 'ยอดรวม'],
          ['left', 'right', 'right'],
          expenseSummary.map((item) => [
            item.category,
            item.count.toLocaleString('th-TH'),
            formatCurrency(item.totalAmount),
          ]),
        )}`
      : '';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f3f4f6;
      color: #111827;
      font-family: Sarabun, "TH Sarabun New", sans-serif;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      padding: 10mm 8mm 12mm;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }
    h1 {
      margin: 0;
      text-align: center;
      font-size: 18px;
      font-weight: 600;
    }
    .range {
      margin: 4px 0 14px;
      text-align: center;
      font-size: 12px;
      color: #374151;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 4px 6px;
      vertical-align: top;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
      text-align: left;
    }
    th.right, td.right { text-align: right; }
    .summary { margin-top: 14px; }
    .summary h2, h2 {
      margin: 14px 0 6px;
      font-size: 13px;
      font-weight: 600;
    }
    .summary p { margin: 2px 0; font-size: 12px; }
    footer {
      margin-top: 18px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
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
      .sheet { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; }
      .print-button { display: none; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <article class="sheet">
    <h1>${escapeHtml(reportTitle)}</h1>
    <p class="range">${escapeHtml(reportRangeLabel(startDate, endDate))}</p>
    ${table}
    <section class="summary">
      <h2>สรุปผลรวม</h2>
      ${summary.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
    </section>
    ${expenseTable}
    <footer>รายงานจัดทำโดยระบบจัดการรับซื้อยาง</footer>
  </article>
  <button class="print-button" onclick="window.print()">พิมพ์รายงาน</button>
</body>
</html>`;
}
