'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppWrapper from '@/components/AppWrapper';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    </AppWrapper>
  );
}

