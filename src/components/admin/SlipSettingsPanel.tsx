'use client';

import { useEffect, useRef, useState } from 'react';
import { Radio } from 'animal-island-ui';
import {
  SLIP_FONT_OPTIONS,
  normalizeSlipFontSize,
  slipFontLabelFor,
  type SlipFontSizeId,
} from '@/lib/slipFont';
import {
  SLIP_PAPER_OPTIONS,
  normalizeSlipPaperSize,
  slipWidthPxFor,
  type SlipPaperSizeId,
} from '@/lib/slipPaper';

const PREVIEW_IFRAME_HEIGHT = 560;
const PREVIEW_STAGE_WIDTH = 320;
const PREVIEW_STAGE_HEIGHT = 480;

const FONT_HINT: Record<SlipFontSizeId, string> = {
  h4: 'เล็ก',
  h3: 'มาตรฐาน',
  h2: 'ใหญ่',
  h1: 'ใหญ่มาก',
};

const FONT_SIZE_RADIO_OPTIONS = SLIP_FONT_OPTIONS.map((opt) => ({
  value: opt.id,
  label: (
    <span className="inline-flex flex-col leading-tight">
      <span>{opt.label}</span>
      <span className="text-xs font-normal opacity-80">{FONT_HINT[opt.id]}</span>
    </span>
  ),
}));

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
  footerText: string;
  fontSize: SlipFontSizeId;
  paperSize: SlipPaperSizeId;
  loading: boolean;
  saving: boolean;
  previewHtml: string;
  onCompanyNameChange: (value: string) => void;
  onCompanyAddressChange: (value: string) => void;
  onFooterTextChange: (value: string) => void;
  onFontSizeChange: (id: SlipFontSizeId) => void;
  onPaperSizeChange: (id: SlipPaperSizeId) => void;
  onSave: () => void;
}

export function SlipSettingsPanel({
  companyName,
  companyAddress,
  footerText,
  fontSize,
  paperSize,
  loading,
  saving,
  previewHtml,
  onCompanyNameChange,
  onCompanyAddressChange,
  onFooterTextChange,
  onFontSizeChange,
  onPaperSizeChange,
  onSave,
}: SlipSettingsPanelProps) {
  const previewFrameWidth = slipWidthPxFor(paperSize);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = (width: number) => {
      const next = Math.min(PREVIEW_STAGE_WIDTH, Math.max(0, Math.floor(width)));
      setStageWidth((current) => (current === next ? current : next));
    };

    measure(stage.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      measure(entry.contentRect.width);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const stageHeight = stageWidth * (PREVIEW_STAGE_HEIGHT / PREVIEW_STAGE_WIDTH);
  const previewScale =
    stageWidth > 0
      ? Math.min(stageWidth / previewFrameWidth, stageHeight / PREVIEW_IFRAME_HEIGHT)
      : 1;
  const busy = loading || saving;

  return (
    <div
      id="admin-tabpanel-slip"
      role="tabpanel"
      aria-labelledby="admin-tab-slip"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div className="order-2 flex w-full min-w-0 flex-col gap-4 border-t border-gray-100 p-4 dark:border-gray-700 sm:p-6 md:order-1 md:border-t-0 lg:p-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
              ตั้งค่าข้อมูลใบรับซื้อ (Slip)
            </h3>
            {loading && (
              <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">กำลังโหลด...</span>
            )}
          </div>
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
            <label htmlFor="slip-footer-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ข้อความท้ายใบ
            </label>
            <textarea
              id="slip-footer-text"
              value={footerText}
              onChange={(e) => onFooterTextChange(e.target.value)}
              disabled={busy}
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="space-y-2">
            <p id="slip-font-size-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ขนาดตัวอักษร
            </p>
            <Radio
              options={FONT_SIZE_RADIO_OPTIONS}
              value={fontSize}
              size="large"
              direction="horizontal"
              disabled={busy}
              className="slip-font-radio py-2"
              onChange={(value) => onFontSizeChange(normalizeSlipFontSize(value))}
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
          </div>

          <div className="flex pt-1 sm:justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="min-h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </div>

        <div className="order-1 min-w-0 bg-gray-50/80 p-4 dark:bg-gray-900/40 sm:p-5 md:order-2 md:border-t md:border-gray-100 md:dark:border-gray-700 lg:border-l lg:border-t-0">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ตัวอย่างใบรับซื้อ</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {paperSize} · {slipFontLabelFor(fontSize)} · {previewFrameWidth} px
            </p>
          </div>
          <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-950/60 sm:p-4">
            <div
              ref={stageRef}
              className="relative mx-auto w-full max-w-[320px] overflow-hidden"
              style={{ aspectRatio: `${PREVIEW_STAGE_WIDTH} / ${PREVIEW_STAGE_HEIGHT}` }}
            >
              {stageWidth > 0 && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
