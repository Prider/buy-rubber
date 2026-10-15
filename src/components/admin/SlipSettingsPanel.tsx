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
  cssPxFromMm,
  normalizeSlipPaperSize,
  slipPaperShortLabel,
  slipSheetHeightMm,
  slipWidthPxFor,
  type SlipPaperSizeId,
} from '@/lib/slipPaper';
import {
  SLIP_TEMPLATE_OPTIONS,
  normalizeSlipTemplate,
  type SlipTemplateId,
} from '@/lib/slipTemplate';

const PREVIEW_IFRAME_HEIGHT = 560;
const PREVIEW_STAGE_WIDTH = 420;
const PREVIEW_STAGE_HEIGHT = 560;

function choiceLabel(primary: string, hint: string) {
  return (
    <span className="inline-flex items-baseline gap-1 leading-tight">
      <span>{primary}</span>
      <span className="text-xs font-normal opacity-70">{hint}</span>
    </span>
  );
}

const FONT_HINT: Record<SlipFontSizeId, string> = {
  h4: 'เล็ก',
  h3: 'มาตรฐาน',
  h2: 'ใหญ่',
  h1: 'ใหญ่มาก',
};

const FONT_SIZE_RADIO_OPTIONS = SLIP_FONT_OPTIONS.map((opt) => ({
  value: opt.id,
  label: choiceLabel(opt.label, FONT_HINT[opt.id]),
}));

const PAPER_HINT: Record<SlipPaperSizeId, string> = {
  '58mm': 'เล็ก',
  '80mm': 'มาตรฐาน',
  '104mm': 'กว้าง',
  a4: 'เลเซอร์',
};

const PAPER_SIZE_RADIO_OPTIONS = SLIP_PAPER_OPTIONS.filter((opt) => opt.id !== 'a4').map((opt) => ({
  value: opt.id,
  label: choiceLabel(slipPaperShortLabel(opt.id), PAPER_HINT[opt.id]),
}));

const TEMPLATE_RADIO_OPTIONS = SLIP_TEMPLATE_OPTIONS.map((opt) => ({
  value: opt.id,
  label: choiceLabel(opt.label, opt.hint),
}));

const fieldClass =
  'w-full rounded-xl border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 transition-shadow focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700 dark:focus:bg-gray-900';

interface SlipSettingsPanelProps {
  companyName: string;
  companyAddress: string;
  taxId: string;
  footerText: string;
  fontSize: SlipFontSizeId;
  paperSize: SlipPaperSizeId;
  template: SlipTemplateId;
  loading: boolean;
  saving: boolean;
  previewHtml: string;
  onCompanyNameChange: (value: string) => void;
  onCompanyAddressChange: (value: string) => void;
  onTaxIdChange: (value: string) => void;
  onFooterTextChange: (value: string) => void;
  onFontSizeChange: (id: SlipFontSizeId) => void;
  onPaperSizeChange: (id: SlipPaperSizeId) => void;
  onTemplateChange: (id: SlipTemplateId) => void;
  onSave: () => void;
}

