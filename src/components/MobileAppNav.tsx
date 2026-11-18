'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CloseButton } from '@/components/common/CloseButton';
import DarkModeToggle from '@/components/DarkModeToggle';
import { isMobileNavActive, mobileShortLabel } from '@/lib/mobileNav';

export interface MobileNavItem {
  name: string;
  href: string;
  icon: string;
}

const rowClass =
  'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:text-gray-200 dark:hover:bg-gray-700/60';

export function MobileAccountButton({
  initial,
  open,
  onOpen,
}: {
  initial: string;
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="เปิดเมนู"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="mobile-more-sheet"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white md:hidden"
    >
      {initial}
    </button>
  );
}

export function MobileTabBar({
  items,
  pathname,
  showOthers,
  othersActive,
  othersOpen,
  onOpenOthers,
}: {
  items: MobileNavItem[];
  pathname: string;
  showOthers: boolean;
  othersActive: boolean;
  othersOpen: boolean;
  onOpenOthers: () => void;
}) {
  const count = items.length + (showOthers ? 1 : 0);
  if (count === 0) return null;

  return (
    <nav
      aria-label="เมนูหลัก"
      className="flex shrink-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-700 dark:bg-gray-800 md:hidden"
    >
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isMobileNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-700 ${
                active
                  ? 'font-semibold text-blue-700 dark:text-blue-300'
                  : 'font-medium text-gray-500 dark:text-gray-400'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-base ${
                  active ? 'bg-blue-50 dark:bg-blue-900/40' : ''
                }`}
              >
                {item.icon}
              </span>
              {mobileShortLabel(item.href, item.name)}
            </Link>
          );
        })}
        {showOthers && (
          <button
            type="button"
            onClick={onOpenOthers}
            aria-label="อื่นๆ"
            aria-haspopup="dialog"
            aria-expanded={othersOpen}
            aria-controls="mobile-more-sheet"
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-700 ${
              othersActive || othersOpen
                ? 'font-semibold text-blue-700 dark:text-blue-300'
                : 'font-medium text-gray-500 dark:text-gray-400'
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                othersActive || othersOpen ? 'bg-blue-50 dark:bg-blue-900/40' : ''
              }`}
            >
              <MoreIcon />
            </span>
            อื่นๆ
          </button>
        )}
      </div>
    </nav>
  );
}

export function MobileMoreSheet({
  open,
  items,
  pathname,
  username,
  roleLabel,
  showSettings,
  settingsActive,
  showAssistant,
  onOpenAssistant,
  onClose,
  onLogout,
}: {
  open: boolean;
  items: MobileNavItem[];
  pathname: string;
  username: string;
  roleLabel: string;
  showSettings: boolean;
  settingsActive: boolean;
  showAssistant: boolean;
  onOpenAssistant: () => void;
  onClose: () => void;
  onLogout: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="sheet-overlay absolute inset-0 bg-black/50"
        aria-label="ปิดเมนู"
        onClick={onClose}
      />
      <div
        id="mobile-more-sheet"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="เมนู"
        tabIndex={-1}
        className="sheet-panel absolute inset-x-0 bottom-0 flex max-h-[min(32rem,85dvh)] flex-col rounded-t-2xl border border-gray-200 bg-white shadow-2xl outline-none dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">{username}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {items.map((item) => {
            const active = isMobileNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
                className={`${rowClass} ${active ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
              >
                <span className="flex h-8 w-8 items-center justify-center text-base" aria-hidden="true">
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
          {showAssistant && (
            <button type="button" onClick={onOpenAssistant} className={rowClass}>
              <span className="flex h-8 w-8 items-center justify-center" aria-hidden="true">
                <AiSparkIcon />
              </span>
              ผู้ช่วยอัจฉริยะ
            </button>
          )}
          {showSettings && (
            <Link
              href="/admin"
              aria-current={settingsActive ? 'page' : undefined}
              onClick={onClose}
              className={`${rowClass} ${settingsActive ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
            >
              <span className="flex h-8 w-8 items-center justify-center text-base" aria-hidden="true">
                ⚙️
              </span>
              ตั้งค่าระบบ
            </Link>
          )}
          <div className="mt-2 flex min-h-11 items-center justify-between border-t border-gray-200 px-3 pt-2 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">โหมดมืด</span>
            <DarkModeToggle />
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-1 flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}

function MoreIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

function AiSparkIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5 13.4 8.1 18 9.5 13.4 10.9 12 15.5 10.6 10.9 6 9.5 10.6 8.1 12 3.5Z" />
      <path d="M18.5 14.5 19.2 16.8 21.5 17.5 19.2 18.2 18.5 20.5 17.8 18.2 15.5 17.5 17.8 16.8 18.5 14.5Z" />
    </svg>
  );
}
