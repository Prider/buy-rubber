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
      <div className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 px-2.5 py-2 dark:border-gray-700 dark:from-red-900/20 dark:to-orange-900/20 sm:px-3">
        <h3 className="flex min-w-0 items-center gap-2 truncate text-base font-bold text-gray-950 dark:text-white">
          <span className="shrink-0 rounded-lg bg-red-100 p-1.5 dark:bg-red-900/30">
            <svg className="h-6 w-6 text-red-800 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
          <span className="truncate">ค่าใช้จ่ายล่าสุด</span>
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
            <div key={expense.id} className="px-2.5 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:px-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-orange-100 text-lg dark:from-red-900/30 dark:to-orange-900/30">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-950 dark:text-white">
                      {expense.category}
                    </p>
                    <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-extrabold tabular-nums tracking-tight text-red-900 dark:text-red-100">
                    {formatCurrency(expense.amount)}
                  </p>
                  {expense.description && (
                    <p className="max-w-[7.5rem] truncate text-xs font-medium text-gray-700 dark:text-gray-200 sm:max-w-[9rem]">
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
