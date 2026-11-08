'use client';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function CloseButton({ onClick, className = '', disabled = false }: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 ${className}`}
    >
      ปิด
    </button>
  );
}
