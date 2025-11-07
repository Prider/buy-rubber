/**
 * Initialize database on first run
 * Copies seeded database from app bundle to userData if it doesn't exist
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const userDataPath = app.getPath('userData');
      const userDbDir = path.join(userDataPath, 'prisma');
      const userDbPath = path.join(userDbDir, 'dev.db');
      
      // Set DATABASE_URL environment variable for Prisma
      // This ensures Prisma client uses the correct database path
      const dbUrl = `file:${userDbPath}`;
      process.env.DATABASE_URL = dbUrl;
      console.log('Set DATABASE_URL:', dbUrl);
      
      // Create prisma directory if it doesn't exist
      if (!fs.existsSync(userDbDir)) {
        fs.mkdirSync(userDbDir, { recursive: true });
        console.log('Created database directory:', userDbDir);
      }

      // If database already exists, skip initialization
      if (fs.existsSync(userDbPath)) {
        console.log('Database already exists, skipping initialization');
        resolve(userDbPath);
        return;
      }

      // Try to find the seeded database in the app bundle
      const appPath = app.getAppPath();
      const possibleDbPaths = [
        // In packaged app (without asar)
        path.join(appPath, 'prisma', 'dev.db'),
        // In app bundle resources
        path.join(process.resourcesPath || appPath, 'prisma', 'dev.db'),
        // In development
        path.join(appPath, '..', 'prisma', 'dev.db'),
        // Fallback
        path.join(__dirname, '..', 'prisma', 'dev.db'),
      ];

      let sourceDbPath = null;
      for (const dbPath of possibleDbPaths) {
        if (fs.existsSync(dbPath)) {
          sourceDbPath = dbPath;
          console.log('Found seeded database at:', sourceDbPath);
          break;
        }
      }

      if (!sourceDbPath) {
        console.warn('⚠️  No seeded database found. Creating empty database.');
        // Create empty database by copying from an empty SQLite file or using Prisma
        // For now, we'll just create the directory and let Prisma create it on first use
        resolve(userDbPath);
        return;
      }

      // Copy the seeded database to userData
      console.log('Copying seeded database to user data...');
      fs.copyFileSync(sourceDbPath, userDbPath);
      
      const stats = fs.statSync(userDbPath);
      console.log(`✅ Database initialized: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log('Database location:', userDbPath);
      
      resolve(userDbPath);
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      reject(error);
    }
  });
}

module.exports = { initializeDatabase };

