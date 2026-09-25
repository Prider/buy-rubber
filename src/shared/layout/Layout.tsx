'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import DarkModeToggle from '@/shared/ui/DarkModeToggle';
import Logo from '@/shared/ui/Logo';
import { useAuth } from '@/platform/AuthContext';
import { getApiClient } from '@/shared/apiClient';
import { normalizeSlipPaperSize, SLIP_PAPER_SIZE_STORAGE_KEY } from '@/shared/slipPaper';
import WaitingForPayment from '@/platform/ui/WaitingForPayment';

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

interface LayoutProps {
  children: ReactNode;
  navItems: NavItem[];
}

export default function Layout({ children, navItems }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveStatus, setLiveStatus] = useState(user?.tenantStatus);
  const [shopEmail, setShopEmail] = useState<string | null | undefined>(undefined);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  // Preload slip settings into localStorage so slipGenerator can render correctly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const NAME_KEY = 'slip_companyName';
    const ADDRESS_KEY = 'slip_companyAddress';

    const loadSlipSettings = async () => {
      try {
        const apiClient = getApiClient();
        const data = await apiClient.get<{
          companyName: string;
          companyAddress: string;
          paperSize?: string;
        }>('/api/slip/settings');
        // Always overwrite with server values so slip setting updates propagate.
        if (data?.companyName) window.localStorage.setItem(NAME_KEY, data.companyName);
        if (data?.companyAddress) window.localStorage.setItem(ADDRESS_KEY, data.companyAddress);
        const paper = normalizeSlipPaperSize(data?.paperSize);
        window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, paper);
      } catch {
        // If it fails, slipGenerator will fall back to its defaults.
      }
    };

    loadSlipSettings();
  }, []);

  useEffect(() => {
    const token = typeof window === 'undefined' ? null : localStorage.getItem('auth_token');
    if (!token) {
      setShopEmail(null);
      return;
    }
    fetch('/api/tenant/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.tenantStatus) {
          setLiveStatus(data.tenantStatus);
        }
        setShopEmail(typeof data.email === 'string' && data.email ? data.email : null);
      })
      .catch(() => setShopEmail(null));
  }, [user?.id]);


  // Redirect to login if username is Unknown (but only after auth has finished loading)
  useEffect(() => {
    if (!isLoading && user?.username === 'Unknown') {
      router.push('/login');
    }
  }, [user?.username, router, isLoading]);

  const handleLogout = async () => {
    await logout();
  };

  const navigation = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'root') {
      return false;
    }
    return true;
  });

  const accountLocked = liveStatus === 'not_yet_payment' || liveStatus === 'pending_payment' || liveStatus === 'rejected';
  const showWaitingScreen = accountLocked && pathname !== '/profile' && pathname !== '/signup/payment';

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-gray-50 dark:bg-gray-900">
      {!accountLocked && (
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-200 ease-in-out ${
          sidebarOpen 
            ? 'w-44 translate-x-0' 
            : 'lg:w-16 lg:translate-x-0 -translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-center relative border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-200 ${
            sidebarOpen ? 'px-4 py-4' : 'px-2 py-4'
          }`}>
            <Link href="/dashboard" className="flex flex-col items-center justify-center space-y-2 group">
              <Logo
                className={`transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                  sidebarOpen ? 'h-10 w-auto' : 'h-8 w-auto'
                }`}
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute right-5 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors duration-150"
              aria-label="Close sidebar"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-2 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item, index) => {
                // Keep "กำไร/ขาดทุน" highlighted on nested routes like /reports/profit-loss/gangs
                const isActive =
                  pathname === item.href ||
                  (item.href === '/reports/profit-loss' &&
                    pathname.startsWith('/reports/profit-loss/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-nav-link={item.href}
                    className={`group relative flex items-center rounded-lg transition-all duration-300 ease-out opacity-0 animate-fadeInUp ${
                      sidebarOpen ? 'px-2 py-2.5' : 'px-2 py-2.5 justify-center'
                    } ${
                      isActive
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    style={{
                      animationDelay: `${index * 40}ms`,
                    }}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    {/* Active indicator - animated right border */}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-l-full shadow-lg shadow-blue-500/50 dark:shadow-blue-400/30 animate-slideIn" />
                    )}
                    
                    {/* Background glow on active */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-lg -z-0 animate-fadeIn" />
                    )}

                    {/* Icon container */}
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 scale-110 shadow-sm shadow-blue-200/50 dark:shadow-blue-900/30'
                        : 'bg-transparent group-hover:bg-gray-100/50 dark:group-hover:bg-gray-700/30 group-hover:scale-105'
                    }`}>
                      <span className={`text-base transition-transform duration-300 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      }`}>
                        {item.icon}
                      </span>
                    </div>

                    {/* Label */}
                    <span className={`relative z-10 text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${
                      sidebarOpen ? 'ml-2 opacity-100' : 'ml-0 w-0 opacity-0'
                    } ${
                      isActive ? 'font-semibold' : 'font-normal'
                    }`}>
                      {item.name}
                    </span>

                    {/* Hover effect - subtle background */}
                    <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-700/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>
      )}

      {/* Main content */}
      <div
        className={`flex h-full min-h-0 min-w-0 flex-col transition-all duration-200 ${
          accountLocked ? '' : sidebarOpen ? 'lg:pl-44' : 'lg:pl-16'
        }`}
      >
        {/* Top bar */}
        <header className="shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 shadow-sm">
          <div className="relative flex items-center justify-between px-3 py-3 sm:px-6">
            {/* Left side - Menu button */}
            <div className="flex items-center space-x-4">
              {!accountLocked && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? (
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
              )}
              
            </div>

            {/* Center - Company name */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:text-white bg-clip-text text-transparent"> 
                <span className="text-fuchsia-500 dark:text-fuchsia-400">P</span>
                <span className="text-violet-500 dark:text-violet-400">u</span>
                <span className="text-violet-500 dark:text-sky-400">n</span>
                <span className="text-emerald-500 dark:text-emerald-400">s</span>
                <span className="text-amber-500 dark:text-amber-400">o</span>
                <span className="text-fuchsia-500 dark:text-amber-400">o</span>
                <span className="text-violet-500 dark:text-violet-400">k</span>
                <span className="dark:text-white">  Innotech </span>
              </h1>
            </div>

            {/* Right side - Account and controls */}
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200/70 bg-gray-50/80 py-1 pl-1 pr-2 dark:border-gray-700/70 dark:bg-gray-900/40">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-sm">
                  {user?.username?.charAt(0) || 'A'}
                </div>
                <div className="min-w-0 max-w-[7.5rem] sm:max-w-[12rem]">
                  <p className="truncate text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
                    {user?.username || 'ผู้ใช้งาน'}
                  </p>
                  <p
                    className="truncate text-xs leading-tight text-gray-500 dark:text-gray-400"
                    title={shopEmail || undefined}
                  >
                    {shopEmail === undefined ? '…' : shopEmail || 'ยังไม่มีอีเมล'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="ออกจากระบบ"
                  aria-label="ออกจากระบบ"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
              <DarkModeToggle />
            </div>
          </div>
        </header>

        {/* Page content — flex-1 + min-h-0 so pages (e.g. sales table) can fill remaining viewport height */}
        <main
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-6"
          ref={mainContentRef}
        >
          {showWaitingScreen ? (
            <WaitingForPayment
              status={
                liveStatus === 'rejected'
                  ? 'rejected'
                  : liveStatus === 'not_yet_payment'
                    ? 'not_yet_payment'
                    : 'pending_payment'
              }
            />
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile overlay */}
      {!accountLocked && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

