'use client';

import { useState } from 'react';
import { Radio } from 'animal-island-ui';
import {
  APP_FONT_SIZES,
  applyAppFontSize,
  getStoredAppFontSize,
  normalizeAppFontSize,
  type AppFontSizeId,
} from '@/lib/appFontSize';

const FONT_SIZE_RADIO_OPTIONS = APP_FONT_SIZES.map((option) => ({
  value: option.id,
  label: (
    <span className="inline-flex flex-col leading-tight">
      <span>{option.label}</span>
      <span className="text-xs font-normal opacity-80">{option.px}px</span>
    </span>
  ),
}));

export function DisplaySettingsPanel() {
  const [fontSize, setFontSize] = useState<AppFontSizeId>(() => getStoredAppFontSize());

  const handleFontSizeChange = (value: string | number) => {
    setFontSize(applyAppFontSize(normalizeAppFontSize(value)));
  };

  return (
    <div
      id="admin-tabpanel-display"
      role="tabpanel"
      aria-labelledby="admin-tab-display"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
          ขนาดตัวอักษรในระบบ
        </h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          ปรับขนาดตัวอักษรทั้งโปรแกรมบนเครื่องนี้ การเปลี่ยนแปลงมีผลทันที
        </p>
      </div>

      <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
        <div className="space-y-2">
          <p id="app-font-size-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ขนาดตัวอักษร
          </p>
          <Radio
            options={FONT_SIZE_RADIO_OPTIONS}
            value={fontSize}
            size="large"
            direction="horizontal"
            className="app-font-radio py-2"
            onChange={handleFontSizeChange}
          />
        </div>

        <div className="rounded-xl bg-gray-50 px-4 py-4 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:ring-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">ตัวอย่างข้อความ</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            นายตัวอย่าง ทดสอบ — น้ำยางสด 125.50 กก. ราคา 52.00 บาท รวม 6,526.00 บาท
          </p>
        </div>
      </div>
    </div>
  );
}
