const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

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

const startServer = async (customAppPath = null) => {
  const hostname = 'localhost';
  let port = 3000;
  
  // Use provided path, or detect it
  const appPath = customAppPath || getAppPath();
  console.log('Starting server from:', appPath);
  console.log('__dirname:', __dirname);
  console.log('process.cwd():', process.cwd());

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
          server.listen(port, (err) => {
            if (err) reject(err);
            else {
              console.log(`> Standalone server ready on http://${hostname}:${port}`);
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

