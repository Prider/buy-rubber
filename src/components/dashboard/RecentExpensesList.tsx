'use client';

interface RecentExpensesListProps {
  expenses: any[];
}

export default function RecentExpensesList({ expenses }: RecentExpensesListProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ค่าน้ำมัน':
        return '⛽';
      case 'ค่าซ่อมรถ':
        return '🔧';
      case 'ค่าคนงาน':
        return '👷';
      case 'อื่นๆ':
        return '📦';
      default:
        return '💰';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} ${timeStr}`;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 px-3 py-3 dark:border-gray-700 dark:from-red-900/20 dark:to-orange-900/20 sm:px-4">
        <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white sm:text-base">
          ค่าใช้จ่ายล่าสุด
        </h3>
      </div>
      <div className="flex-1 min-h-0 max-h-[360px] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {expenses.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีค่าใช้จ่าย</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-orange-100 text-sm dark:from-red-900/30 dark:to-orange-900/30">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                      {expense.category}
                    </p>
                    <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400 sm:text-base">
                    {formatCurrency(expense.amount)}
                  </p>
                  {expense.description && (
                    <p className="max-w-[7.5rem] truncate text-[10px] text-gray-500 dark:text-gray-400 sm:max-w-[9rem]">
                      {expense.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
