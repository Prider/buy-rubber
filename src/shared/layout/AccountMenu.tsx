'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AccountMenuProps {
  username?: string;
  email?: string | null;
  canManageSettings: boolean;
  onLogout: () => void;
}

function initials(username?: string) {
  const letter = username?.trim().charAt(0);
  return letter ? letter.toUpperCase() : 'A';
}

export default function AccountMenu({ username, email, canManageSettings, onLogout }: AccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const displayName = username || 'ผู้ใช้งาน';
  const displayEmail = email === undefined ? '…' : email || 'ยังไม่มีอีเมล';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 max-w-[12rem] items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-semibold text-white">
          {initials(username)}
        </span>
        <span className="truncate">{displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-900 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-3 pb-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                {initials(username)}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium leading-none">{displayName}</p>
                <p className="truncate text-xs leading-none text-gray-500 dark:text-gray-400" title={email || undefined}>
                  {displayEmail}
                </p>
              </div>
            </div>
          </div>

          <div className="-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700" />
          <p className="px-2 py-1.5 text-sm font-medium">บัญชี</p>
          <button type="button" role="menuitem" onClick={() => go('/profile')} className={itemClass}>
            <UserIcon />
            โปรไฟล์ร้าน
          </button>
          {canManageSettings && (
            <button type="button" role="menuitem" onClick={() => go('/admin')} className={itemClass}>
              <SettingsIcon />
              ตั้งค่าระบบ
            </button>
          )}

          <div className="-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700" />
          <p className="px-2 py-1.5 text-sm font-medium">การชำระเงิน</p>
          <button type="button" role="menuitem" onClick={() => go('/profile')} className={itemClass}>
            <CardIcon />
            ประวัติการชำระเงิน
          </button>
          <button type="button" role="menuitem" onClick={() => go('/signup/payment')} className={itemClass}>
            <UsersIcon />
            แพ็คเกจร้าน
          </button>

          <div className="-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <LogoutIcon />
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}

const itemClass =
  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-gray-700 outline-none hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 [&_svg]:text-gray-500 dark:[&_svg]:text-gray-400';

function UserIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" strokeWidth={2} />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={2} />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 .33 1 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.26.36.6.66 1 .8.4.14.8.2 1.2.2H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1 .33 1.65 1.65 0 0 0-.51.87Z"
      />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M2 10h20" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16 17 5-5-5-5M21 12H9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </svg>
  );
}
