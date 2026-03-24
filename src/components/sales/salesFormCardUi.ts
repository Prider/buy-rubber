/** Pure helpers for SalesFormCard — easy to unit test without React. */

export function getSalesFormCardBorderClass(isEditing: boolean): string {
  return isEditing
    ? 'border-violet-300 dark:border-violet-500'
    : 'border-gray-100 dark:border-gray-700';
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
  return isEditing ? 'บันทึกการแก้ไข' : 'บันทึก Selling Transactions';
}

export function getSalesFormLayoutClasses(compact: boolean) {
  return {
    inputClass: compact
      ? 'w-full min-w-0 px-2.5 py-1.5 text-sm border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600'
      : 'w-full min-w-0 px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600',
    titleClass: compact
      ? 'text-base font-bold text-gray-900 dark:text-white'
      : 'text-xl font-bold text-gray-900 dark:text-white',
    bodyPad: compact ? 'p-2.5 flex flex-col gap-2 min-w-0' : 'p-4 flex flex-col gap-3 min-w-0',
    rowGap: compact ? 'gap-2' : 'gap-3',
    headerBtnPad: compact ? 'px-4 py-2' : 'px-6 py-4',
  };
}
