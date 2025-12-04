interface MembersErrorDisplayProps {
  error: string;
}

/**
 * Error display component for the members page
 * Separated for better testability and reusability
 */
export const MembersErrorDisplay = ({ error }: MembersErrorDisplayProps) => {
  if (!error) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

