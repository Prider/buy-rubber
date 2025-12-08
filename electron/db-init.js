/**
 * Initialize database on first run
 * Copies seeded database from app bundle to userData if it doesn't exist
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Create a debug log file to help troubleshoot database initialization
function debugLog(message) {
  try {
    const logPath = path.join(app.getPath('userData'), 'db-init-debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    console.log(message);
  } catch (e) {
    console.error('Failed to write debug log:', e.message);
    console.log(message);
  }
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      debugLog('=== DATABASE INITIALIZATION START ===');
      
      // Check if DATABASE_URL is already set (e.g., from .env file)
      // If it's a PostgreSQL URL, use it directly
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://')) {
        debugLog('PostgreSQL DATABASE_URL detected: ' + process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Mask password
        debugLog('Using PostgreSQL connection from environment variable');
        debugLog('=== DATABASE INITIALIZATION COMPLETE (PostgreSQL) ===');
        global.databasePath = null; // No file path for PostgreSQL
        resolve(null);
        return;
      }
      
      // Otherwise, use SQLite file-based database
      debugLog('Using SQLite file-based database');
      const userDataPath = app.getPath('userData');
      debugLog('userData path: ' + userDataPath);
      const userDbDir = path.join(userDataPath, 'prisma');
      const userDbPath = path.join(userDbDir, 'dev.db');
      debugLog('Target database path: ' + userDbPath);
      
      // Set DATABASE_URL environment variable for Prisma
      // This ensures Prisma client uses the correct database path
      const encodedPath = encodeURI(userDbPath);
      const dbUrl = `file:${encodedPath}`;
      process.env.DATABASE_URL = dbUrl;
      debugLog('Set DATABASE_URL: ' + dbUrl);
      
      // Also return the database path so it can be passed to the server
      global.databasePath = userDbPath;
      
      // Create prisma directory if it doesn't exist
      if (!fs.existsSync(userDbDir)) {
        fs.mkdirSync(userDbDir, { recursive: true });
        debugLog('✅ Created database directory: ' + userDbDir);
      } else {
        debugLog('Database directory already exists');
      }

      // If database already exists, verify it's valid
      if (fs.existsSync(userDbPath)) {
        const stats = fs.statSync(userDbPath);
        debugLog(`Database already exists: ${(stats.size / 1024).toFixed(2)} KB`);
        debugLog('Skipping initialization');
        debugLog('=== DATABASE INITIALIZATION COMPLETE ===');
        resolve(userDbPath);
        return;
      }
      
      debugLog('No existing database found, searching for source...');

      // Try to find the seeded database in the app bundle
      const appPath = app.getAppPath();
      debugLog('app.getAppPath(): ' + appPath);
      debugLog('process.resourcesPath: ' + (process.resourcesPath || 'undefined'));
      debugLog('__dirname: ' + __dirname);
      
      const possibleDbPaths = [
        // In packaged app (without asar) - extraResources go to resources/prisma/dev.db
        path.join(process.resourcesPath || appPath, 'prisma', 'dev.db'),
        // In app bundle resources (alternative path)
        path.join(appPath, 'prisma', 'dev.db'),
        // In development
        path.join(appPath, '..', 'prisma', 'dev.db'),
        // Fallback
        path.join(__dirname, '..', 'prisma', 'dev.db'),
      ];

      debugLog('Searching for seeded database in:');
      let sourceDbPath = null;
      for (const dbPath of possibleDbPaths) {
        const exists = fs.existsSync(dbPath);
        debugLog(`  - ${dbPath} ${exists ? '✅' : '❌'}`);
        if (exists) {
          sourceDbPath = dbPath;
          debugLog('Found seeded database at: ' + sourceDbPath);
          break;
        }
      }

      if (!sourceDbPath) {
        debugLog('❌ No seeded database found in any of the expected locations!');
        debugLog('This is a critical error. The app cannot function without a database.');
        debugLog('Please ensure prisma/dev.db is included in the build.');
        
        // Create a minimal valid SQLite3 database file
        // SQLite file format: https://www.sqlite.org/fileformat.html
        debugLog('Creating minimal empty SQLite database as fallback...');
        
        // Create a minimal valid SQLite database header (100 bytes)
        const header = Buffer.alloc(100, 0);
        header.write('SQLite format 3\0', 0, 'ascii'); // Magic header string (16 bytes)
        header.writeUInt16BE(4096, 16); // Page size (2 bytes) - 4096 is default
        header.writeUInt8(1, 18); // File format write version
        header.writeUInt8(1, 19); // File format read version
        header.writeUInt8(0, 20); // Bytes of unused reserved space at end of each page
        header.writeUInt8(64, 21); // Maximum embedded payload fraction
        header.writeUInt8(32, 22); // Minimum embedded payload fraction
        header.writeUInt8(32, 23); // Leaf payload fraction
        header.writeUInt32BE(0, 24); // File change counter
        header.writeUInt32BE(1, 28); // Size of database in pages
        header.writeUInt32BE(0, 32); // Page number of first freelist trunk page
        header.writeUInt32BE(0, 36); // Total number of freelist pages
        header.writeUInt32BE(0, 40); // Schema cookie
        header.writeUInt32BE(4, 44); // Schema format number (4 = latest)
        header.writeUInt32BE(0, 48); // Default page cache size
        header.writeUInt32BE(0, 52); // Page number of largest root b-tree page
        header.writeUInt32BE(1, 56); // Database text encoding (1 = UTF-8)
        header.writeUInt32BE(0, 60); // User version
        header.writeUInt32BE(0, 64); // Incremental vacuum mode
        header.writeUInt32BE(0, 68); // Application ID
        // Bytes 72-91 are reserved (already filled with 0)
        header.writeUInt32BE(0, 92); // Version-valid-for number
        header.writeUInt32BE(3046000, 96); // SQLite version number
        
        // Write the header and create a minimal first page (4096 bytes)
        const firstPage = Buffer.alloc(4096, 0);
        header.copy(firstPage, 0, 0, 100);
        
        fs.writeFileSync(userDbPath, firstPage);
        debugLog('⚠️  Created minimal SQLite database file');
        debugLog('⚠️  This database is empty and will need schema initialization');
        debugLog('⚠️  Prisma will fail to connect. YOU MUST include prisma/dev.db in the build!');
        
        resolve(userDbPath);
        return;
      }

      // Copy the seeded database to userData
      debugLog('Copying seeded database...');
      debugLog('  From: ' + sourceDbPath);
      debugLog('  To: ' + userDbPath);
      fs.copyFileSync(sourceDbPath, userDbPath);
      
      const stats = fs.statSync(userDbPath);
      debugLog(`✅ Database initialized successfully: ${(stats.size / 1024).toFixed(2)} KB`);
      debugLog('Database location: ' + userDbPath);
      debugLog('=== DATABASE INITIALIZATION COMPLETE ===');
      
      resolve(userDbPath);
    } catch (error) {
      debugLog('=== DATABASE INITIALIZATION FAILED ===');
      debugLog('❌ Error: ' + error.message);
      debugLog('Stack: ' + error.stack);
      reject(error);
    }
  });
}

module.exports = { initializeDatabase };

