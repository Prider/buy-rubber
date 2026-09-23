'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/platform/login';

  useEffect(() => {
    if (!isLogin && !localStorage.getItem('platform_token')) {
      router.replace('/platform/login');
    }
  }, [router, isLogin]);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="font-bold">Punsook Platform</div>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/platform"
            className={pathname === '/platform' ? 'font-semibold' : 'text-slate-500'}
          >
            ร้านค้า
          </Link>
          <Link
            href="/platform/payments"
            className={pathname === '/platform/payments' ? 'font-semibold' : 'text-slate-500'}
          >
            สลิปชำระเงิน
          </Link>
          <Link
            href="/platform/settings"
            className={pathname === '/platform/settings' ? 'font-semibold' : 'text-slate-500'}
          >
            บัญชีรับเงิน
          </Link>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('platform_token');
              router.push('/platform/login');
            }}
          >
            ออกจากระบบ
          </button>
        </nav>
      </header>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
