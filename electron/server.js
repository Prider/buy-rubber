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
  // Check if DATABASE_URL is already set (e.g., PostgreSQL from .env)
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.log('✅ Using PostgreSQL connection from environment');
    console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Mask password
    // DATABASE_URL is already set, no need to modify it
  } else if (databasePath) {
    // SQLite: Verify database file exists
    if (!fs.existsSync(databasePath)) {
      console.error('❌ Database file does not exist at:', databasePath);
      console.error('This is a critical error. The app cannot function without a database.');
      throw new Error(`Database file not found: ${databasePath}`);
    }
    
    // Check file size to verify it's not empty
    const stats = fs.statSync(databasePath);
    console.log(`✅ Database file verified: ${(stats.size / 1024).toFixed(2)} KB at ${databasePath}`);
    
    // URL-encode path to handle spaces (e.g. Application Support) and special chars
    // For Windows, we need to use forward slashes in the URL
    const normalizedPath = databasePath.replace(/\\/g, '/');
    // Use file: format (Prisma's preferred format for SQLite)
    // Avoid encodeURI here to prevent SQLite from failing to open paths with spaces
    const dbUrl = `file:${normalizedPath}`;
    process.env.DATABASE_URL = dbUrl;
    console.log('Set DATABASE_URL in server process:', dbUrl);
  } else {
    // Try to get from global or app path (SQLite fallback)
    try {
      const { app } = require('electron');
      if (app && app.getPath) {
        const userDataPath = app.getPath('userData');
        const userDbPath = path.join(userDataPath, 'prisma', 'dev.db');
        
        // Verify database file exists
        if (!fs.existsSync(userDbPath)) {
          console.error('❌ Database file does not exist at:', userDbPath);
          throw new Error(`Database file not found: ${userDbPath}`);
        }
        
        // Normalize path for URL
        const normalizedPath = userDbPath.replace(/\\/g, '/');
        // Use file: format (Prisma's preferred format for SQLite)
        const dbUrl = `file:${normalizedPath}`;
        process.env.DATABASE_URL = dbUrl;
        console.log('Set DATABASE_URL from app path:', dbUrl);
      }
    } catch (e) {
      console.error('Could not set DATABASE_URL from Electron app:', e.message);
      throw e;
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

  // Skip standalone mode for Electron - use standard Next.js server instead
  // Standalone mode has path issues in Electron packaged apps
  // The standard Next.js approach works better with Electron's file structure
  if (false && isStandalone) {
    // For standalone mode, we need to use the server.js differently
    // The standalone build includes a minimal server
    // DISABLED: Using standard Next.js approach instead for better Electron compatibility
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
    
    // Check for static folder
    const staticPath = path.join(nextPath, 'static');
    console.log('Looking for .next/static at:', staticPath);
    console.log('Static exists:', fs.existsSync(staticPath));
    
    // Check for public folder
    const publicPath = path.join(appPath, 'public');
    console.log('Looking for public at:', publicPath);
    console.log('Public exists:', fs.existsSync(publicPath));
    
    if (!fs.existsSync(nextPath)) {
      // Try to find where .next might actually be
      const possiblePaths = [
        path.join(process.cwd(), '.next'),
        path.join(__dirname, '..', '.next'),
        path.join(process.resourcesPath, 'app', '.next'),
        path.join(process.resourcesPath, '.next'),
      ];
      
      console.log('Tried these paths:');
      possiblePaths.forEach(p => {
        const exists = fs.existsSync(p);
        console.log(`  ${p}: ${exists}`);
        if (exists && !fs.existsSync(nextPath)) {
          // Found it, update appPath
          const foundAppPath = path.dirname(p);
          console.log(`Found .next at: ${p}, updating appPath to: ${foundAppPath}`);
          // Don't update appPath here, just log it for debugging
        }
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

