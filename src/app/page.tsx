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
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      }
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

