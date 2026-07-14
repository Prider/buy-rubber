import type { ViewMode } from './types';

export function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function periodLabel(period: string, mode: ViewMode): string {
  if (mode === 'monthly') {
    const [year, month] = period.split('-').map(Number);
    return new Date(year, (month || 1) - 1, 1).toLocaleDateString('th-TH', {
      month: 'short',
      year: 'numeric',
    });
  }
  if (mode === 'weekly') {
    const [year, month, day] = period.split('-').map(Number);
    const start = new Date(year, (month || 1) - 1, day || 1);
    const end = new Date(year, (month || 1) - 1, (day || 1) + 6);
    const fmt = (date: Date) =>
      date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  }
  return new Date(period).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
}

export function isDateRangeInvalid(startDate: string, endDate: string): boolean {
  return new Date(startDate) > new Date(endDate);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
