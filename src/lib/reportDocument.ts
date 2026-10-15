import { formatCurrency, formatNumber, formatReportDateTime } from './utils';
import { ReportType } from '@/hooks/useReportData';
import { isDailyPurchaseReport, isSellSummaryReport } from '@/lib/reportProductTypeGroups';

export interface ReportExpenseSummary {
  category: string;
  totalAmount: number;
  count: number;
}

export type ReportColumnAlign = 'left' | 'right';

export interface ReportColumn {
  header: string;
  align: ReportColumnAlign;
  value: (row: any) => string;
}

export function reportRangeLabel(startDate: string, endDate: string): string {
  return `ช่วงวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`;
}

export function reportColumns(reportType: ReportType): ReportColumn[] {
  if (isDailyPurchaseReport(reportType)) {
    return [
      { header: 'เลขที่', align: 'left', value: (row) => row.purchaseNo || '-' },
      { header: 'วันที่', align: 'left', value: (row) => formatReportDateTime(row.date) },
      { header: 'สมาชิก', align: 'left', value: (row) => row.member?.name || '-' },
      { header: 'ประเภทสินค้า', align: 'left', value: (row) => row.productType?.name || '-' },
      { header: 'น้ำหนัก (กก.)', align: 'right', value: (row) => formatNumber(row.dryWeight) },
      {
        header: 'ราคา/กก.',
        align: 'right',
        value: (row) => formatNumber(row.dryWeight ? row.totalAmount / row.dryWeight : 0),
      },
      { header: 'ยอดเงิน', align: 'right', value: (row) => formatCurrency(row.totalAmount) },
    ];
  }

  if (isSellSummaryReport(reportType)) {
    return [
      { header: 'เลขที่', align: 'left', value: (row) => row.saleNo || '-' },
      { header: 'วันที่', align: 'left', value: (row) => new Date(row.date).toLocaleDateString('th-TH') },
      { header: 'บริษัท', align: 'left', value: (row) => row.companyName || '-' },
      { header: 'ประเภทสินค้า', align: 'left', value: (row) => row.productType?.name || '-' },
      { header: 'น้ำหนัก (กก.)', align: 'right', value: (row) => formatNumber(row.weight) },
      {
        header: 'ราคา/กก.',
        align: 'right',
        value: (row) => formatNumber(row.pricePerUnit ?? (row.weight ? row.totalAmount / row.weight : 0)),
      },
      { header: 'ยอดเงิน', align: 'right', value: (row) => formatCurrency(row.totalAmount) },
    ];
  }

  if (reportType === 'member_summary') {
    return [
      { header: 'สมาชิก', align: 'left', value: (row) => row.member?.name || '-' },
      { header: 'จำนวนครั้ง', align: 'right', value: (row) => Number(row.count || 0).toLocaleString('th-TH') },
      { header: 'น้ำหนักรวม (กก.)', align: 'right', value: (row) => formatNumber(row.totalWeight) },
      { header: 'ยอดเงินรวม', align: 'right', value: (row) => formatCurrency(row.totalAmount) },
    ];
  }

  return [
    {
      header: 'วันที่',
      align: 'left',
      value: (row) => new Date(row.date || row.createdAt).toLocaleDateString('th-TH'),
    },
    { header: 'เลขที่', align: 'left', value: (row) => row.expenseNo || '-' },
    { header: 'หมวดค่าใช้จ่าย', align: 'left', value: (row) => row.category || '-' },
    { header: 'รายละเอียด', align: 'left', value: (row) => row.description || '-' },
    { header: 'จำนวนเงิน', align: 'right', value: (row) => formatCurrency(row.amount || 0) },
  ];
}

export function reportSummaryLines(
  reportType: ReportType,
  totalAmount: number,
  totalWeight: number,
  dataLength: number,
): string[] {
  const lines = [
    `จำนวนรายการ: ${dataLength.toLocaleString('th-TH')} รายการ`,
    `ยอดรวม: ${formatCurrency(totalAmount)}`,
  ];
  if (reportType !== 'expense_summary') {
    lines.push(`น้ำหนักรวม: ${formatNumber(totalWeight)} กิโลกรัม`);
  }
  if (isDailyPurchaseReport(reportType) || isSellSummaryReport(reportType)) {
    const averagePrice = totalWeight > 0 ? totalAmount / totalWeight : 0;
    lines.push(`ราคาเฉลี่ย: ${formatNumber(averagePrice)} บาท/กก.`);
  }
  return lines;
}
