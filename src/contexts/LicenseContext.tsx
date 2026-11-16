'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { messageForRemoteLicense } from '@/lib/licenseMessages';
import {
  clearLicenseStorage,
  readLicenseFile,
  readLicenseFromStorage,
  writeLicenseToStorage,
} from '@/lib/licenseStorage';
import type {
  LicenseContextType,
  LicenseStatus,
  LicenseValidateResponse,
  ServerLicenseStatus,
} from '@/types/license';

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);
const STATUS_POLL_MS = 60_000;

function isElectronApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electron?.isElectron);
}

async function callValidateApi(
  payload: { licenseKey?: string; licenseFile?: string; mode?: 'activate' | 'offline' }
): Promise<LicenseValidateResponse> {
  const response = await fetch('/api/license/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as LicenseValidateResponse;
}

async function fetchServerLicenseStatus(url: string): Promise<ServerLicenseStatus | null> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) return null;
  const body = (await response.json()) as Partial<ServerLicenseStatus>;
  if (typeof body.licensed !== 'boolean' || typeof body.status !== 'string') return null;
  return {
    enforced: Boolean(body.enforced),
    licensed: body.licensed,
    role: body.role === 'client' ? 'client' : 'server',
    status: body.status as LicenseStatus,
    message: typeof body.message === 'string' ? body.message : '',
    expiresAt: body.expiresAt ?? null,
    renewalDate: body.renewalDate ?? null,
  };
}

function toStatus(result: LicenseValidateResponse): LicenseStatus {
  if (result.expired) return 'expired';
  if (result.renewalRequired) return 'renewal_required';
  if (result.valid) return 'valid';
  return 'invalid';
}

