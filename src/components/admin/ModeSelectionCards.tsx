import React from 'react';

interface ModeSelectionCardsProps {
  localIP: string;
  ipLoading: boolean;
  copied: boolean;
  onCopyToClipboard: (text: string, label: string) => Promise<void>;
}

export function ModeSelectionCards({
  localIP,
  ipLoading,
  copied,
  onCopyToClipboard,
}: ModeSelectionCardsProps) {
  const serverUrl = `http://${localIP}:3000`;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col items-start gap-2 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
            การเชื่อมต่อ
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            ข้อมูลอยู่ที่เครื่องนี้ เครื่องอื่นในร้านใช้ Server URL <span className="whitespace-nowrap">ด้านล่าง</span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
          โหมดเซิร์ฟเวอร์
        </span>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
            Server URL
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <p className="flex min-h-11 flex-1 items-center break-all rounded-xl bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-gray-900 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700">
              {ipLoading ? 'กำลังโหลด...' : serverUrl}
            </p>
            <button
              type="button"
              disabled={ipLoading}
              onClick={() => onCopyToClipboard(serverUrl, 'Server URL')}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-safe:transition-[scale,background-color] motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.96] ${
                copied
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
            </button>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          เปิด URL นี้บนเครื่องอื่นที่อยู่ในวงแลนเดียวกัน เครื่องหลักต้องเปิดโปรแกรมค้างไว้ เครื่องอื่นถึงจะเชื่อมต่อได้
        </p>
      </div>
    </div>
  );
}
