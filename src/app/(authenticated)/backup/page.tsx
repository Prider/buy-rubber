'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';

export default function BackupPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'admin' || user.role === 'root') {
      router.replace('/admin?tab=backup');
      return;
    }
    router.replace('/dashboard');
  }, [isLoading, router, user]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <GamerLoader className="py-12" message="กำลังเปลี่ยนหน้า..." />
    </div>
  );
}
