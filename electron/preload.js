const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  readLicenseFile: () => ipcRenderer.invoke('license:read'),
  writeLicenseFile: (contents) => ipcRenderer.invoke('license:write', contents),
  clearLicenseFile: () => ipcRenderer.invoke('license:clear'),
  onWindowMaximized: (callback) => {
    ipcRenderer.on('window-maximized', (event, isMaximized) => callback(isMaximized));
  },
  platform: process.platform,
  isElectron: true,
});

