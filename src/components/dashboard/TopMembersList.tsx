'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';

interface TopMembersListProps {
  topMembers: any[];
}

export default function TopMembersList({ topMembers }: TopMembersListProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </span>
            สมาชิกที่รับซื้อมากที่สุด
          </h2>
          {topMembers.length > 0 && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              เดือนนี้
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 p-4 min-h-0">
        {topMembers.length > 0 ? (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {topMembers.map((item: any, index: number) => (
              <div
                key={item.member?.id}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                      index === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                        : index === 1
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                        : index === 2
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                        : 'bg-gradient-to-br from-gray-400 to-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {item.member?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      น้ำหนัก: <span className="font-semibold">{formatNumber(item.totalWeight)}</span> กก.
                    </p>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="font-bold text-base text-green-600 dark:text-green-400">
                    {formatCurrency(item.totalAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">ยังไม่มีข้อมูล</p>
          </div>
        )}
      </div>
    </div>
  );
}

