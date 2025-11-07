const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Check if we're in development mode by looking for .next folder
const nextPath = path.join(__dirname, '..', '.next');
const isDev = !fs.existsSync(nextPath) || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'Punsook Innotech - ระบบบริหารจัดการรับซื้อน้ำยาง',
  });

  // Load the Next.js app
  if (isDev) {
    // In development, just load from the dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, start a local server for Next.js
    // Get the app path - in packaged apps, resources are in app.getAppPath()
    const appPath = app.isPackaged 
      ? app.getAppPath()
      : path.join(__dirname, '..');
    
    console.log('App path:', appPath);
    console.log('Is packaged:', app.isPackaged);
    
    const startServer = require('./server');
    startServer(appPath)
      .then((port) => {
        console.log(`Loading window at http://localhost:${port}`);
        mainWindow.loadURL(`http://localhost:${port}`);
        
        // Show window once loaded
        mainWindow.webContents.once('did-finish-load', () => {
          console.log('Page loaded successfully');
        });
        
        // Handle load errors
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
          console.error('Failed to load:', errorCode, errorDescription, validatedURL);
          mainWindow.loadURL(`data:text/html,<html><body style="font-family: Arial; padding: 20px;"><h1>Failed to Load Application</h1><p>Error: ${errorDescription}</p><p>Code: ${errorCode}</p><p>URL: ${validatedURL}</p><p>Please check the console for more details.</p></body></html>`);
        });
      })
      .catch((error) => {
        console.error('Failed to start server:', error);
        // Show error page
        mainWindow.loadURL(`data:text/html,<html><body style="font-family: Arial; padding: 20px;"><h1>Failed to Start Server</h1><p>Error: ${error.message}</p><pre>${error.stack}</pre></body></html>`);
        
        // Open DevTools even in production to help debug
        mainWindow.webContents.openDevTools();
      });
  }
  
  // Show DevTools on production for debugging (remove after fixing)
  // Uncomment next line if you need to debug
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window events
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false);
  });
}

// Initialize database on app ready
const { initializeDatabase } = require('./db-init');

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize database first (copy seeded DB if needed)
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Continue anyway - Prisma will create empty database if needed
  }

  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for communication between renderer and main process
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Handle database path for Prisma
ipcMain.handle('get-db-path', () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'prisma', 'dev.db');
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

