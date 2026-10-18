'use client';

import { useState } from 'react';
import { Radio } from 'animal-island-ui';
import {
  APP_FONT_FAMILIES,
  applyAppFontFamily,
  appFontFamilyStackFor,
  getStoredAppFontFamily,
  normalizeAppFontFamily,
  type AppFontFamilyId,
} from '@/lib/appFontFamily';
import {
  APP_FONT_SIZES,
  applyAppFontSize,
  getStoredAppFontSize,
  normalizeAppFontSize,
  type AppFontSizeId,
} from '@/lib/appFontSize';
import {
  APP_BG_DARK,
  APP_BG_LIGHT,
  applyAppBgDark,
  applyAppBgLight,
  getStoredAppBgDark,
  getStoredAppBgLight,
  type AppBgDarkId,
  type AppBgLightId,
} from '@/lib/appBackground';

const FONT_SIZE_RADIO_OPTIONS = APP_FONT_SIZES.map((option) => ({
  value: option.id,
  label: (
    <span className="inline-flex flex-col leading-tight">
      <span>{option.label}</span>
      <span className="text-xs font-normal opacity-80">{option.px}px</span>
    </span>
  ),
}));

const FONT_FAMILY_RADIO_OPTIONS = APP_FONT_FAMILIES.map((option) => ({
  value: option.id,
  label: (
    <span className="leading-tight" style={{ fontFamily: option.stack }}>
      {option.label}
    </span>
  ),
}));

function BackgroundChoice({
  name,
  id,
  label,
  hint,
  hex,
  checked,
  onSelect,
}: {
  name: string;
  id: string;
  label: string;
  hint: string;
  hex: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`relative flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 motion-safe:transition-[scale,border-color,box-shadow] motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.96] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-500 ${
        checked
          ? 'border-primary-500 bg-primary-50/70 shadow-sm dark:border-primary-400 dark:bg-primary-900/20'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={id}
        checked={checked}
        onChange={onSelect}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
      <span
        className="h-8 w-8 shrink-0 rounded-lg border border-black/10 shadow-sm dark:border-white/15"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-medium text-gray-900 dark:text-white">{label}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>
      </span>
    </label>
  );
}

export function DisplaySettingsPanel() {
  const [fontSize, setFontSize] = useState<AppFontSizeId>(() => getStoredAppFontSize());
  const [fontFamily, setFontFamily] = useState<AppFontFamilyId>(() => getStoredAppFontFamily());
  const [lightBackground, setLightBackground] = useState<AppBgLightId>(() => getStoredAppBgLight());
  const [darkBackground, setDarkBackground] = useState<AppBgDarkId>(() => getStoredAppBgDark());

  const handleFontSizeChange = (value: string | number) => {
    setFontSize(applyAppFontSize(normalizeAppFontSize(value)));
  };

  const handleFontFamilyChange = (value: string | number) => {
    setFontFamily(applyAppFontFamily(normalizeAppFontFamily(value)));
  };

  const lightHex = APP_BG_LIGHT.find((option) => option.id === lightBackground)?.hex ?? '#F9FAFB';
  const darkHex = APP_BG_DARK.find((option) => option.id === darkBackground)?.hex ?? '#111827';

  return (
    <div
      id="admin-tabpanel-display"
      role="tabpanel"
      aria-labelledby="admin-tab-display"
      className="space-y-4"
    >
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
          ขนาดตัวอักษรในระบบ
        </h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          ปรับขนาดและรูปแบบตัวอักษรทั้งโปรแกรมบนเครื่องนี้ การเปลี่ยนแปลงมีผลทันที
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

        <div className="space-y-2">
          <p id="app-font-family-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            รูปแบบตัวอักษร
          </p>
          <Radio
            options={FONT_FAMILY_RADIO_OPTIONS}
            value={fontFamily}
            size="large"
            direction="horizontal"
            className="app-font-radio py-2"
            onChange={handleFontFamilyChange}
          />
        </div>

        <div className="rounded-xl bg-gray-50 px-4 py-4 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:ring-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">ตัวอย่างข้อความ</p>
          <p
            className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300"
            style={{ fontFamily: appFontFamilyStackFor(fontFamily) }}
          >
            นายตัวอย่าง ทดสอบ — น้ำยางสด 125.50 กก. ราคา 52.00 บาท รวม 6,526.00 บาท
          </p>
        </div>
      </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
          สีพื้นหลัง
        </h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          เลือกสีพื้นหลังของโหมดสว่างและโหมดมืดบนเครื่องนี้ การเปลี่ยนแปลงมีผลทันที
        </p>
      </div>

      <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
        <div className="space-y-2">
          <p id="app-bg-light-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            โหมดสว่าง
          </p>
          <div
            role="radiogroup"
            aria-labelledby="app-bg-light-label"
            className="grid gap-2 sm:grid-cols-3"
          >
            {APP_BG_LIGHT.map((option) => (
              <BackgroundChoice
                key={option.id}
                name="app-bg-light"
                id={option.id}
                label={option.label}
                hint={option.hint}
                hex={option.hex}
                checked={lightBackground === option.id}
                onSelect={() => setLightBackground(applyAppBgLight(option.id))}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p id="app-bg-dark-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            โหมดมืด
          </p>
          <div
            role="radiogroup"
            aria-labelledby="app-bg-dark-label"
            className="grid gap-2 sm:grid-cols-3"
          >
            {APP_BG_DARK.map((option) => (
              <BackgroundChoice
                key={option.id}
                name="app-bg-dark"
                id={option.id}
                label={option.label}
                hint={option.hint}
                hex={option.hex}
                checked={darkBackground === option.id}
                onSelect={() => setDarkBackground(applyAppBgDark(option.id))}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div
            className="rounded-xl px-4 py-4 ring-1 ring-inset ring-black/10"
            style={{ backgroundColor: lightHex }}
          >
            <p className="text-sm font-medium text-gray-900">โหมดสว่าง</p>
            <div
              className="mt-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm"
              style={{ backgroundColor: 'rgb(var(--tone-muted-light))' }}
            >
              การ์ดบนพื้นหลังที่เลือก
            </div>
          </div>
          <div
            className="rounded-xl px-4 py-4 ring-1 ring-inset ring-white/10"
            style={{ backgroundColor: darkHex }}
          >
            <p className="text-sm font-medium text-gray-100">โหมดมืด</p>
            <div
              className="mt-3 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-100 shadow-sm"
              style={{ backgroundColor: 'rgb(var(--tone-inset))' }}
            >
              การ์ดบนพื้นหลังที่เลือก
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
