export interface LicenseValidateRequest {
  licenseKey: string;
}

export interface LicenseValidateResponse {
  valid: boolean;
  expired: boolean;
  renewalRequired?: boolean;
  message: string;
  expiresAt: string | null;
  renewalDate?: string | null;
  licenseKeyMasked?: string;
  /** Signed offline license file (BEGIN/END LICENSE KEY). */
  licenseFile?: string | null;
}

export type LicenseStatus =
  | 'unknown'
  | 'missing'
  | 'valid'
  | 'expired'
  | 'invalid'
  | 'renewal_required'
  | 'error';

/** Returned by data APIs when the Electron server license is not valid. */
export const SERVER_LICENSE_REQUIRED = 'SERVER_LICENSE_REQUIRED';

/** Safe summary from GET /api/license/status. Never includes the key or .lkey. */
export interface ServerLicenseStatus {
  enforced: boolean;
  licensed: boolean;
  role: 'server' | 'client';
  status: LicenseStatus;
  message: string;
  expiresAt: string | null;
  renewalDate: string | null;
}

export interface LicenseState {
  status: LicenseStatus;
  licenseKey: string | null;
  /** Full PEM-style .lkey contents */
  licenseFile: string | null;
  expiresAt: string | null;
  renewalDate: string | null;
  lastCheckedAt: string | null;
  message: string | null;
}

export interface OfflineLicenseData {
  status: string;
  key?: string;
  groups?: string[];
  permissions?: string[];
  meta?: Record<string, string>;
  maxUses?: number;
  currentUses?: number;
  expirationDate?: string | null;
  renewalDate?: string | null;
  [key: string]: unknown;
}

export interface OfflineLicensePayload {
  signature: string;
  data: OfflineLicenseData;
}

export type OfflineVerifyResult =
  | {
      ok: true;
      status: 'VALID';
      data: OfflineLicenseData;
      expiresAt: string | null;
      renewalDate: string | null;
      message: string;
    }
  | {
      ok: false;
      status: 'EXPIRED' | 'RENEWAL_REQUIRED' | 'INVALID' | 'INVALID_SIGNATURE' | 'MISSING';
      data?: OfflineLicenseData;
      expiresAt?: string | null;
      renewalDate?: string | null;
      message: string;
    };

export interface LicenseContextType {
  status: LicenseStatus;
  isLicensed: boolean;
  isExpired: boolean;
  isLoading: boolean;
  /** True after a successful key entry until the user clicks through to login. */
  awaitingAcknowledgment: boolean;
  licenseKey: string | null;
  expiresAt: Date | null;
  renewalDate: Date | null;
  message: string | null;
  /** This screen follows another machine's license and must not collect a key. */
  delegatesToServer: boolean;
  /** Server Electron window (or a non-enforced web app) may enter a license key. */
  canManageLicense: boolean;
  activateLicense: (key: string) => Promise<{ success: boolean; message?: string }>;
  updateLicense: (key: string) => Promise<{ success: boolean; message?: string }>;
  acknowledgeActivation: () => void;
  revalidateLicense: () => Promise<void>;
  clearLicense: () => void;
}
