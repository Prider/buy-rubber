/**
 * Utility functions for Backup page
 */

/**
 * Format date string to Thai locale
 */
export function formatBackupDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get type label in Thai
 */
export function getBackupTypeLabel(type: string): string {
  return type === 'auto' ? 'อัตโนมัติ' : 'ด้วยตนเอง';
}

/**
 * Get badge CSS classes for backup type
 */
export function getBackupTypeBadge(type: string): string {
  return type === 'auto'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
}

export function showRestoreSuccessMessage(showSuccess: (title: string, message: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) => void): void {
  showSuccess(
    '✅ เรียกคืนข้อมูลเรียบร้อย',
    'หน้าเว็บจะรีโหลดอัตโนมัติ...',
    { autoClose: false }
  );
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

export function showResetSuccessMessage(showSuccess: (title: string, message: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) => void): void {
  showSuccess(
    '✅ รีเซ็ตข้อมูลเริ่มต้นเรียบร้อย',
    'หน้าเว็บจะรีโหลดอัตโนมัติ...',
    { autoClose: false }
  );
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

