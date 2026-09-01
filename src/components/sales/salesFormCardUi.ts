/** Pure helpers for SalesFormCard — easy to unit test without React. */

export function getSalesFormCardBorderClass(isEditing: boolean): string {
  return isEditing
    ? 'border-violet-300 ring-1 ring-violet-200 dark:border-violet-500/40 dark:ring-violet-500/20'
    : 'border-gray-200 dark:border-gray-700';
}

export function getSalesFormCardTitle(
  isEditing: boolean,
  editingSaleNo: string | null | undefined,
): string {
  if (!isEditing) return 'บันทึกการขาย';
  return editingSaleNo ? `แก้การขาย เลขที่ ${editingSaleNo}` : 'แก้การขาย';
}

export function getSalesFormSaveButtonText(saving: boolean, isEditing: boolean): string {
  if (saving) return isEditing ? 'กำลังบันทึกการแก้ไข...' : 'กำลังบันทึก...';
  return isEditing ? 'บันทึกการแก้ไข' : 'บันทึกการขาย';
}

const INPUT_BASE =
  'w-full min-w-0 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40';

export function getSalesFormLayoutClasses(compact: boolean) {
  return {
    inputClass: compact ? `${INPUT_BASE} px-3 py-2` : `${INPUT_BASE} px-3.5 py-2.5`,
    titleClass: compact
      ? 'text-sm font-semibold text-gray-900 dark:text-white'
      : 'text-base font-semibold text-gray-900 dark:text-white',
    bodyPad: compact
      ? 'px-4 pb-4 pt-3 flex flex-col gap-3 min-w-0'
      : 'px-5 pb-5 pt-4 flex flex-col gap-4 min-w-0',
    rowGap: compact ? 'gap-3' : 'gap-4',
    headerBtnPad: compact ? 'px-4 py-2.5' : 'px-5 py-3.5',
  };
}
