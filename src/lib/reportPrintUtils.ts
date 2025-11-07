import { formatCurrency, formatNumber } from './utils';

export function generatePrintPreviewHTML(
  reportTitle: string,
  dateRange: string,
  tableContent: string,
  dataLength: number
): string {
  return `
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
          <span>จำนวนรายการ: ${dataLength} รายการ</span>
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
}

export function generateDailyPurchaseTableHTML(data: any[]): string {
  return `
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
}

export function generateMemberSummaryTableHTML(data: any[]): string {
  return `
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

export function generateExpenseTableHTML(data: any[], categorySummary: Array<{ category: string; totalAmount: number; count: number }>): string {
  return `
    <table>
      <thead>
        <tr>
          <th>วันที่</th>
          <th>เลขที่</th>
          <th>หมวดค่าใช้จ่าย</th>
          <th>รายละเอียด</th>
          <th>จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (expense: any) => `
          <tr>
            <td>${new Date(expense.date || expense.createdAt).toLocaleDateString('th-TH')}</td>
            <td>${expense.expenseNo}</td>
            <td>${expense.category}</td>
            <td>${expense.description || '-'}</td>
            <td style="text-align: right; font-weight: bold; color: #dc2626;">${formatCurrency(expense.amount || 0)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="text-align: right; font-weight: bold;">รวมทั้งหมด</td>
          <td style="text-align: right; font-weight: bold; color: #dc2626;">${formatCurrency(
            data.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0)
          )}</td>
        </tr>
      </tfoot>
    </table>
    ${categorySummary.length > 0
      ? `<div style="margin-top: 30px;">
        <h3 style="font-size: 18px; font-weight: bold; color: #047857; margin-bottom: 16px;">สรุปตามหมวดค่าใช้จ่าย</h3>
        <table>
          <thead>
            <tr>
              <th>หมวดค่าใช้จ่าย</th>
              <th>จำนวนรายการ</th>
              <th>ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            ${categorySummary
              .map(
                (summary) => `
              <tr>
                <td>${summary.category}</td>
                <td>${summary.count.toLocaleString('th-TH')}</td>
                <td style="text-align: right; font-weight: bold; color: #047857;">${formatCurrency(summary.totalAmount)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>`
      : ''}
  `;
}

