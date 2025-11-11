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
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          ค่าใช้จ่ายล่าสุด
        </h3>
      </div>
      <div className="flex-1 min-h-0 max-h-[360px] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {expenses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">ยังไม่มีค่าใช้จ่าย</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center text-lg">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {expense.category}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(expense.amount)}
                  </p>
                  {expense.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
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
