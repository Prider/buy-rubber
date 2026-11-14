'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { expensePieSlices, formatExpenseShare, type ExpensePieSlice } from './expensePieSlices';
import { formatCurrency } from './utils';
import { ReportType } from '@/hooks/useReportData';
import {
  categoryBreakdownCopy,
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

function hexToRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function drawPieWedge(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number,
  color: string,
) {
  const [red, green, blue] = hexToRgb(color);
  doc.setFillColor(red, green, blue);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  const sweep = end - start;
  if (sweep >= Math.PI * 2 - 0.0001) {
    doc.circle(cx, cy, radius, 'FD');
    return;
  }

  const steps = Math.max(12, Math.ceil((sweep * 180) / Math.PI / 8));
  doc.moveTo(cx, cy);
  for (let step = 0; step <= steps; step += 1) {
    const angle = start + (sweep * step) / steps;
    doc.lineTo(cx + radius * Math.cos(angle), cy - radius * Math.sin(angle));
  }
  doc.lineTo(cx, cy);
  doc.fillStroke();
}

function drawExpensePieBlock(
  doc: jsPDF,
  slices: ExpensePieSlice[],
  totalCount: number,
  y: number,
): number {
  const width = doc.internal.pageSize.getWidth();
  const left = 8;
  const right = width - 8;
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const legendHeight = slices.length * 8;
  const height = 8 + Math.max(42, legendHeight) + 4;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  doc.roundedRect(left, y, width - 16, height, 2, 2, 'S');

  doc.setFont(FONT_NAME, 'normal');
  doc.setFontSize(11);
  doc.setTextColor(225, 29, 72);
  doc.text('ค่าใช้จ่ายตามหมวด', left + 3, y + 6);

  doc.setFontSize(9);
  const totalLabel = formatCurrency(total);
  const detail = `จำนวนรายการ ${totalCount.toLocaleString('th-TH')}`;
  doc.setTextColor(17, 24, 39);
  doc.text(totalLabel, right - 3, y + 6, { align: 'right' });
  doc.setTextColor(75, 85, 99);
  doc.text(detail, right - 3 - doc.getTextWidth(totalLabel) - 4, y + 6, { align: 'right' });

  const radius = 16;
  const cx = left + 24;
  const cy = y + 12 + radius;
  let angle = 0;
  slices.forEach((slice) => {
    const sweep = (slice.percent / 100) * Math.PI * 2;
    drawPieWedge(doc, cx, cy, radius, angle, angle + sweep, slice.color);
    angle += sweep;
  });

  let legendY = y + 14;
  const legendX = cx + radius + 8;
  slices.forEach((slice) => {
    const [red, green, blue] = hexToRgb(slice.color);
    doc.setFillColor(red, green, blue);
    doc.rect(legendX, legendY - 2.2, 2.4, 2.4, 'F');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(slice.category, legendX + 4, legendY);
    doc.setTextColor(55, 65, 81);
    doc.text(
      `${formatCurrency(slice.amount)} · ${formatExpenseShare(slice.percent)}`,
      legendX + 4,
      legendY + 4,
    );
    legendY += 8;
  });

  return height;
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
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

  onProgress?.(0, 2);
  const fontBase64 = await loadSarabunBase64();
  await waitForPaint();
  onProgress?.(1, 2);

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

  const pieSlices = reportType === 'expense_summary' ? expensePieSlices(expenseSummary) : [];
  const pieHeight =
    pieSlices.length > 0
      ? drawExpensePieBlock(doc, pieSlices, totalCount ?? data.length, 20) + 4
      : 0;

  autoTable(doc, {
    head: [columns.map((column) => column.header)],
    body: data.map((row) => columns.map((column) => column.value(row))),
    startY: 22 + pieHeight,
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
  const breakdown = categoryBreakdownCopy(reportType);
  const expenseRows = breakdown ? expenseSummary : [];
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
      head: [[breakdown?.categoryHeader ?? 'หมวด', 'จำนวนรายการ', 'ยอดรวม']],
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

  onProgress?.(2, 2);
  const fileName = `${reportTitle}_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
