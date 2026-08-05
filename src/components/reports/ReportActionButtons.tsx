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
  disabled = false,
}: ReportActionButtonsProps) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onPreview}
        disabled={disabled}
        className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        ดูตัวอย่าง
      </button>
      <button
        type="button"
        onClick={onDownloadPDF}
        disabled={disabled}
        className="rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        ดาวน์โหลด PDF
      </button>
    </div>
  );
}
