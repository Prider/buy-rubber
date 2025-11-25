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

/**
 * Check if running in Electron environment
 */
export function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' &&
    window.navigator.userAgent.toLowerCase().includes('electron');
}

/**
 * Show success message based on environment
 */
export function showRestoreSuccessMessage(): void {
  if (isElectronEnvironment()) {
    alert(
      '✅ เรียกคืนข้อมูลสำเร็จ!\n\n' +
      'กรุณาปิดแอปพลิเคชันและเปิดใหม่อีกครั้ง\n' +
      'เพื่อให้ข้อมูลที่เรียกคืนมาแสดงผลอย่างถูกต้อง\n\n' +
      '(กด Cmd+Q หรือปิดหน้าต่างแอป)'
    );
  } else {
    alert('✅ เรียกคืนข้อมูลเรียบร้อย!\n\nหน้าเว็บจะรีโหลดอัตโนมัติ...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

