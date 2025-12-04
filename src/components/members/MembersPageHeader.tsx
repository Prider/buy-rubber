import { useRouter } from 'next/navigation';

interface MembersPageHeaderProps {
  totalMembers: number;
  onAddMember: () => void;
}

/**
 * Header component for the members page
 * Separated for better testability and reusability
 */
export const MembersPageHeader = ({ totalMembers, onAddMember }: MembersPageHeaderProps) => {
  const router = useRouter();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                จัดการสมาชิก
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                ทั้งหมด {totalMembers} สมาชิก
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/purchases')} 
            className="group relative px-5 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>กลับไปหน้ารับซื้อ</span>
            </div>
          </button>
          <button 
            onClick={onAddMember} 
            className="group relative px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>เพิ่มสมาชิก</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

