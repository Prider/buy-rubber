'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LicenseContextType, LicenseStatus, LicenseValidateResponse } from '@/types/license';
import {
  clearLicenseStorage,
  readLicenseFile,
  readLicenseFromStorage,
  writeLicenseToStorage,
} from '@/lib/licenseStorage';

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

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
  const [status, setStatus] = useState<LicenseStatus>('unknown');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [renewalDate, setRenewalDate] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [awaitingAcknowledgment, setAwaitingAcknowledgment] = useState(false);

  const applyResult = useCallback(
    async (licenseKey: string, result: LicenseValidateResponse, existingFile?: string | null) => {
      const nextStatus = toStatus(result);
      const lastCheckedAt = new Date().toISOString();
      const licenseFile = result.licenseFile || existingFile || null;

      await writeLicenseToStorage({
        licenseKey,
        licenseFile,
        status: nextStatus,
        expiresAt: result.expiresAt,
        renewalDate: result.renewalDate ?? null,
        lastCheckedAt,
        message: result.message,
      });

      setStatus(nextStatus);
      setExpiresAt(result.expiresAt);
      setRenewalDate(result.renewalDate ?? null);
      setMessage(result.message);
    },
    []
  );

  const revalidateLicense = useCallback(async () => {
    const stored = readLicenseFromStorage();
    const licenseFile = (await readLicenseFile()) || stored.licenseFile;

    if (!stored.licenseKey && !licenseFile) {
      setStatus('missing');
      setExpiresAt(null);
      setRenewalDate(null);
      setMessage(null);
      setIsLoading(false);
      return;
    }

    try {
      // 1) Verify saved .lkey locally (works offline via local Next/Electron server)
      if (licenseFile) {
        const offlineResult = await callValidateApi({
          mode: 'offline',
          licenseFile,
          licenseKey: stored.licenseKey || undefined,
        });

        if (offlineResult.valid) {
          await applyResult(stored.licenseKey || offlineResult.licenseKeyMasked || 'licensed', offlineResult, licenseFile);
          setIsLoading(false);
          return;
        }

        // 2) renewalDate past/near → fetch a fresh offline file online
        if (offlineResult.renewalRequired && stored.licenseKey) {
          const renewed = await callValidateApi({ licenseKey: stored.licenseKey });

          if (renewed.valid && renewed.licenseFile) {
            await applyResult(stored.licenseKey, renewed, renewed.licenseFile);
            setIsLoading(false);
            return;
          }

          if (isConnectivityFailure(renewed)) {
            setStatus('renewal_required');
            setExpiresAt(offlineResult.expiresAt);
            setRenewalDate(offlineResult.renewalDate ?? null);
            setMessage(
              'ต้องต่ออายุใบอนุญาตออฟไลน์ แต่เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาเชื่อมต่ออินเทอร์เน็ต'
            );
            setIsLoading(false);
            return;
          }

          await applyResult(stored.licenseKey, renewed, licenseFile);
          setIsLoading(false);
          return;
        }

        // Expired / invalid signature / etc.
        if (stored.licenseKey) {
          await applyResult(stored.licenseKey, offlineResult, licenseFile);
        } else {
          setStatus(toStatus(offlineResult));
          setExpiresAt(offlineResult.expiresAt);
          setRenewalDate(offlineResult.renewalDate ?? null);
          setMessage(offlineResult.message);
        }
        setIsLoading(false);
        return;
      }

      // No local file yet — require online activation fetch
      if (stored.licenseKey) {
        const result = await callValidateApi({ licenseKey: stored.licenseKey });
        await applyResult(stored.licenseKey, result, result.licenseFile);
      } else {
        setStatus('missing');
      }
    } catch {
      setStatus('error');
      setMessage('ไม่สามารถตรวจสอบใบอนุญาตได้');
    } finally {
      setIsLoading(false);
    }
  }, [applyResult]);

  useEffect(() => {
    void (async () => {
      const stored = readLicenseFromStorage();
      const licenseFile = (await readLicenseFile()) || stored.licenseFile;

      if (!stored.licenseKey && !licenseFile) {
        try {
          const probe = await callValidateApi({ licenseKey: '__skip_license_check__' });
          if (probe.valid && /SKIP_LICENSE_CHECK/i.test(probe.message || '')) {
            await applyResult('__skip_license_check__', probe);
            setIsLoading(false);
            return;
          }
        } catch {
          // fall through
        }
        setStatus('missing');
        setIsLoading(false);
        return;
      }

      // Optimistic UI while verifying
      if (stored.status === 'valid' && licenseFile) {
        setStatus('valid');
        setExpiresAt(stored.expiresAt);
        setRenewalDate(stored.renewalDate);
        setMessage(stored.message);
      } else if (stored.status === 'expired') {
        setStatus('expired');
        setExpiresAt(stored.expiresAt);
        setRenewalDate(stored.renewalDate);
        setMessage(stored.message || 'ใบอนุญาตหมดอายุ กรุณาติดต่อผู้ดูแลระบบ');
      } else {
        setStatus(stored.status === 'missing' ? 'missing' : stored.status);
        setExpiresAt(stored.expiresAt);
        setRenewalDate(stored.renewalDate);
        setMessage(stored.message);
      }

      void revalidateLicense();
    })();
  }, [revalidateLicense, applyResult]);

  const activateLicense = useCallback(
    async (key: string): Promise<{ success: boolean; message?: string }> => {
      const licenseKey = key.trim();
      if (!licenseKey) {
        return { success: false, message: 'กรุณากรอก License Key' };
      }

      // Do not toggle global isLoading — that unmounts /activate and clears form UI state.
      try {
        const result = await callValidateApi({ licenseKey });
        await applyResult(licenseKey, result, result.licenseFile);

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

  const acknowledgeActivation = useCallback(() => {
    setAwaitingAcknowledgment(false);
  }, []);

  const clearLicense = useCallback(() => {
    void clearLicenseStorage();
    setStatus('missing');
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
      isLoading,
      awaitingAcknowledgment,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      renewalDate: renewalDate ? new Date(renewalDate) : null,
      message,
      activateLicense,
      acknowledgeActivation,
      revalidateLicense,
      clearLicense,
    }),
    [
      status,
      isLoading,
      awaitingAcknowledgment,
      expiresAt,
      renewalDate,
      message,
      activateLicense,
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
