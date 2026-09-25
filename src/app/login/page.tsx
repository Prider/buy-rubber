'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/platform/AuthContext';
import DarkModeToggle from '@/shared/ui/DarkModeToggle';
import Logo from '@/shared/ui/Logo';
import useArrowFocusNavigation from '@/shared/hooks/useArrowFocusNavigation';

interface LoginPageProps {
  onLogin?: () => void;
}

const inputClassName =
  'h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:bg-gray-800 dark:focus:ring-blue-400/20';

export default function LoginPage({ onLogin }: LoginPageProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [slug, setSlug] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useArrowFocusNavigation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slugParam = params.get('slug');
    if (slugParam) {
      setSlug(slugParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(slug, username, password);

      if (success) {
        if (onLogin) {
          onLogin();
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Invalid username or password');
      }
    } catch (err: any) {
      console.log('err', err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-stretch justify-center bg-white dark:bg-gray-950 md:items-center md:bg-slate-200 md:p-5 dark:md:bg-slate-950 lg:p-8 min-[1440px]:bg-gradient-to-br min-[1440px]:from-slate-200 min-[1440px]:via-slate-300 min-[1440px]:to-slate-400 min-[1440px]:p-10 dark:min-[1440px]:from-slate-950 dark:min-[1440px]:via-slate-900 dark:min-[1440px]:to-black">
      <div className="flex min-h-[100dvh] w-full flex-col bg-white dark:bg-gray-900 md:h-[calc(100dvh-2.5rem)] md:min-h-0 md:max-w-[860px] md:overflow-hidden md:rounded-[2rem] md:shadow-2xl md:ring-1 md:ring-slate-900/10 dark:md:ring-white/10 lg:h-[calc(100dvh-4rem)] lg:max-w-[1120px] lg:rounded-[2.5rem] min-[1440px]:h-[min(844px,calc(100dvh-5rem))] min-[1440px]:max-w-[390px] min-[1440px]:rounded-[2.75rem] min-[1440px]:shadow-[0_40px_80px_-24px_rgba(15,23,42,0.55)] min-[1440px]:ring-[12px] min-[1440px]:ring-slate-900 dark:min-[1440px]:ring-black">
        <header className="flex items-center justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-5 lg:px-8">
          <DarkModeToggle />
        </header>

        <main className="flex flex-1 flex-col overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 md:px-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-12 lg:pb-10 min-[1440px]:flex min-[1440px]:flex-col min-[1440px]:items-stretch min-[1440px]:gap-0 min-[1440px]:px-5 min-[1440px]:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col items-center pb-6 pt-2 text-center md:pb-8 md:pt-6 lg:pb-0 lg:pt-0 min-[1440px]:pb-6 min-[1440px]:pt-2">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-blue-50 to-indigo-100 shadow-sm ring-1 ring-blue-100 dark:from-gray-800 dark:to-gray-800 dark:ring-gray-700 md:mb-5 md:h-28 md:w-28 md:rounded-[2rem] lg:h-32 lg:w-32 min-[1440px]:mb-4 min-[1440px]:h-20 min-[1440px]:w-20 min-[1440px]:rounded-[1.75rem]">
              <Logo className="h-12 w-auto md:h-16 lg:h-[4.5rem] min-[1440px]:h-12" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl lg:text-5xl min-[1440px]:text-2xl">Punsook Innotech</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 md:mt-2 md:text-base lg:text-lg min-[1440px]:mt-1 min-[1440px]:text-sm">ระบบบริหารจัดการรับซื้อยาง</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col md:mx-auto md:w-full md:max-w-xl lg:mx-0 lg:max-w-none lg:flex-none min-[1440px]:mx-0 min-[1440px]:max-w-none min-[1440px]:flex-1">
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20" role="alert">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="shop-slug" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  รหัสร้าน
                </label>
                <input
                  id="shop-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className={inputClassName}
                  placeholder="เช่น my-shop"
                  autoComplete="organization"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  ชื่อผู้ใช้
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClassName}
                  placeholder="กรอกชื่อผู้ใช้"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClassName} pr-14`}
                    placeholder="กรอกรหัสผ่าน"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.97 0-9-4.03-9-9 0-.834.114-1.64.328-2.404m1.836-3.33C6.378 3.89 8.098 3 10 3c4.97 0 9 4.03 9 9 0 1.902-.89 3.622-2.267 4.836M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <Link
                href="/forgot-password"
                className="inline-flex min-h-11 items-center px-1 text-sm font-semibold text-blue-600 dark:text-blue-400"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:shadow-blue-500/20 dark:hover:bg-blue-400"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>

            <div className="mt-auto space-y-3 pt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ยังไม่มีบัญชี?{' '}
                <Link href="/landing#pricing" className="font-semibold text-green-600 dark:text-green-400">
                  สมัครใช้งาน
                </Link>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">© 2025 Punsook Innotech. All rights reserved.</p>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
