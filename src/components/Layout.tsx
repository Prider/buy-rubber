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
        className={`fixed inset-y-0 left-0 z-50 w-48 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center relative px-4 py-4 pb-2border-b border-gray-200/50 dark:border-gray-700/50">
            <Link href="/dashboard" className="flex flex-col items-center justify-center space-y-2 group">
              {/* Graph/Chart Icon */}
              <svg 
                className="w-10 h-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ overflow: 'visible' }}
              >
                {/* Chart bars */}
                <g>
                  <rect 
                    x="2" 
                    y="11" 
                    width="4" 
                    height="7" 
                    fill="#ec4899" 
                    rx="1.5"
                  />
                  <rect 
                    x="7" 
                    y="7" 
                    width="4" 
                    height="11" 
                    fill="#a855f7" 
                    rx="1.5"
                  />
                  <rect 
                    x="12" 
                    y="5" 
                    width="4" 
                    height="13" 
                    fill="#3b82f6" 
                    rx="1.5"
                  />
                  <rect 
                    x="17" 
                    y="9" 
                    width="4" 
                    height="9" 
                    fill="#10b981" 
                    rx="1.5"
                  />
                </g>
              </svg>

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
            <div className="space-y-0.5">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-nav-link={item.href}
                    className={`group relative flex items-center px-2 py-1.5 rounded-lg transition-all duration-300 ease-out opacity-0 animate-fadeInUp ${
                      isActive
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                    style={{
                      animationDelay: `${index * 40}ms`,
                    }}
                  >
                    {/* Active indicator - animated right border */}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-l-full shadow-lg shadow-blue-500/50 dark:shadow-blue-400/30 animate-slideIn" />
                    )}
                    
                    {/* Background glow on active */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-lg -z-0 animate-fadeIn" />
                    )}

                    {/* Icon container */}
                    <div className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 ${
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
                    <span className={`relative z-10 ml-2 text-sm font-medium transition-all duration-300 ${
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
          sidebarOpen ? 'lg:pl-48' : ''
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

