'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';

interface TopMembersListProps {
  topMembers: any[];
}

export default function TopMembersList({ topMembers }: TopMembersListProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-2.5 py-2 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800 sm:px-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex min-w-0 items-center gap-2 text-base font-bold text-gray-950 dark:text-white">
            <span className="shrink-0 rounded-lg bg-green-100 p-1.5 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-800 dark:text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </span>
            <span className="truncate">สมาชิกที่รับซื้อมากที่สุด</span>
          </h2>
          {topMembers.length > 0 && (
            <span className="shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-200">
              เดือนนี้
            </span>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 p-2 sm:p-2.5">
        {topMembers.length > 0 ? (
          <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
            {topMembers.map((item: any, index: number) => (
              <div
                key={item.member?.id}
                className="group flex items-center justify-between gap-2 rounded-lg border border-transparent p-1.5 transition-colors duration-200 hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-600 dark:hover:bg-gray-700/50 sm:p-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-950 dark:text-white">
                      {item.member?.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-gray-700 dark:text-gray-200">
                      น้ำหนัก: <span className="font-bold">{formatNumber(item.totalWeight)}</span> กก.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-extrabold tabular-nums tracking-tight text-green-900 dark:text-green-100">
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

