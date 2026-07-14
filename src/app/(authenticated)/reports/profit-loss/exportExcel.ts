import type { ProfitLossRow, ProfitLossTotals, ViewMode } from './types';
import { downloadBlob, periodLabel } from './utils';

export function buildProfitLossExcelHtml({
  rows,
  totals,
  viewMode,
}: {
  rows: ProfitLossRow[];
  totals: ProfitLossTotals;
  viewMode: ViewMode;
}): string {
  const tableRows = rows
    .map(
      (row) => `
          <tr>
            <td>${periodLabel(row.period, viewMode)}</td>
            <td>${row.sales.toFixed(2)}</td>
            <td>${row.purchases.toFixed(2)}</td>
            <td>${row.expenses.toFixed(2)}</td>
            <td>${row.net.toFixed(2)}</td>
          </tr>
        `
    )
    .join('');

  return `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <table border="1">
            <thead>
              <tr>
                <th>Period</th>
                <th>Sales</th>
                <th>Purchases</th>
                <th>Expenses</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr>
                <td><b>Total</b></td>
                <td><b>${totals.sales.toFixed(2)}</b></td>
                <td><b>${totals.purchases.toFixed(2)}</b></td>
                <td><b>${totals.expenses.toFixed(2)}</b></td>
                <td><b>${totals.net.toFixed(2)}</b></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
}

export function downloadProfitLossExcel({
  rows,
  totals,
  viewMode,
  startDate,
  endDate,
}: {
  rows: ProfitLossRow[];
  totals: ProfitLossTotals;
  viewMode: ViewMode;
  startDate: string;
  endDate: string;
}): void {
  const html = buildProfitLossExcelHtml({ rows, totals, viewMode });
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, `profit-loss-${startDate}-to-${endDate}.xls`);
}
