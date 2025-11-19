'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppWrapper from '@/components/AppWrapper';
import GamerLoader from '@/components/GamerLoader';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to load, then redirect based on authentication status
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      }
      // If not authenticated, AppWrapper will show login page
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <AppWrapper>
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 ">
        <GamerLoader fullScreen />
      </div>
    </AppWrapper>
  );
}

