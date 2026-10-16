const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] as const;

export interface TrendAmountRow {
  date: Date | string;
  totalAmount: number | null;
}

export interface TrendPoint {
  date: string;
  label: string;
  purchaseAmount: number;
  saleAmount: number;
}

export function thailandDateKey(date: Date): string {
  const shifted = new Date(date.getTime() + THAILAND_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildSevenDayTrend(
  todayStartUtc: Date,
  purchases: TrendAmountRow[],
  sales: TrendAmountRow[],
): TrendPoint[] {
  const points: TrendPoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const start = new Date(todayStartUtc.getTime() - offset * DAY_MS);
    const shifted = new Date(start.getTime() + THAILAND_OFFSET_MS);
    points.push({
      date: thailandDateKey(start),
      label: WEEKDAY_TH[shifted.getUTCDay()],
      purchaseAmount: 0,
      saleAmount: 0,
    });
  }

  const byDate = new Map(points.map((point) => [point.date, point]));

  for (const row of purchases) {
    const point = byDate.get(thailandDateKey(new Date(row.date)));
    if (point) point.purchaseAmount += Number(row.totalAmount) || 0;
  }

  for (const row of sales) {
    const point = byDate.get(thailandDateKey(new Date(row.date)));
    if (point) point.saleAmount += Number(row.totalAmount) || 0;
  }

  return points;
}
