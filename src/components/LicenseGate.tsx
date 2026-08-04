'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import GamerLoader from '@/components/GamerLoader';
import ActivateLicenseForm from '@/components/ActivateLicenseForm';
import LicenseBlocked from '@/components/LicenseBlocked';
import { useLicense } from '@/contexts/LicenseContext';

const PUBLIC_LICENSE_PATHS = ['/activate', '/landing'];

interface LicenseGateProps {
  children: ReactNode;
}

export default function LicenseGate({ children }: LicenseGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isLoading,
    isLicensed,
    isExpired,
    status,
    message,
    expiresAt,
    awaitingAcknowledgment,
    clearLicense,
  } = useLicense();

  const isActivatePath =
    pathname === '/activate' || Boolean(pathname?.startsWith('/activate/'));
  const isLandingPath =
    pathname === '/landing' || Boolean(pathname?.startsWith('/landing/'));
  const isPublicPath = PUBLIC_LICENSE_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`)
  );

  useEffect(() => {
    if (isLoading) return;

    // Keep the success screen on /activate until the user clicks through.
    if (awaitingAcknowledgment) {
      if (!isActivatePath) {
        router.replace('/activate');
      }
      return;
    }

    if (!isLicensed && !isExpired && status === 'missing' && !isPublicPath) {
      router.replace('/activate');
    }
  }, [
    isLoading,
    isLicensed,
    isExpired,
    status,
    isPublicPath,
    isActivatePath,
    awaitingAcknowledgment,
    pathname,
    router,
  ]);

  if (isLoading && !isActivatePath) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <GamerLoader fullScreen message="กำลังตรวจสอบใบอนุญาต..." />
      </div>
    );
  }

  if (isLandingPath) {
    return <>{children}</>;
  }

  // After a successful key entry, stay on the activate success UI until acknowledged.
  if (awaitingAcknowledgment) {
    if (isActivatePath) {
      return <>{children}</>;
    }
    return <ActivateLicenseForm redirectTo="/login" />;
  }

  if (isExpired || status === 'expired' || status === 'renewal_required') {
    return (
      <LicenseBlocked
        message={
          message ||
          (status === 'renewal_required'
            ? 'ต้องต่ออายุใบอนุญาตออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วเปิดแอปอีกครั้ง'
            : undefined)
        }
        expiresAt={expiresAt}
        onEnterNewKey={() => {
          clearLicense();
          router.replace('/activate');
        }}
      />
    );
  }

  if (isActivatePath) {
    return <>{children}</>;
  }

  if (!isLicensed) {
    return <ActivateLicenseForm redirectTo="/login" />;
  }

  return <>{children}</>;
}
