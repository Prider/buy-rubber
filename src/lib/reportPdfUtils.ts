'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export function downloadReportPDF({
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

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(reportTitle, pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const printedDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rangeLabel = `ช่วงวันที่: ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`;
  doc.text(rangeLabel, 14, 26);
  doc.text(`วันที่จัดทำรายงาน: ${printedDate}`, 14, 32);

  let tableHead: string[] = [];
  let tableBody: any[][] = [];

  if (reportType === 'daily_purchase') {
    tableHead = ['วันที่', 'เลขที่', 'สมาชิก', 'น้ำหนัก (กก.)', 'ยอดเงิน'];
    tableBody = data.map((item: any) => [
      new Date(item.date).toLocaleDateString('th-TH'),
      item.purchaseNo,
      item.member?.name || '-',
      formatNumber(item.dryWeight),
      formatCurrency(item.totalAmount),
    ]);
  } else if (reportType === 'member_summary') {
    tableHead = ['สมาชิก', 'จำนวนครั้ง', 'น้ำหนักรวม (กก.)', 'ยอดเงินรวม'];
    tableBody = data.map((item: any) => [
      item.member?.name || '-',
      item.count.toLocaleString('th-TH'),
      formatNumber(item.totalWeight),
      formatCurrency(item.totalAmount),
    ]);
  } else if (reportType === 'expense_summary') {
    tableHead = ['วันที่', 'เลขที่', 'หมวดค่าใช้จ่าย', 'รายละเอียด', 'จำนวนเงิน'];
    tableBody = data.map((item: any) => [
      new Date(item.date || item.createdAt).toLocaleDateString('th-TH'),
      item.expenseNo,
      item.category,
      item.description || '-',
      formatCurrency(item.amount || 0),
    ]);
  }

  autoTable(doc, {
    head: [tableHead],
    body: tableBody,
    startY: 38,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles:
      reportType === 'daily_purchase'
        ? {
            3: { halign: 'right' },
            4: { halign: 'right' },
          }
        : reportType === 'member_summary'
        ? {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
          }
        : {
            4: { halign: 'right' },
          },
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 38;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('สรุปผลรวม', 14, finalY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`จำนวนรายการ: ${data.length.toLocaleString('th-TH')} รายการ`, 14, finalY + 16);
  doc.text(`ยอดรวม: ${formatCurrency(totalAmount)}`, 14, finalY + 22);

  if (reportType !== 'expense_summary') {
    doc.text(`น้ำหนักรวม: ${formatNumber(totalWeight)} กิโลกรัม`, 14, finalY + 28);
    finalY += 36;
  } else {
    finalY += 28;
    if (expenseSummary.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('สรุปตามหมวดค่าใช้จ่าย', 14, finalY + 10);
      doc.setFont('helvetica', 'normal');
      autoTable(doc, {
        head: [['หมวดค่าใช้จ่าย', 'จำนวนรายการ', 'ยอดรวม']],
        body: expenseSummary.map((summary) => [
          summary.category,
          summary.count.toLocaleString('th-TH'),
          formatCurrency(summary.totalAmount),
        ]),
        startY: finalY + 16,
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
        },
      });
      finalY = (doc as any).lastAutoTable?.finalY || finalY + 16;
    }
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('รายงานจัดทำโดยระบบจัดการรับซื้อยาง', pageWidth / 2, doc.internal.pageSize.getHeight() - 15, {
    align: 'center',
  });

  const fileName = `${reportTitle}_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
