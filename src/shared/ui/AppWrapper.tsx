'use client';

import { useAuth } from '@/platform/AuthContext';
import Layout, { type NavItem } from '@/shared/layout/Layout';
import LoginPage from '@/app/login/page';
import GamerLoader from '@/shared/ui/GamerLoader';

interface AppWrapperProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

export default function AppWrapper({ children, navItems }: AppWrapperProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <GamerLoader fullScreen message="กำลังโหลด..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Layout navItems={navItems}>{children}</Layout>;
}