export function SlipSettingsPanel({
  companyName,
  companyAddress,
  taxId,
  footerText,
  fontSize,
  paperSize,
  template,
  loading,
  saving,
  previewHtml,
  onCompanyNameChange,
  onCompanyAddressChange,
  onTaxIdChange,
  onFooterTextChange,
  onFontSizeChange,
  onPaperSizeChange,
  onTemplateChange,
  onSave,
}: SlipSettingsPanelProps) {
  const previewFrameWidth = slipWidthPxFor(paperSize);
  const sheetHeightMm = slipSheetHeightMm(paperSize);
  const previewFrameHeight = sheetHeightMm ? cssPxFromMm(sheetHeightMm) : PREVIEW_IFRAME_HEIGHT;
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
      ? Math.min(stageWidth / previewFrameWidth, stageHeight / previewFrameHeight)
      : 1;
  const busy = loading || saving;
  const templateLabel = SLIP_TEMPLATE_OPTIONS.find((opt) => opt.id === template)?.label ?? '';
  const labelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-400';

  return (
    <div
      id="admin-tabpanel-slip"
      role="tabpanel"
      aria-labelledby="admin-tab-slip"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              ตั้งค่าข้อมูลใบรับซื้อ (Slip)
            </h3>
            {loading && (
              <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">กำลังโหลด...</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            ข้อความบนใบและรูปแบบการพิมพ์ ตัวอย่างอัปเดตทันที
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="min-h-10 w-full shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
        <div className="order-2 flex w-full min-w-0 flex-col gap-4 p-4 md:order-1 sm:p-5">
          <section className="space-y-3">
            <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400">ข้อมูลบนใบ</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="slip-company-name" className={labelClass}>
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
              <div className="space-y-1">
                <label htmlFor="slip-tax-id" className={labelClass}>
                  หมายเลขผู้เสียภาษี
                </label>
                <input
                  id="slip-tax-id"
                  type="text"
                  inputMode="numeric"
                  value={taxId}
                  onChange={(e) => onTaxIdChange(e.target.value)}
                  disabled={busy}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="slip-company-address" className={labelClass}>
                  ที่อยู่บริษัท
                </label>
                <textarea
                  id="slip-company-address"
                  value={companyAddress}
                  onChange={(e) => onCompanyAddressChange(e.target.value)}
                  disabled={busy}
                  rows={2}
                  className={`${fieldClass} resize-none`}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="slip-footer-text" className={labelClass}>
                  ข้อความท้ายใบ
                </label>
                <textarea
                  id="slip-footer-text"
                  value={footerText}
                  onChange={(e) => onFooterTextChange(e.target.value)}
                  disabled={busy}
                  rows={2}
                  className={`${fieldClass} resize-none`}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400">การพิมพ์</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <p id="slip-template-label" className={labelClass}>
                  รูปแบบใบ
                </p>
                <Radio
                  options={TEMPLATE_RADIO_OPTIONS}
                  value={template}
                  size="middle"
                  direction="horizontal"
                  disabled={busy}
                  className="slip-template-radio"
                  onChange={(value) => onTemplateChange(normalizeSlipTemplate(value))}
                />
              </div>
              <div className="space-y-1">
                <p id="slip-font-size-label" className={labelClass}>
                  ขนาดตัวอักษร
                </p>
                <Radio
                  options={FONT_SIZE_RADIO_OPTIONS}
                  value={fontSize}
                  size="middle"
                  direction="horizontal"
                  disabled={busy}
                  className="slip-font-radio"
                  onChange={(value) => onFontSizeChange(normalizeSlipFontSize(value))}
                />
              </div>
              {template !== 'a4' ? (
                <div className="space-y-1">
                  <p id="slip-paper-size-label" className={labelClass}>
                    ขนาดกระดาษ
                  </p>
                  <Radio
                    options={PAPER_SIZE_RADIO_OPTIONS}
                    value={paperSize}
                    size="middle"
                    direction="horizontal"
                    disabled={busy}
                    className="slip-paper-radio"
                    onChange={(value) => onPaperSizeChange(normalizeSlipPaperSize(value))}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <p className={labelClass}>ขนาดกระดาษ</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">A4 · 210×297 มม.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="order-1 min-w-0 border-b border-gray-100 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/40 md:order-2 md:border-b-0 md:border-l md:dark:border-gray-700">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">ตัวอย่างใบรับซื้อ</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {slipPaperShortLabel(paperSize)} · {templateLabel} · {slipFontLabelFor(fontSize)} · {previewFrameWidth} px
            </p>
          </div>
          <div className="rounded-xl bg-gray-100 p-2.5 dark:bg-gray-950/60">
            <div
              ref={stageRef}
              className="relative mx-auto w-full overflow-hidden"
              style={{ aspectRatio: `${PREVIEW_STAGE_WIDTH} / ${PREVIEW_STAGE_HEIGHT}` }}
            >
              {stageWidth > 0 && (
                <div
                  className="absolute left-1/2 top-0 overflow-hidden rounded-md bg-white shadow-md"
                  style={{
                    width: previewFrameWidth * previewScale,
                    height: previewFrameHeight * previewScale,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <iframe
                    title="ตัวอย่างใบรับซื้อ"
                    srcDoc={previewHtml}
                    className="bg-white"
                    style={{
                      width: previewFrameWidth,
                      height: previewFrameHeight,
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
