'use client';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';
import ModeSwitcher from './ModeSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import useArrowFocusNavigation, { FOCUSABLE_SELECTORS, isFocusable } from '@/hooks/useArrowFocusNavigation';
import appIcon from '../../electron/icon.png';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavigationItem[] = [
  { name: 'แดชบอร์ด', href: '/dashboard', icon: '📊' },
  { name: 'รับซื้อยาง', href: '/purchases', icon: '🛒' },
  { name: 'สมาชิก', href: '/members', icon: '👥' },
  { name: 'ค่าใช้จ่าย', href: '/expenses', icon: '💰' },
  { name: 'ตั้งราคา', href: '/prices', icon: '💲' },
  { name: 'รายงาน', href: '/reports', icon: '📈' },
  { name: 'สำรองข้อมูล', href: '/backup', icon: '💾', adminOnly: true },
  { name: 'ตั้งค่า', href: '/admin', icon: '⚙️', adminOnly: true },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  useArrowFocusNavigation();

  const focusElement = useCallback((element?: HTMLElement | null) => {
    element?.focus({ preventScroll: true });
  }, []);

  const getFocusableWithin = useCallback((root: HTMLElement | null) => {
    if (!root) {
      return [];
    }

    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(isFocusable);
  }, []);

  const focusActiveNavLink = useCallback(() => {
    if (!pathname || pathname === '/login') {
      return false;
    }

    const sidebarEl = sidebarRef.current;
    if (!sidebarEl) {
      return false;
    }

    const activeLink = sidebarEl.querySelector<HTMLElement>(`[data-nav-link="${pathname}"]`);
    if (!activeLink) {
      return false;
    }

    focusElement(activeLink);
    return true;
  }, [focusElement, pathname]);

  const focusFirstMainElement = useCallback(() => {
    const [firstFocusable] = getFocusableWithin(mainContentRef.current);
    if (!firstFocusable) {
      return false;
    }
    focusElement(firstFocusable);
    return true;
  }, [focusElement, getFocusableWithin]);

  useEffect(() => {
    const currentActiveElement = document.activeElement;
    if (currentActiveElement && currentActiveElement !== document.body) {
      return;
    }

    focusActiveNavLink();
  }, [focusActiveNavLink]);

  const handleDirectionalNavigation = useCallback((event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }

    const sidebarEl = sidebarRef.current;
    const mainEl = mainContentRef.current;
    if (!sidebarEl || !mainEl) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement) {
      return;
    }

    const isInSidebar = sidebarEl.contains(activeElement);
    const isInMain = mainEl.contains(activeElement);

    if (event.key === 'ArrowRight' && isInSidebar) {
      const focused = focusFirstMainElement();
      if (focused) {
        event.preventDefault();
      }
    }

    if (event.key === 'ArrowLeft' && isInMain) {
      const focusedNav = focusActiveNavLink();
      if (focusedNav) {
        event.preventDefault();
        return;
      }

      const [firstSidebarElement] = getFocusableWithin(sidebarEl);
      if (firstSidebarElement) {
        event.preventDefault();
        focusElement(firstSidebarElement);
      }
    }
  }, [focusActiveNavLink, focusElement, focusFirstMainElement, getFocusableWithin]);

  useEffect(() => {
    document.addEventListener('keydown', handleDirectionalNavigation);
    return () => {
      document.removeEventListener('keydown', handleDirectionalNavigation);
    };
  }, [handleDirectionalNavigation]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const navigation = NAV_ITEMS.filter((item) => {
    if (!item.adminOnly) {
      return true;
    }
    return user?.role === 'admin';
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
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                <Image
                  src={appIcon}
                  alt="Punsook Innotech logo"
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Punsook Innotech
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">v1.0.0</p>
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
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user?.username || 'ผู้ใช้งาน'}
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
              {/* Mode Switcher */}
              <div className="hidden md:block">
                <ModeSwitcher />
              </div>
              
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

