import React from 'react';

interface ResetInitialDataCardProps {
  onReset: () => void;
  loading: boolean;
}

export function ResetInitialDataCard({ onReset, loading }: ResetInitialDataCardProps) {
  return (
    <section
      aria-labelledby="reset-initial-data-title"
      className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3
            id="reset-initial-data-title"
            className="text-sm font-semibold text-red-900 dark:text-red-100"
          >
            คืนค่าข้อมูลเริ่มต้น
          </h3>
          <p className="mt-1 text-sm text-red-800 dark:text-red-200">
            แทนที่ข้อมูลปัจจุบันทั้งหมด ระบบจะสำรองข้อมูลปัจจุบันไว้ก่อนรีเซ็ต
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900/40"
        >
          รีเซ็ตข้อมูลเริ่มต้น
        </button>
      </div>
    </section>
  );
}
