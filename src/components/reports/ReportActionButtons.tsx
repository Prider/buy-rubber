'use client';

interface ReportActionButtonsProps {
  onPreview: () => void;
  onDownloadPDF: () => void;
  onPrint: () => void;
  disabled?: boolean;
}

export default function ReportActionButtons({
  onPreview,
  onDownloadPDF,
  onPrint,
  disabled = false,
}: ReportActionButtonsProps) {
  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <button
        onClick={onPreview}
        disabled={disabled}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>ดูตัวอย่าง PDF</span>
      </button>

      <button
        onClick={onDownloadPDF}
        disabled={disabled}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 dark:from-emerald-500 dark:to-emerald-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5M12 15V3m6 18H6a2 2 0 01-2-2V7a2 2 0 012-2h3" />
        </svg>
        <span>ดาวน์โหลด PDF</span>
      </button>
    </div>
  );
}
