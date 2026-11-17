export const EXPENSE_SLICE_COLORS = [
  '#e11d48',
  '#f59e0b',
  '#8b5cf6',
  '#0ea5e9',
  '#10b981',
  '#f97316',
  '#ec4899',
  '#6366f1',
];

export const SALES_SLICE_COLORS = [
  '#059669',
  '#0d9488',
  '#0284c7',
  '#65a30d',
  '#0891b2',
  '#4f46e5',
  '#16a34a',
  '#0f766e',
];

const percentFormat = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

export interface ExpensePieSlice {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

export function formatExpenseShare(percent: number): string {
  return `${percentFormat.format(percent)}%`;
}

export function expensePieSlices(
  items: Array<{ category: string; totalAmount: number }>,
  colors: readonly string[] = EXPENSE_SLICE_COLORS,
): ExpensePieSlice[] {
  const entries = items
    .filter((item) => item.totalAmount > 0)
    .map((item) => ({ category: item.category || 'ค่าใช้จ่าย', amount: item.totalAmount }))
    .sort((a, b) => b.amount - a.amount);
  const total = entries.reduce((sum, item) => sum + item.amount, 0);
  if (total <= 0) return [];

  return entries.map((item, index) => ({
    category: item.category,
    amount: item.amount,
    percent: (item.amount / total) * 100,
    color: colors[index % colors.length],
  }));
}

function point(cx: number, cy: number, radius: number, angle: number): [number, number] {
  return [cx + radius * Math.cos(angle), cy - radius * Math.sin(angle)];
}

export function expensePieWedgePath(
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number,
): string {
  const sweep = end - start;
  if (sweep >= Math.PI * 2 - 0.0001) {
    return [
      `M ${cx - radius} ${cy}`,
      `A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy}`,
      `A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy}`,
      'Z',
    ].join(' ');
  }

  const [x1, y1] = point(cx, cy, radius, start);
  const [x2, y2] = point(cx, cy, radius, end);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} 0 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

export function expensePieSvg(slices: ExpensePieSlice[]): string {
  const size = 160;
  const center = size / 2;
  const radius = 62;
  let angle = 0;
  const wedges = slices
    .map((slice) => {
      const sweep = (slice.percent / 100) * Math.PI * 2;
      const path = expensePieWedgePath(center, center, radius, angle, angle + sweep);
      angle += sweep;
      return `<path d="${path}" fill="${slice.color}" stroke="#ffffff" stroke-width="2" />`;
    })
    .join('');

  return `<svg viewBox="0 0 ${size} ${size}" width="148" height="148" aria-hidden="true">${wedges}</svg>`;
}
