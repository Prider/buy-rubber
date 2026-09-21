'use client';

import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import LoginPage from '@/app/login/page';
import GamerLoader from '@/components/GamerLoader';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
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

  return <Layout>{children}</Layout>;
}
