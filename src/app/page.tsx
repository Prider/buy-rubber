'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/types/user';
import AppWrapper from '@/components/AppWrapper';
import GamerLoader from '@/components/GamerLoader';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push(homePathForRole(user?.role));
      }
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  return (
    <AppWrapper>
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 ">
        <GamerLoader fullScreen />
      </div>
    </AppWrapper>
  );
}

