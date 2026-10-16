export type DashboardPeriod = 'today' | 'month';

export interface PeriodBounds {
  todayStart: string;
  tomorrow: string;
  monthStart: string;
  nextMonth: string;
}

export function isWithinPeriod(
  date: string | Date,
  period: DashboardPeriod,
  bounds: PeriodBounds,
): boolean {
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return false;

  const start = new Date(period === 'today' ? bounds.todayStart : bounds.monthStart).getTime();
  const end = new Date(period === 'today' ? bounds.tomorrow : bounds.nextMonth).getTime();
  return time >= start && time < end;
}

export function productTypeMatches(
  record: { productTypeId?: string | null; productType?: { id?: string | null } | null },
  productTypeId: string | null,
): boolean {
  if (!productTypeId) return true;
  return record.productTypeId === productTypeId || record.productType?.id === productTypeId;
}
