'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';
import HeaderTime from './HeaderTime';
import Logo from './Logo';
import ModeSwitcher from './ModeSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { getApiClient } from '@/lib/apiClient';
import { normalizeSlipFontSize, SLIP_FONT_SIZE_STORAGE_KEY } from '@/lib/slipFont';
import { normalizeSlipPaperSize, SLIP_PAPER_SIZE_STORAGE_KEY } from '@/lib/slipPaper';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
  electronOnly?: boolean;
}

const NAV_ITEMS: NavigationItem[] = [
  { name: 'แดชบอร์ด', href: '/dashboard', icon: '📊' },
  { name: 'สต็อกสินค้า', href: '/stock', icon: '📦' },
  { name: 'รับซื้อยาง', href: '/purchases', icon: '🛒' },
  { name: 'ขายสินค้า', href: '/sales', icon: '🚚' },
  { name: 'ประวัติการรับซื้อ', href: '/purchases-list', icon: '📋' },
  { name: 'สมาชิก', href: '/members', icon: '👥' },
  { name: 'บริษัทปลายทาง', href: '/destination-companies', icon: '🏢' },
  { name: 'ค่าใช้จ่าย', href: '/expenses', icon: '💰' },
  { name: 'รายงาน', href: '/reports', icon: '📈' },
  { name: 'สำรองข้อมูล', href: '/backup', icon: '💾', adminOnly: true, electronOnly: true },
  { name: 'ตั้งค่า', href: '/admin', icon: '⚙️', adminOnly: true },
];

interface LayoutProps {
  children: ReactNode;
}

