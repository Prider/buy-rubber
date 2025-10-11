export interface ElectronAPI {
  getAppPath: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  getDbPath: () => Promise<string>;
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

