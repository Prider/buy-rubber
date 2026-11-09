'use client';

export const EmptyState = () => (
  <div className="text-center py-16">
    <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
    <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">📭 ยังไม่มีประวัติ</p>
    <p className="text-sm text-gray-400 dark:text-gray-500">สมาชิกท่านนี้ยังไม่มีรายการรับซื้อหรือค่าบริการ</p>
  </div>
);

