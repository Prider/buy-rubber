import { useRouter } from 'next/navigation';

interface MembersPageHeaderProps {
  onAddMember: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  isLoading: boolean;
  resultCount: number;
  totalCount: number;
  placeholder?: string;
}

export const MembersPageHeader = ({
  onAddMember,
  searchTerm,
  onSearchChange,
  onClearSearch,
  isLoading,
  resultCount,
  totalCount,
  placeholder = 'ค้นหาชื่อ รหัส หรือเบอร์โทร',
}: MembersPageHeaderProps) => {
  const router = useRouter();

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-600 lg:flex-row lg:items-center lg:gap-4">
      <h1 className="whitespace-nowrap text-base font-bold">
        <span className="animate-gradient bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
          จัดการสมาชิก
        </span>
      </h1>

      <div className="grid w-full min-w-0 flex-1 grid-cols-1 items-center gap-2 md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-3">
        <div className="relative min-w-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full min-w-0 rounded-xl border border-gray-200 py-2.5 pl-10 pr-10 text-sm shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 max-lg:min-h-11 max-lg:text-base dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder={placeholder}
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="ล้างการค้นหา"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="shrink-0 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
          {isLoading ? (
            <span className="animate-pulse">กำลังค้นหา...</span>
          ) : (
            <span>
              แสดง{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{resultCount}</span> จาก{' '}
              {totalCount} รายการ
            </span>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row md:col-span-2 lg:col-span-1">
          <button
            type="button"
            onClick={() => router.push('/purchases')}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:w-auto md:min-h-10"
          >
            กลับไปหน้ารับซื้อ
          </button>
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-3 text-sm font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 sm:w-auto md:min-h-10"
          >
            <span aria-hidden="true">+</span>
            เพิ่มสมาชิก
          </button>
        </div>
      </div>
    </div>
  );
};
