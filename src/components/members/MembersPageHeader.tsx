import { useRouter } from 'next/navigation';

interface MembersPageHeaderProps {
  totalMembers: number;
  onAddMember: () => void;
}

export const MembersPageHeader = ({ totalMembers, onAddMember }: MembersPageHeaderProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h1 className="hidden text-lg font-semibold tracking-tight sm:text-xl lg:block">
          <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
            จัดการสมาชิก
          </span>
        </h1>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">ทั้งหมด {totalMembers} คน</p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
        <button
          type="button"
          onClick={() => router.push('/purchases')}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 md:min-h-10"
        >
          กลับไปหน้ารับซื้อ
        </button>
        <button
          type="button"
          onClick={onAddMember}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-3 text-sm font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 md:min-h-10"
        >
          <span aria-hidden="true">+</span>
          เพิ่มสมาชิก
        </button>
      </div>
    </div>
  );
};
