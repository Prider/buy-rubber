interface MembersSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  isLoading: boolean;
  resultCount: number;
  totalCount: number;
}

/**
 * Search bar component for the members page
 * Separated for better testability and reusability
 */
export const MembersSearchBar = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  isLoading,
  resultCount,
  totalCount,
}: MembersSearchBarProps) => {
  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                  placeholder="ค้นหาสมาชิกตามชื่อ, รหัส, เบอร์โทร, ที่อยู่ หรือชื่อคนตัด..."
                />
                {searchTerm && (
                  <button
                    onClick={onClearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isLoading && <span className="animate-pulse">กำลังค้นหา...</span>}
                {!isLoading && (
                  <span>
                    แสดง <span className="font-semibold text-blue-600 dark:text-blue-400">{resultCount}</span> จาก {totalCount} รายการ
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

