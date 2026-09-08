'use client';

import { Radio } from 'animal-island-ui';
import {
  SLIP_PAPER_OPTIONS,
  normalizeSlipPaperSize,
  slipWidthPxFor,
  type SlipPaperSizeId,
} from '@/lib/slipPaper';

const PREVIEW_IFRAME_HEIGHT = 560;
const PREVIEW_STAGE_WIDTH = 320;
const PREVIEW_STAGE_HEIGHT = 480;

const PAPER_HINT: Record<SlipPaperSizeId, string> = {
  '58mm': 'เล็ก',
  '80mm': 'มาตรฐาน',
  '104mm': 'กว้าง',
};

const PAPER_SIZE_RADIO_OPTIONS = SLIP_PAPER_OPTIONS.map((opt) => ({
  value: opt.id,
  label: (
    <span className="inline-flex flex-col leading-tight">
      <span>{opt.id}</span>
      <span className="text-xs font-normal opacity-80">{PAPER_HINT[opt.id]}</span>
    </span>
  ),
}));

const fieldClass =
  'w-full rounded-xl border-0 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 transition-shadow focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700 dark:focus:bg-gray-900';

interface SlipSettingsPanelProps {
  companyName: string;
  companyAddress: string;
  paperSize: SlipPaperSizeId;
  loading: boolean;
  saving: boolean;
  previewHtml: string;
  onCompanyNameChange: (value: string) => void;
  onCompanyAddressChange: (value: string) => void;
  onPaperSizeChange: (id: SlipPaperSizeId) => void;
  onSave: () => void;
}

export function SlipSettingsPanel({
  companyName,
  companyAddress,
  paperSize,
  loading,
  saving,
  previewHtml,
  onCompanyNameChange,
  onCompanyAddressChange,
  onPaperSizeChange,
  onSave,
}: SlipSettingsPanelProps) {
  const previewFrameWidth = slipWidthPxFor(paperSize);
  const previewScale = Math.min(
    PREVIEW_STAGE_WIDTH / previewFrameWidth,
    PREVIEW_STAGE_HEIGHT / PREVIEW_IFRAME_HEIGHT,
  );
  const busy = loading || saving;

  return (
    <div
      id="admin-tabpanel-slip"
      role="tabpanel"
      aria-labelledby="admin-tab-slip"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            ตั้งค่าข้อมูลใบรับซื้อ (Slip)
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            ชื่อ ที่อยู่ และขนาดกระดาษบนใบพิมพ์
          </p>
        </div>
        {loading && (
          <span className="text-xs text-gray-400 dark:text-gray-500">กำลังโหลด...</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex w-full max-w-md flex-col gap-2 p-8">
          <div className="space-y-1.5">
            <label htmlFor="slip-company-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ชื่อบริษัท
            </label>
            <input
              id="slip-company-name"
              type="text"
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              disabled={busy}
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="slip-company-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ที่อยู่บริษัท
            </label>
            <textarea
              id="slip-company-address"
              value={companyAddress}
              onChange={(e) => onCompanyAddressChange(e.target.value)}
              disabled={busy}
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="space-y-2">
            <p id="slip-paper-size-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ขนาดกระดาษ
            </p>
            <Radio
              options={PAPER_SIZE_RADIO_OPTIONS}
              value={paperSize}
              size="large"
              direction="horizontal"
              disabled={busy}
              className="slip-paper-radio py-2"
              onChange={(value) => onPaperSizeChange(normalizeSlipPaperSize(value))}
            />
            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={onSave}
                disabled={busy}
                className="mt-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50/80 p-5 dark:border-gray-700 dark:bg-gray-900/40 lg:border-l lg:border-t-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ตัวอย่างใบรับซื้อ</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {paperSize} · {previewFrameWidth} px
            </p>
          </div>
          <div className="flex justify-center rounded-xl bg-gray-100 p-4 dark:bg-gray-950/60">
            <div
              className="relative shrink-0 overflow-hidden"
              style={{
                width: PREVIEW_STAGE_WIDTH,
                height: PREVIEW_STAGE_HEIGHT,
              }}
            >
              <div
                className="absolute left-1/2 top-0 overflow-hidden rounded-md bg-white shadow-md"
                style={{
                  width: previewFrameWidth * previewScale,
                  height: PREVIEW_IFRAME_HEIGHT * previewScale,
                  transform: 'translateX(-50%)',
                }}
              >
                <iframe
                  title="ตัวอย่างใบรับซื้อ"
                  srcDoc={previewHtml}
                  className="bg-white"
                  style={{
                    width: previewFrameWidth,
                    height: PREVIEW_IFRAME_HEIGHT,
                    border: 'none',
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
