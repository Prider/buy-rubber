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
    // Check if running in Electron
    const checkElectron = (isAuthenticated: boolean, isLoading: boolean) => {
      const isElectronEnv = typeof window !== 'undefined' && (window as any).electron?.isElectron === true;
      
      // Redirect based on environment
      if (isElectronEnv) {
        // Electron: redirect to dashboard
        if(!isLoading && isAuthenticated) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } else {
        // Web: redirect to landing page
        router.replace('/landing');
      }
    };

    // Check immediately
    checkElectron(isAuthenticated, isLoading);
    
    // Also check after a short delay in case electron object loads asynchronously
    const timeout = setTimeout(checkElectron, 100);
    
    return () => clearTimeout(timeout);
  }, [isAuthenticated, isLoading, router]);

  return (
    <AppWrapper>
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 ">
        <GamerLoader fullScreen />
      </div>
    </AppWrapper>
  );
}

