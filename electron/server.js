const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

// Simple file logger that mirrors console to a log file in userData
(() => {
  try {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
  
    function getLogFilePath() {
      // Prefer Electron's userData path when available
      try {
        const { app } = require('electron');
        if (app && app.getPath) {
          const userDataPath = app.getPath('userData');
          const logPath = path.join(userDataPath, 'server.log');
          // Ensure directory exists
          fs.mkdirSync(path.dirname(logPath), { recursive: true });
          return logPath;
        }
      } catch (_) {
        // Not in Electron context yet; fall back to macOS Application Support
      }
  
      // Fallback: ~/Library/Application Support/Punsook Innotech/server.log (macOS)
      try {
        const os = require('os');
        const homeDir = os.homedir();
        const fallbackDir = path.join(homeDir, 'Library', 'Application Support', 'Punsook Innotech');
        fs.mkdirSync(fallbackDir, { recursive: true });
        return path.join(fallbackDir, 'server.log');
      } catch (_) {
        // Ultimate fallback: current working directory
        return path.join(process.cwd(), 'server.log');
      }
    }
  
    const logFilePath = getLogFilePath();
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  
    function safeStringify(value) {
      if (typeof value === 'string') return value;
      try {
        return JSON.stringify(value);
      } catch {
        try {
          return String(value);
        } catch {
          return '[Unserializable]';
        }
      }
    }
  
    function writeLog(level, args) {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] [${level}] ${args.map(safeStringify).join(' ')}\n`;
      try {
        logStream.write(line);
      } catch (_) {
        // Swallow file write errors to avoid impacting runtime
      }
    }
  
    console.log = (...args) => {
      writeLog('LOG', args);
      originalConsole.log(...args);
    };
    console.info = (...args) => {
      writeLog('INFO', args);
      originalConsole.info(...args);
    };
    console.warn = (...args) => {
      writeLog('WARN', args);
      originalConsole.warn(...args);
    };
    console.error = (...args) => {
      writeLog('ERROR', args);
      originalConsole.error(...args);
    };
  
    // Announce log file location once
    originalConsole.log('File logging enabled at:', logFilePath);
  } catch (_) {
    // Never let logging setup break the server
  }
})();

// Get the correct app path for Electron
function getAppPath() {
  // Check if we're in an Electron app
  try {
    const { app } = require('electron');
    if (app && app.getAppPath) {
      const appPath = app.getAppPath();
      console.log('Using app.getAppPath():', appPath);
      
      // Check if .next exists there
      const nextPath = path.join(appPath, '.next');
      if (fs.existsSync(nextPath)) {
        return appPath;
      }
      
      // In packaged apps, files might be in app.asar
      // Try to find .next in resources path
      if (process.resourcesPath) {
        const resourcesNext = path.join(process.resourcesPath, 'app', '.next');
        if (fs.existsSync(resourcesNext)) {
          return path.join(process.resourcesPath, 'app');
        }
      }
    }
  } catch (e) {
    // Not in Electron context or app not available yet
    console.log('Not in Electron context or app not ready:', e.message);
  }
  
  // Fallback: Use __dirname to find app root
  // server.js is in electron/ folder, so go up one level
  const serverDir = __dirname;
  const electronDir = path.dirname(serverDir);
  const appRoot = path.dirname(electronDir);
  
  console.log('Trying app root from __dirname:', appRoot);
  
  // If .next exists relative to server.js location, use that
  const nextPath = path.join(appRoot, '.next');
  if (fs.existsSync(nextPath)) {
    return appRoot;
  }
  
  // Last resort: use process.cwd()
  console.log('Last resort: using process.cwd():', process.cwd());
  return process.cwd();
}

const startServer = async (customAppPath = null, databasePath = null) => {
  // Use 0.0.0.0 to allow connections from other machines on the network
  const hostname = '0.0.0.0';
  let port = 3000;
  
  // Set DATABASE_URL before starting Next.js server
  // This ensures Prisma client uses the correct database path
  if (databasePath) {
    // URL-encode path to handle spaces (e.g. Application Support) and special chars
    const encodedPath = encodeURI(databasePath);
    const dbUrl = `file:${encodedPath}`;
    process.env.DATABASE_URL = dbUrl;
    console.log('Set DATABASE_URL in server process:', dbUrl);
  } else {
    // Try to get from global or app path
    try {
      const { app } = require('electron');
      if (app && app.getPath) {
        const userDataPath = app.getPath('userData');
        const userDbPath = path.join(userDataPath, 'prisma', 'dev.db');
        const encodedPath = encodeURI(userDbPath);
        const dbUrl = `file:${encodedPath}`;
        process.env.DATABASE_URL = dbUrl;
        console.log('Set DATABASE_URL from app path:', dbUrl);
      }
    } catch (e) {
      console.log('Could not set DATABASE_URL from Electron app:', e.message);
    }
  }
  
  // Use provided path, or detect it
  const appPath = customAppPath || getAppPath();
  console.log('Starting server from:', appPath);
  console.log('__dirname:', __dirname);
  console.log('process.cwd():', process.cwd());

  // Prefer WASM engine in packaged Electron to avoid native binary path issues
  try {
    const wasmRuntimeDir = path.join(appPath, 'node_modules', '@prisma', 'client', 'runtime');
    const wasmUrl = `file://${wasmRuntimeDir}/`;
    process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'wasm';
    process.env.PRISMA_WASM_QUERY_ENGINE_BASE_URL = process.env.PRISMA_WASM_QUERY_ENGINE_BASE_URL || wasmUrl;
    console.log('Prisma engine config:', {
      PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE,
      PRISMA_WASM_QUERY_ENGINE_BASE_URL: process.env.PRISMA_WASM_QUERY_ENGINE_BASE_URL,
    });
  } catch (e) {
    console.log('Could not set Prisma WASM engine config:', e.message);
  }

  // Check if we're in standalone mode
  const standalonePath = path.join(appPath, '.next', 'standalone');
  const isStandalone = fs.existsSync(standalonePath);
  console.log('Standalone mode:', isStandalone);

  if (isStandalone) {
    // For standalone mode, we need to use the server.js differently
    // The standalone build includes a minimal server
    try {
      // Save original working directory
      const originalCwd = process.cwd();
      
      // Change to standalone directory for relative imports to work
      process.chdir(standalonePath);
      
      // Import next-server from standalone
      // In standalone, the structure is: .next/standalone/server.js
      let serverModule;
      try {
        const serverFile = path.join(standalonePath, 'server.js');
        if (fs.existsSync(serverFile)) {
          // Clear cache and require
          delete require.cache[require.resolve(serverFile)];
          serverModule = require(serverFile);
        }
      } catch (e) {
        console.log('Could not load standalone server.js, trying alternative');
      }

      // Restore working directory
      process.chdir(originalCwd);

      // If we got a server module, try to use it
      if (serverModule && typeof serverModule.default === 'function') {
        const server = serverModule.default({ port, hostname });
        return new Promise((resolve, reject) => {
          server.listen(port, hostname, (err) => {
            if (err) reject(err);
            else {
              console.log(`> Standalone server ready on http://${hostname}:${port}`);
              console.log(`> Server accessible from network at http://<your-ip>:${port}`);
              console.log(`> Local access: http://localhost:${port}`);
              resolve(port);
            }
          });
        });
      }
    } catch (error) {
      console.error('Standalone server error:', error);
      // Fall through to next approach
    }
  }

  // Standard Next.js approach (works with both standalone and regular builds)
  try {
    const next = require('next');
    
    // Check if .next exists
    const nextPath = path.join(appPath, '.next');
    console.log('Looking for .next at:', nextPath);
    console.log('Exists:', fs.existsSync(nextPath));
    
    if (!fs.existsSync(nextPath)) {
      // Try to find where .next might actually be
      const possiblePaths = [
        path.join(process.cwd(), '.next'),
        path.join(__dirname, '..', '.next'),
        path.join(process.resourcesPath, '.next'),
      ];
      
      console.log('Tried these paths:');
      possiblePaths.forEach(p => {
        console.log(`  ${p}: ${fs.existsSync(p)}`);
      });
      
      throw new Error(
        `.next build folder not found at: ${nextPath}\n` +
        `App path: ${appPath}\n` +
        `Please ensure the build includes the .next folder.`
      );
    }

    const dev = false;
    const app = next({ 
      dev, 
      hostname, 
      port, 
      dir: appPath,
      customServer: true 
    });
    
    const handle = app.getRequestHandler();

    await app.prepare();
    console.log('Next.js app prepared');

    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', req.url, err);
        res.statusCode = 500;
        res.end(`Internal server error: ${err.message}`);
      }
    });

    return new Promise((resolve, reject) => {
      // Try different ports if 3000 is busy
      const tryPort = (attemptPort) => {
        server.on('error', (err) => {
          if (err.code === 'EADDRINUSE' && attemptPort < 3010) {
            console.log(`Port ${attemptPort} in use, trying ${attemptPort + 1}`);
            tryPort(attemptPort + 1);
          } else {
            reject(err);
          }
        });

        server.listen(attemptPort, hostname, () => {
          port = attemptPort;
          console.log(`> Next.js server ready on http://${hostname}:${port}`);
          console.log(`> Server accessible from network at http://<your-ip>:${port}`);
          console.log(`> Local access: http://localhost:${port}`);
          resolve(port);
        });
      };
      
      tryPort(port);
    });
  } catch (error) {
    console.error('Failed to start Next.js server:', error);
    throw error;
  }
};

module.exports = startServer;

