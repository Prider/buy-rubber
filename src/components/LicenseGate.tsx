'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import GamerLoader from '@/components/GamerLoader';
import ActivateLicenseForm from '@/components/ActivateLicenseForm';
import LicenseBlocked from '@/components/LicenseBlocked';
import { useAppMode } from '@/contexts/AppModeContext';
import { useLicense } from '@/contexts/LicenseContext';
import { updateApiClient } from '@/lib/apiClient';

const PUBLIC_LICENSE_PATHS = ['/activate', '/landing', '/guide'];

interface LicenseGateProps {
  children: ReactNode;
}

export default function LicenseGate({ children }: LicenseGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { config, isClientMode, updateConfig } = useAppMode();
  const {
    isLoading,
    isLicensed,
    isExpired,
    status,
    message,
    expiresAt,
    awaitingAcknowledgment,
    delegatesToServer,
    clearLicense,
    revalidateLicense,
  } = useLicense();

  const isActivatePath =
    pathname === '/activate' || Boolean(pathname?.startsWith('/activate/'));
  const isLandingPath =
    pathname === '/landing' || Boolean(pathname?.startsWith('/landing/'));
  const isGuidePath =
    pathname === '/guide' || Boolean(pathname?.startsWith('/guide/'));
  const isPublicPath = PUBLIC_LICENSE_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`)
  );
  const electron = typeof window !== 'undefined' && Boolean(window.electron?.isElectron);

  useEffect(() => {
    if (isLoading || delegatesToServer) return;

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
    delegatesToServer,
    pathname,
    router,
  ]);

  if (isGuidePath) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)]">
        <GamerLoader
          fullScreen
          message={delegatesToServer ? 'กำลังตรวจสอบใบอนุญาตของเซิร์ฟเวอร์...' : 'กำลังตรวจสอบใบอนุญาต...'}
        />
      </div>
    );
  }

  if (isLandingPath) {
    return <>{children}</>;
  }

  if (delegatesToServer && !isLicensed) {
    const connectionProblem = status === 'error' || status === 'unknown';
    return (
      <LicenseBlocked
        title={connectionProblem ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' : 'ใบอนุญาตของเซิร์ฟเวอร์'}
        message={message}
        expiresAt={connectionProblem ? null : expiresAt}
        onRetry={() => {
          void revalidateLicense();
        }}
        allowServerChange={electron && isClientMode}
        serverUrl={config.serverUrl || ''}
        onServerUrlSubmit={(url) => {
          updateConfig({
            mode: 'client',
            serverUrl: url,
            clientPort: 3000,
          });
          updateApiClient({
            mode: 'client',
            serverUrl: url,
            clientPort: 3000,
          });
        }}
        onUseAsServer={
          electron
            ? () => {
                updateConfig({
                  mode: 'server',
                  serverPort: config.serverPort,
                  clientPort: 3000,
                });
                updateApiClient({
                  mode: 'server',
                  serverPort: config.serverPort,
                  clientPort: 3000,
                });
              }
            : undefined
        }
      />
    );
  }

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
