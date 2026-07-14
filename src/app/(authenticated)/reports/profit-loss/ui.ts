import type { ViewMode } from './types';

export function getViewModeLabel(viewMode: ViewMode): string {
  if (viewMode === 'monthly') return 'รายเดือน';
  if (viewMode === 'weekly') return 'รายสัปดาห์';
  return 'รายวัน';
}

export function getExportPdfButtonText(exportingPdf: boolean): string {
  return exportingPdf ? 'กำลังสร้าง PDF...' : 'Export PDF';
}

export function getExportExcelButtonText(exportingExcel: boolean): string {
  return exportingExcel ? 'กำลังสร้าง Excel...' : 'Export Excel';
}

export function isExportDisabled({
  hasRows,
  loading,
  exportBusy,
}: {
  hasRows: boolean;
  loading: boolean;
  exportBusy: boolean;
}): boolean {
  return !hasRows || loading || exportBusy;
}

export function getNetResultLabel(net: number): 'Profit' | 'Loss' {
  return net >= 0 ? 'Profit' : 'Loss';
}
