export interface ElectronAPI {
  getAppPath: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  getDbPath: () => Promise<string>;
  readLicenseFile: () => Promise<string | null>;
  writeLicenseFile: (contents: string) => Promise<boolean>;
  clearLicenseFile: () => Promise<boolean>;
  onWindowMaximized: (callback: (isMaximized: boolean) => void) => void;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
