interface MembersSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  isLoading: boolean;
  resultCount: number;
  totalCount: number;
  placeholder?: string;
  embedded?: boolean;
}

export const MembersSearchBar = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  isLoading,
  resultCount,
  totalCount,
  placeholder = 'ค้นหาสมาชิกตามชื่อ, รหัส, เบอร์โทร, ที่อยู่ หรือชื่อคนตัด...',
  embedded = false,
}: MembersSearchBarProps) => {
  const field = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-10 text-base text-gray-900 outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-100 dark:focus:bg-gray-900 sm:text-sm"
          placeholder={placeholder}
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="ล้างการค้นหา"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 sm:shrink-0 sm:text-sm">
        {isLoading ? (
          <span className="animate-pulse">กำลังค้นหา...</span>
        ) : (
          <span>
            แสดง <span className="font-medium text-gray-800 dark:text-gray-200">{resultCount}</span> จาก {totalCount}
          </span>
        )}
      </p>
    </div>
  );

  if (embedded) {
    return <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700 sm:px-5">{field}</div>;
  }

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
      {field}
    </div>
  );
};
