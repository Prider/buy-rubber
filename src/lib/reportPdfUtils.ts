'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './utils';
import { ReportType } from '@/hooks/useReportData';
import {
  reportColumns,
  reportRangeLabel,
  reportSummaryLines,
  ReportExpenseSummary,
} from './reportDocument';

interface DownloadReportPDFParams {
  reportTitle: string;
  reportType: ReportType;
  data: any[];
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalWeight: number;
  totalCount?: number;
  expenseSummary?: ReportExpenseSummary[];
  onProgress?: (completed: number, total: number) => void;
}

const FONT_NAME = 'Sarabun';

let fontBase64Promise: Promise<string> | null = null;

function loadSarabunBase64(): Promise<string> {
  if (!fontBase64Promise) {
    fontBase64Promise = fetch('/fonts/Sarabun-Regular.ttf')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load report font');
        return response.arrayBuffer();
      })
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let index = 0; index < bytes.length; index += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
        }
        return btoa(binary);
      });
  }
  return fontBase64Promise;
}

function drawPageChrome(doc: jsPDF, reportTitle: string, rangeLabel: string) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFont(FONT_NAME, 'normal');
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text(reportTitle, width / 2, 10, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text(rangeLabel, width / 2, 16, { align: 'center' });
}

export async function downloadReportPDF({
  reportTitle,
  reportType,
  data,
  startDate,
  endDate,
  totalAmount,
  totalWeight,
  totalCount,
  expenseSummary = [],
  onProgress,
}: DownloadReportPDFParams) {
  if (!Array.isArray(data) || data.length === 0) return;

  onProgress?.(0, 1);
  const fontBase64 = await loadSarabunBase64();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

  const doc = new jsPDF('p', 'mm', 'a4');
  doc.addFileToVFS('Sarabun-Regular.ttf', fontBase64);
  doc.addFont('Sarabun-Regular.ttf', FONT_NAME, 'normal');
  doc.setFont(FONT_NAME, 'normal');

  const columns = reportColumns(reportType);
  const rangeLabel = reportRangeLabel(startDate, endDate);
  const columnStyles: Record<number, { halign: 'right' }> = {};
  columns.forEach((column, index) => {
    if (column.align === 'right') columnStyles[index] = { halign: 'right' };
  });

  autoTable(doc, {
    head: [columns.map((column) => column.header)],
    body: data.map((row) => columns.map((column) => column.value(row))),
    startY: 22,
    margin: { top: 22, left: 8, right: 8, bottom: 12 },
    styles: {
      font: FONT_NAME,
      fontStyle: 'normal',
      fontSize: 8,
      cellPadding: 1.1,
      textColor: [17, 24, 39],
      lineColor: [209, 213, 219],
      lineWidth: 0.1,
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 24, 39],
      font: FONT_NAME,
      fontStyle: 'normal',
    },
    columnStyles,
    didDrawPage: () => {
      drawPageChrome(doc, reportTitle, rangeLabel);
    },
  });

  const lines = reportSummaryLines(reportType, totalAmount, totalWeight, totalCount ?? data.length);
  const expenseRows = reportType === 'expense_summary' ? expenseSummary : [];
  let cursorY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 22) + 6;
  const pageHeight = doc.internal.pageSize.getHeight();
  const needed = 8 + lines.length * 5 + (expenseRows.length > 0 ? 12 + (expenseRows.length + 1) * 6 : 0);
  if (cursorY + needed > pageHeight - 12) {
    doc.addPage();
    drawPageChrome(doc, reportTitle, rangeLabel);
    cursorY = 22;
  }

  doc.setFont(FONT_NAME, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('สรุปผลรวม', 8, cursorY);
  doc.setFontSize(9);
  lines.forEach((line, index) => {
    doc.text(line, 8, cursorY + 6 + index * 5);
  });

  if (expenseRows.length > 0) {
    autoTable(doc, {
      head: [['หมวดค่าใช้จ่าย', 'จำนวนรายการ', 'ยอดรวม']],
      body: expenseRows.map((item) => [
        item.category,
        item.count.toLocaleString('th-TH'),
        formatCurrency(item.totalAmount),
      ]),
      startY: cursorY + 8 + lines.length * 5,
      margin: { left: 8, right: 8, bottom: 12 },
      styles: {
        font: FONT_NAME,
        fontStyle: 'normal',
        fontSize: 8,
        cellPadding: 1.1,
        textColor: [17, 24, 39],
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 24, 39],
        font: FONT_NAME,
        fontStyle: 'normal',
      },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });
  }

  const pageCount = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`หน้า ${page}/${pageCount}`, width - 8, 16, { align: 'right' });
    doc.text('รายงานจัดทำโดยระบบจัดการรับซื้อยาง', width / 2, pageHeight - 6, { align: 'center' });
  }

  onProgress?.(1, 1);
  const fileName = `${reportTitle}_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