type SidebarViewport = 'mobile' | 'tablet' | 'desktop';

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  // Desktop: collapsed icon rail vs full labels. Mobile/tablet overlay starts closed.
  const [collapsed, setCollapsed] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [viewport, setViewport] = useState<SidebarViewport>('desktop');
  const [isElectron, setIsElectron] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  const labelsVisible =
    viewport === 'mobile' || (viewport === 'tablet' ? overlayOpen : !collapsed);
  const sidebarExpanded = viewport === 'desktop' ? !collapsed : overlayOpen;

  // Check if running in Electron
  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && window.electron?.isElectron === true);
  }, []);

  // Mobile (<768): off-canvas drawer.
  // Tablet (768–1023): icon rail, menu expands an overlay.
  // Desktop (≥1024): persistent sidebar that can collapse to icons.
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    const update = () => {
      const next: SidebarViewport = mobileQuery.matches
        ? 'mobile'
        : desktopQuery.matches
          ? 'desktop'
          : 'tablet';
      setViewport(next);
      if (next === 'desktop') {
        setOverlayOpen(false);
      }
    };

    update();
    mobileQuery.addEventListener('change', update);
    desktopQuery.addEventListener('change', update);
    return () => {
      mobileQuery.removeEventListener('change', update);
      desktopQuery.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    setOverlayOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!overlayOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOverlayOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [overlayOpen]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    if (viewport === 'mobile' && !overlayOpen) {
      sidebar.setAttribute('inert', '');
    } else {
      sidebar.removeAttribute('inert');
    }
  }, [viewport, overlayOpen]);

  const toggleSidebar = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setCollapsed((value) => !value);
      return;
    }
    setOverlayOpen((value) => !value);
  };

  // Preload slip settings into localStorage so slipGenerator can render correctly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const NAME_KEY = 'slip_companyName';
    const ADDRESS_KEY = 'slip_companyAddress';
    const FOOTER_KEY = 'slip_footerText';

    const loadSlipSettings = async () => {
      try {
        const apiClient = getApiClient();
        const data = await apiClient.get<{
          companyName: string;
          companyAddress: string;
          footerText?: string;
          fontSize?: string;
          paperSize?: string;
        }>('/api/slip/settings');
        // Always overwrite with server values so updates done in Electron propagate to Browser.
        if (data?.companyName) window.localStorage.setItem(NAME_KEY, data.companyName);
        if (data?.companyAddress) window.localStorage.setItem(ADDRESS_KEY, data.companyAddress);
        if (data?.footerText) window.localStorage.setItem(FOOTER_KEY, data.footerText);
        window.localStorage.setItem(SLIP_FONT_SIZE_STORAGE_KEY, normalizeSlipFontSize(data?.fontSize));
        const paper = normalizeSlipPaperSize(data?.paperSize);
        window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, paper);
      } catch {
        // If it fails, slipGenerator will fall back to its defaults.
      }
    };

    loadSlipSettings();
  }, []);


  // Redirect to login if username is Unknown (but only after auth has finished loading)
  useEffect(() => {
    if (!isLoading && user?.username === 'Unknown') {
      router.push('/login');
    }
  }, [user?.username, router, isLoading]);

  const handleLogout = async () => {
    await logout();
  };

  const navigation = NAV_ITEMS.filter((item) => {
    // Check if item is Electron-only and we're not in Electron
    if (item.electronOnly && !isElectron) {
      return false;
    }
    // Check if item is admin-only and user is not admin
    if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'root') {
      return false;
    }
    return true;
  });

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar — drawer on phones, icon rail on tablets, persistent column on desktop */}
      <aside
        id="app-sidebar"
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden border-r border-gray-200 bg-white transition-[width,transform] duration-200 ease-in-out dark:border-gray-700 dark:bg-gray-800 ${
          overlayOpen
            ? 'w-[min(12rem,calc(100vw-3rem))] translate-x-0 shadow-2xl md:w-48 md:shadow-2xl'
            : 'w-[min(12rem,calc(100vw-3rem))] -translate-x-full md:w-16 md:translate-x-0 md:shadow-none'
        } ${collapsed ? 'lg:w-16 lg:translate-x-0 lg:shadow-none' : 'lg:w-48 lg:translate-x-0 lg:shadow-none'}`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={`relative flex items-center justify-center border-b border-gray-200/50 transition-all duration-200 dark:border-gray-700/50 ${
            labelsVisible ? 'px-4 py-4' : 'px-2 py-4'
          }`}>
            <Link href="/dashboard" className="group flex flex-col items-center justify-center" onClick={() => setOverlayOpen(false)}>
              <Logo
                className={`transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                  labelsVisible ? 'h-10 w-auto' : 'h-8 w-8'
                }`}
              />
            </Link>
            {overlayOpen && (
              <button
                onClick={() => setOverlayOpen(false)}
                className="absolute right-3 rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700/50 dark:hover:text-gray-300 lg:hidden"
                aria-label="Close sidebar"
              >
                <svg
                  className="h-4 w-4"
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
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-2 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item, index) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === '/reports' && pathname.startsWith('/reports/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-nav-link={item.href}
                    onClick={() => setOverlayOpen(false)}
                    className={`group relative flex min-h-11 items-center rounded-lg px-2 py-2.5 opacity-0 transition-all duration-300 ease-out animate-fadeInUp ${
                      labelsVisible ? '' : 'justify-center'
                    } ${
                      isActive
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    style={{
                      animationDelay: `${index * 40}ms`,
                    }}
                    title={labelsVisible ? undefined : item.name}
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
                    <span className={`relative z-10 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ${
                      labelsVisible ? 'ml-2 w-auto opacity-100' : 'ml-0 w-0 opacity-0'
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

          {/* User info */}
          <div className={`border-t border-gray-200/50 pb-[max(1rem,env(safe-area-inset-bottom))] transition-all duration-200 dark:border-gray-700/50 ${
            labelsVisible ? 'px-3 pt-4' : 'px-1 pt-3'
          }`}>
            <div className={`flex transition-all duration-200 ${
              labelsVisible ? 'items-center gap-3' : 'flex-col items-center gap-2'
            }`}>
              <div className="flex-shrink-0">
                <div className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white shadow-sm ${
                  labelsVisible ? 'h-10 w-10 rounded-xl text-base' : 'h-8 w-8 rounded-lg text-sm'
                }`}>
                  {user?.username?.charAt(0) || 'A'}
                </div>
              </div>
              {labelsVisible && (
                <div className="min-w-0 flex-1 overflow-hidden transition-all duration-200">
                  <p className="truncate text-sm font-semibold">
                    <span className="animate-gradient bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
                      {user?.username || 'ผู้ใช้งาน'}
                    </span>
                  </p>
                  <p className="truncate text-xs capitalize text-gray-500 dark:text-gray-400">
                    {user?.role || 'User'}
                  </p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="group flex-shrink-0 rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="ออกจากระบบ"
                aria-label="ออกจากระบบ"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex h-full min-h-0 min-w-0 flex-col transition-[padding] duration-200 md:pl-16 ${
          collapsed ? 'lg:pl-16' : 'lg:pl-48'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 shrink-0 border-b border-gray-200/50 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-800/80">
          <div className="relative flex items-center justify-between gap-2 px-3 py-3 sm:px-4 lg:px-6">
            <button
                onClick={toggleSidebar}
                className="group relative z-10 shrink-0 rounded-lg p-2 text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                aria-controls="app-sidebar"
                aria-expanded={sidebarExpanded}
                aria-label={sidebarExpanded ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarExpanded ? (
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

            <h1 className="min-w-0 flex-1 truncate text-center text-sm font-bold sm:text-base lg:text-lg">
                <span className="text-fuchsia-500 dark:text-fuchsia-400">P</span>
                <span className="text-violet-500 dark:text-violet-400">u</span>
                <span className="text-violet-500 dark:text-sky-400">n</span>
                <span className="text-emerald-500 dark:text-emerald-400">s</span>
                <span className="text-amber-500 dark:text-amber-400">o</span>
                <span className="text-fuchsia-500 dark:text-amber-400">o</span>
                <span className="text-violet-500 dark:text-violet-400">k</span>
                <span className="hidden dark:text-white sm:inline"> Innotech</span>
                <span className="hidden dark:text-white md:inline"> ( {process.env.NEXT_PUBLIC_COMPANY_NAME || 'สินทวี'} )</span>
            </h1>

            {/* Right side - Controls */}
            <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Mode Switcher - Only show in Electron */}
              {isElectron && (
                <div className="hidden md:block">
                  <ModeSwitcher />
                </div>
              )}
              
              {/* Dark Mode Toggle */}
              <DarkModeToggle />
              
              {/* Date Display */}
              <HeaderTime />
            </div>
          </div>
        </header>

        {/* Page content — flex-1 + min-h-0 so pages (e.g. sales table) can fill remaining viewport height */}
        <main
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4 lg:p-6"
          ref={mainContentRef}
        >
          {children}
        </main>
      </div>

      {overlayOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOverlayOpen(false)}
        />
      )}
    </div>
  );
}

