'use client';

import { MemberHistoryRow } from '@/types/memberHistory';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface HistoryTableProps {
  rows: MemberHistoryRow[];
  totalCount?: number;
}

const TRANSACTION_TONES = [
  {
    row: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800',
    edge: 'border-l-4 border-l-blue-600 dark:border-l-blue-300',
  },
  {
    row: 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800',
    edge: 'border-l-4 border-l-amber-600 dark:border-l-amber-300',
  },
  {
    row: 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-800',
    edge: 'border-l-4 border-l-emerald-600 dark:border-l-emerald-300',
  },
  {
    row: 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-900 dark:hover:bg-rose-800',
    edge: 'border-l-4 border-l-rose-600 dark:border-l-rose-300',
  },
  {
    row: 'bg-violet-100 hover:bg-violet-200 dark:bg-violet-900 dark:hover:bg-violet-800',
    edge: 'border-l-4 border-l-violet-600 dark:border-l-violet-300',
  },
  {
    row: 'bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-800 dark:hover:bg-cyan-700',
    edge: 'border-l-4 border-l-cyan-600 dark:border-l-cyan-200',
  },
];

function transactionToneIndex(rows: MemberHistoryRow[]): number[] {
  const toneByPurchaseNo = new Map<string, number>();
  let nextTone = 0;

  return rows.map((row) => {
    const key = row.purchaseNo || `${row.kind}:${row.id}`;
    const existing = toneByPurchaseNo.get(key);
    if (existing != null) return existing;

    const tone = nextTone % TRANSACTION_TONES.length;
    toneByPurchaseNo.set(key, tone);
    nextTone += 1;
    return tone;
  });
}

function HistoryDateCell({ value, hideTimeWhenDateOnly }: { value: string; hideTimeWhenDateOnly?: boolean }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <>–</>;

  const day = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(date);

  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  const isDateOnly =
    hideTimeWhenDateOnly &&
    ((localHours === 7 && localMinutes === 0) ||
      (value.includes('T00:00:00') && localHours === 7));

  if (isDateOnly) {
    return <div className="leading-tight">{day}</div>;
  }

  const time = new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return (
    <>
      <div className="leading-tight">{day}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
    </>
  );
}

export const HistoryTable = ({ rows, totalCount }: HistoryTableProps) => {
  const toneIndexes = transactionToneIndex(rows);

  return (
    <div className="bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">รายการ</h3>
        <span className="text-xs text-gray-600 dark:text-gray-300">ทั้งหมด {totalCount ?? rows.length} รายการ</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">วันที่</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">ประเภท</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">เลขที่</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">รายการ</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-200">น้ำหนักสุทธิ</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-200">ราคา/กก.</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-red-600 dark:text-red-400">หักความชื้น</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-200">จำนวนเงิน</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {rows.map((row, index) => {
            const isPurchase = row.kind === 'purchase';
            const tone = TRANSACTION_TONES[toneIndexes[index]];
            return (
              <tr
                key={`${row.kind}-${row.id}`}
                className={`transition-colors ${tone.row}`}
              >
                <td className={`whitespace-nowrap px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ${tone.edge}`}>
                  <HistoryDateCell value={isPurchase ? row.date : row.createdAt || row.date} hideTimeWhenDateOnly={!isPurchase} />
                </td>
                <td className="px-3 py-2 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      isPurchase
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
                        : 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200'
                    }`}
                  >
                    {isPurchase ? 'รับซื้อ' : 'ค่าบริการ'}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">{row.purchaseNo || '–'}</td>
                <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{row.label || '–'}</td>
                <td className="px-3 py-2 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                  {row.netWeight == null ? '–' : `${formatNumber(row.netWeight)} กก.`}
                </td>
                <td className="px-3 py-2 text-right text-sm text-gray-900 dark:text-gray-100">
                  {row.unitPrice == null ? '–' : formatNumber(row.unitPrice)}
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium tabular-nums text-red-600 dark:text-red-400">
                  {row.moisturePercent == null ? '–' : formatNumber(row.moisturePercent)}
                </td>
                <td
                  className={`px-3 py-2 text-right text-sm font-bold tabular-nums ${
                    isPurchase ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {formatCurrency(row.amount)}
                </td>
                <td className="max-w-[12rem] truncate px-3 py-2 text-sm text-gray-600 dark:text-gray-400" title={row.notes || undefined}>
                  {row.notes || '–'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
  );
};