function isConnectivityFailure(result: LicenseValidateResponse): boolean {
  return (
    !result.valid &&
    !result.expired &&
    !result.renewalRequired &&
    /เชื่อมต่อ|หมดเวลา|LICENSE_VALIDATION_KEY|LICENSE_PUBLIC_KEY|ไม่สามารถตรวจสอบ|ตอบกลับ/i.test(
      result.message || ''
    )
  );
}

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { config, isClientMode, loading: appModeLoading } = useAppMode();
  const [status, setStatus] = useState<LicenseStatus>('unknown');
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [renewalDate, setRenewalDate] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [awaitingAcknowledgment, setAwaitingAcknowledgment] = useState(false);
  const [delegatesToServer, setDelegatesToServer] = useState(false);
  const [canManageLicense, setCanManageLicense] = useState(true);
  const [enforced, setEnforced] = useState(false);
  const resolvedKey = useRef<string | null>(null);

  const applyResult = useCallback(
    async (nextLicenseKey: string, result: LicenseValidateResponse, existingFile?: string | null) => {
      const nextStatus = toStatus(result);
      const lastCheckedAt = new Date().toISOString();
      const licenseFile = result.licenseFile || existingFile || null;

      await writeLicenseToStorage({
        licenseKey: nextLicenseKey,
        licenseFile,
        status: nextStatus,
        expiresAt: result.expiresAt,
        renewalDate: result.renewalDate ?? null,
        lastCheckedAt,
        message: result.message,
      });

      setStatus(nextStatus);
      setLicenseKey(nextLicenseKey);
      setExpiresAt(result.expiresAt);
      setRenewalDate(result.renewalDate ?? null);
      setMessage(result.message);
    },
    []
  );

  const applyDelegatedStatus = useCallback((remote: ServerLicenseStatus) => {
    setLicenseKey(null);
    setExpiresAt(remote.expiresAt);
    setRenewalDate(remote.renewalDate);
    if (remote.licensed) {
      setStatus('valid');
      setMessage(null);
      return;
    }
    const nextStatus = remote.status === 'valid' ? 'invalid' : remote.status;
    setStatus(nextStatus);
    setMessage(messageForRemoteLicense(nextStatus));
  }, []);

  const runLocalRevalidate = useCallback(async () => {
    const stored = readLicenseFromStorage();
    const licenseFile = (await readLicenseFile()) || stored.licenseFile;

    if (!stored.licenseKey && !licenseFile) {
      try {
        const probe = await callValidateApi({ licenseKey: '__skip_license_check__' });
        if (probe.valid && /SKIP_LICENSE_CHECK/i.test(probe.message || '')) {
          await applyResult('__skip_license_check__', probe);
          return;
        }
      } catch {
        // fall through
      }
      setStatus('missing');
      setLicenseKey(null);
      setExpiresAt(null);
      setRenewalDate(null);
      setMessage(null);
      return;
    }

    try {
      if (licenseFile) {
        const offlineResult = await callValidateApi({
          mode: 'offline',
          licenseFile,
          licenseKey: stored.licenseKey || undefined,
        });

        if (offlineResult.valid) {
          await applyResult(
            stored.licenseKey || offlineResult.licenseKeyMasked || 'licensed',
            offlineResult,
            licenseFile
          );
          return;
        }

        if (offlineResult.renewalRequired && stored.licenseKey) {
          const renewed = await callValidateApi({ licenseKey: stored.licenseKey });

          if (renewed.valid && renewed.licenseFile) {
            await applyResult(stored.licenseKey, renewed, renewed.licenseFile);
            return;
          }

          if (isConnectivityFailure(renewed)) {
            setStatus('renewal_required');
            setExpiresAt(offlineResult.expiresAt);
            setRenewalDate(offlineResult.renewalDate ?? null);
            setMessage(
              'ต้องต่ออายุใบอนุญาตออฟไลน์ แต่เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาเชื่อมต่ออินเทอร์เน็ต'
            );
            return;
          }

          await applyResult(stored.licenseKey, renewed, licenseFile);
          return;
        }

        if (stored.licenseKey) {
          await applyResult(stored.licenseKey, offlineResult, licenseFile);
        } else {
          setStatus(toStatus(offlineResult));
          setExpiresAt(offlineResult.expiresAt);
          setRenewalDate(offlineResult.renewalDate ?? null);
          setMessage(offlineResult.message);
        }
        return;
      }

      if (stored.licenseKey) {
        const result = await callValidateApi({ licenseKey: stored.licenseKey });
        await applyResult(stored.licenseKey, result, result.licenseFile);
      } else {
        setStatus('missing');
      }
    } catch {
      setStatus('error');
      setMessage('ไม่สามารถตรวจสอบใบอนุญาตได้');
    }
  }, [applyResult]);

  const revalidateLicense = useCallback(async () => {
    if (appModeLoading) return;
    const checkKey = `${isClientMode ? 'client' : 'server'}:${config.serverUrl || ''}`;
    if (resolvedKey.current !== checkKey) {
      setIsLoading(true);
    }
    try {
      if (isClientMode) {
        setDelegatesToServer(true);
        setCanManageLicense(false);
        setEnforced(true);
        if (!config.serverUrl) {
          setStatus('error');
          setLicenseKey(null);
          setExpiresAt(null);
          setRenewalDate(null);
          setMessage(messageForRemoteLicense('error'));
          return;
        }
        try {
          const remote = await fetchServerLicenseStatus(
            `${config.serverUrl.replace(/\/$/, '')}/api/license/status`
          );
          if (!remote) {
            setStatus('error');
            setLicenseKey(null);
            setMessage(messageForRemoteLicense('error'));
            return;
          }
          applyDelegatedStatus(remote);
        } catch {
          setStatus('error');
          setLicenseKey(null);
          setMessage(messageForRemoteLicense('error'));
        }
        return;
      }

      let localStatus: ServerLicenseStatus | null = null;
      try {
        localStatus = await fetchServerLicenseStatus('/api/license/status');
      } catch {
        localStatus = null;
      }

      const electron = isElectronApp();
      if (localStatus?.enforced && !electron) {
        setEnforced(true);
        setDelegatesToServer(true);
        setCanManageLicense(false);
        applyDelegatedStatus(localStatus);
        return;
      }

      setDelegatesToServer(false);
      setCanManageLicense(true);
      setEnforced(Boolean(localStatus?.enforced));

      if (localStatus?.enforced && localStatus.licensed) {
        const stored = readLicenseFromStorage();
        setStatus('valid');
        setLicenseKey(stored.licenseKey);
        setExpiresAt(localStatus.expiresAt);
        setRenewalDate(localStatus.renewalDate);
        setMessage(localStatus.message);
        return;
      }

      await runLocalRevalidate();
    } finally {
      resolvedKey.current = `${isClientMode ? 'client' : 'server'}:${config.serverUrl || ''}`;
      setIsLoading(false);
    }
  }, [appModeLoading, isClientMode, config.serverUrl, applyDelegatedStatus, runLocalRevalidate]);

  useEffect(() => {
    if (appModeLoading) return;
    void revalidateLicense();
  }, [appModeLoading, revalidateLicense]);

  useEffect(() => {
    if (!delegatesToServer && !enforced) return;

    const timer = window.setInterval(() => {
      void revalidateLicense();
    }, STATUS_POLL_MS);
    const onFocus = () => {
      void revalidateLicense();
    };
    const onRequired = () => {
      void revalidateLicense();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('server-license-required', onRequired);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('server-license-required', onRequired);
    };
  }, [delegatesToServer, enforced, revalidateLicense]);

  const activateLicense = useCallback(
    async (key: string): Promise<{ success: boolean; message?: string }> => {
      const nextLicenseKey = key.trim();
      if (!nextLicenseKey) {
        return { success: false, message: 'กรุณากรอก License Key' };
      }

      try {
        const result = await callValidateApi({ licenseKey: nextLicenseKey });
        await applyResult(nextLicenseKey, result, result.licenseFile);

        if (result.valid) {
          setAwaitingAcknowledgment(true);
          return { success: true, message: result.message };
        }

        setAwaitingAcknowledgment(false);
        return {
          success: false,
          message:
            result.message ||
            (result.expired
              ? 'ใบอนุญาตหมดอายุ กรุณาติดต่อผู้ดูแลระบบ'
              : 'ใบอนุญาตไม่ถูกต้อง'),
        };
      } catch {
        setAwaitingAcknowledgment(false);
        setStatus('error');
        setMessage('ไม่สามารถตรวจสอบใบอนุญาตได้');
        return { success: false, message: 'ไม่สามารถตรวจสอบใบอนุญาตได้' };
      }
    },
    [applyResult]
  );

  const updateLicense = useCallback(
    async (key: string): Promise<{ success: boolean; message?: string }> => {
      const nextKey = key.trim();
      if (!nextKey) {
        return { success: false, message: 'กรุณากรอก License Key' };
      }

      try {
        const result = await callValidateApi({ licenseKey: nextKey });
        if (!result.valid) {
          return {
            success: false,
            message:
              result.message ||
              (result.expired
                ? 'ใบอนุญาตหมดอายุ กรุณาติดต่อผู้ดูแลระบบ'
                : 'ใบอนุญาตไม่ถูกต้อง'),
          };
        }

        await applyResult(nextKey, result, result.licenseFile);
        setAwaitingAcknowledgment(false);
        return { success: true, message: result.message };
      } catch {
        return { success: false, message: 'ไม่สามารถตรวจสอบใบอนุญาตได้' };
      }
    },
    [applyResult]
  );

  const acknowledgeActivation = useCallback(() => {
    setAwaitingAcknowledgment(false);
  }, []);

  const clearLicense = useCallback(() => {
    void clearLicenseStorage();
    setStatus('missing');
    setLicenseKey(null);
    setExpiresAt(null);
    setRenewalDate(null);
    setMessage(null);
    setAwaitingAcknowledgment(false);
  }, []);

  const value: LicenseContextType = useMemo(
    () => ({
      status,
      isLicensed: status === 'valid',
      isExpired: status === 'expired',
      isLoading: isLoading || appModeLoading,
      awaitingAcknowledgment,
      licenseKey,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      renewalDate: renewalDate ? new Date(renewalDate) : null,
      message,
      delegatesToServer,
      canManageLicense,
      activateLicense,
      updateLicense,
      acknowledgeActivation,
      revalidateLicense,
      clearLicense,
    }),
    [
      status,
      isLoading,
      appModeLoading,
      awaitingAcknowledgment,
      licenseKey,
      expiresAt,
      renewalDate,
      message,
      delegatesToServer,
      canManageLicense,
      activateLicense,
      updateLicense,
      acknowledgeActivation,
      revalidateLicense,
      clearLicense,
    ]
  );

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}
