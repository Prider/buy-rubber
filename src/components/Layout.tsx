'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';
import ModeSwitcher from './ModeSwitcher';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
  electronOnly?: boolean;
}

const NAV_ITEMS: NavigationItem[] = [
  { name: 'แดชบอร์ด', href: '/dashboard', icon: '📊' },
  { name: 'รับซื้อยาง', href: '/purchases', icon: '🚚' },
  { name: 'รายการรับซื้อ', href: '/purchases-list', icon: '📋' },
  { name: 'สมาชิก', href: '/members', icon: '👥' },
  { name: 'ค่าใช้จ่าย', href: '/expenses', icon: '💰' },
  { name: 'ประเภทสินค้า', href: '/prices', icon: '📦' },
  { name: 'รายงาน', href: '/reports', icon: '📈' },
  { name: 'สำรองข้อมูล', href: '/backup', icon: '💾', adminOnly: true, electronOnly: true },
  { name: 'ตั้งค่า', href: '/admin', icon: '⚙️', adminOnly: true, electronOnly: true },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isElectron, setIsElectron] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  // Check if running in Electron
  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && window.electron?.isElectron === true);
  }, []);

  // Redirect to login if username is Unknown (but only after auth has finished loading)
  useEffect(() => {
    if (!isLoading && user?.username === 'Unknown') {
      console.log('Unknown user detected, redirecting to login');
      router.push('/login');
    }
  }, [user?.username, router, isLoading]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const navigation = NAV_ITEMS.filter((item) => {
    // Check if item is Electron-only and we're not in Electron
    if (item.electronOnly && !isElectron) {
      return false;
    }
    // Check if item is admin-only and user is not admin
    if (item.adminOnly && user?.role !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 overflow-hidden">
                <div className="flex items-end justify-center gap-1.5 h-12">
                  <span className="w-3 bg-fuchsia-500 dark:bg-fuchsia-600 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite] shadow-[0_0_14px_rgba(217,70,239,0.75)] dark:shadow-[0_0_14px_rgba(217,70,239,0.4)]" style={{ height: '40%' }} />
                  <span className="w-3 bg-violet-500 dark:bg-violet-600 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.15s] shadow-[0_0_14px_rgba(139,92,246,0.75)] dark:shadow-[0_0_14px_rgba(139,92,246,0.4)]" style={{ height: '70%' }} />
                  <span className="w-3 bg-sky-500 dark:bg-sky-600 rounded-sm animate-[bounce_1.8s_ease-in-out_infinite_0.3s] shadow-[0_0_14px_rgba(14,165,233,0.75)] dark:shadow-[0_0_14px_rgba(14,165,233,0.4)]" style={{ height: '55%' }} />
                  <span className="w-3 bg-emerald-500 dark:bg-emerald-600 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.45s] shadow-[0_0_14px_rgba(16,185,129,0.75)] dark:shadow-[0_0_14px_rgba(16,185,129,0.4)]" style={{ height: '80%' }} />
                  <span className="w-3 bg-amber-500 dark:bg-amber-600 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite_0.6s] shadow-[0_0_14px_rgba(245,158,11,0.75)] dark:shadow-[0_0_14px_rgba(245,158,11,0.4)]" style={{ height: '50%' }} />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight">
                  <span className="text-gray-700 dark:text-white ml-1.5">
                    Punsook Innotech
                  </span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5 tracking-wide">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    v1.3.5
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <svg
                className="w-5 h-5"
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
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-nav-link={item.href}
                  className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 font-semibold shadow-sm border border-blue-200/50 dark:border-blue-700/50'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-100 dark:bg-blue-800/50' 
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                  }`}>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 px-3 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm">
                  {user?.username?.charAt(0) || 'A'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
                    {user?.username || 'ผู้ใช้งาน'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                  {user?.role || 'User'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group flex-shrink-0"
                title="ออกจากระบบ"
              >
                <svg
                  className="w-4 h-4 group-hover:scale-110 transition-transform"
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
        className={`transition-all duration-200 ${
          sidebarOpen ? 'lg:pl-64' : ''
        }`}
      >
        {/* Top bar */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left side - Menu button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
              >
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center space-x-3">
              {/* Mode Switcher - Only show in Electron */}
              {isElectron && (
                <div className="hidden md:block">
                  <ModeSwitcher />
                </div>
              )}
              
              {/* Dark Mode Toggle */}
              <DarkModeToggle />
              
              {/* Date Display */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6" ref={mainContentRef}>{children}</main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

