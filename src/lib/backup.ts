import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { logger } from './logger';

function getAppDataDir() {
  try {
    // Prefer Electron userData path
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require('electron');
    const app = electron?.app || electron?.remote?.app;
    if (app?.getPath) {
      return app.getPath('userData');
    }
  } catch {
    // ignore
  }
  // macOS fallback
  const os = require('os');
  const home = os.homedir();
  return path.join(home, 'Library', 'Application Support', 'Punsook Innotech');
}

function getDatabasePathFromEnv(): string {
  const url = process.env.DATABASE_URL;
  logger.info('Getting database path from DATABASE_URL', { 
    hasUrl: !!url, 
    urlPrefix: url?.substring(0, 50) 
  });
  
  // List of possible database paths to try
  const possiblePaths: string[] = [];
  
  if (url && url.startsWith('file:')) {
    try {
      const rawPath = url.replace(/^file:/, '');
      // decode %20 etc.
      let decodedPath = decodeURIComponent(rawPath);
      
      // Handle relative paths - resolve them relative to process.cwd()
      if (!path.isAbsolute(decodedPath)) {
        decodedPath = path.resolve(process.cwd(), decodedPath);
      }
      
      possiblePaths.push(decodedPath);
      
      logger.info('Decoded database path from DATABASE_URL', { 
        rawPath, 
        decodedPath, 
        isAbsolute: path.isAbsolute(decodedPath),
        exists: fs.existsSync(decodedPath) 
      });
    } catch (error) {
      logger.error('Failed to decode DATABASE_URL', error);
    }
  }
  
  // Try Electron userData path
  try {
    const electron = require('electron');
    const app = electron?.app || electron?.remote?.app;
    if (app?.getPath) {
      const userDataPath = app.getPath('userData');
      const electronDbPath = path.join(userDataPath, 'prisma', 'dev.db');
      possiblePaths.push(electronDbPath);
    }
  } catch {
    // Not in Electron context
  }
  
  // Common fallback paths
  possiblePaths.push(
    path.join(process.cwd(), 'prisma', 'dev.db'),
    path.join(process.cwd(), 'dev.db'),
    path.resolve('./prisma/dev.db'),
    path.resolve('./dev.db')
  );
  
  // Try each path and return the first one that exists
  for (const dbPath of possiblePaths) {
    if (fs.existsSync(dbPath)) {
      logger.info('Found database at path', { path: dbPath });
      return dbPath;
    }
  }
  
  // If none exist, return the first possible path (from DATABASE_URL or fallback)
  const finalPath = possiblePaths[0] || path.join(process.cwd(), 'prisma', 'dev.db');
  logger.warn('Database file not found in any expected location', { 
    triedPaths: possiblePaths,
    returning: finalPath
  });
  return finalPath;
}

const APP_DATA_DIR = getAppDataDir();
const BACKUP_DIR = path.join(APP_DATA_DIR, 'backups');

// Get DB_PATH dynamically instead of at module load time
function getDatabasePath(): string {
  return getDatabasePathFromEnv();
}

// สร้างโฟลเดอร์สำรองข้อมูล (ถ้ายังไม่มี)
export function ensureBackupDirectory() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// สร้างไฟล์สำรองข้อมูล
export async function createBackup(backupType: 'auto' | 'manual' = 'manual') {
  try {
    logger.info('Starting backup creation', { type: backupType });
    ensureBackupDirectory();

    // สร้างชื่อไฟล์ (timestamp)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `backup-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, fileName);

    // Get database path dynamically
    const dbPath = getDatabasePath();
    logger.info('Creating backup', { 
      dbPath, 
      exists: fs.existsSync(dbPath),
      DATABASE_URL: process.env.DATABASE_URL,
      cwd: process.cwd()
    });
    
    // สำรองไฟล์ฐานข้อมูล
    if (!fs.existsSync(dbPath)) {
      // Try to get the actual database path from Prisma if available
      let actualDbPath = dbPath;
      try {
        // Try to query Prisma to get the actual connection info
        const prismaUrl = process.env.DATABASE_URL;
        if (prismaUrl) {
          logger.error('Database file not found at resolved path', { 
            dbPath, 
            DATABASE_URL: prismaUrl,
            cwd: process.cwd(),
            resolvedPath: path.resolve(dbPath)
          });
        }
      } catch (e) {
        // ignore
      }
      
      throw new Error(`Database file not found at: ${dbPath}. DATABASE_URL: ${process.env.DATABASE_URL || 'not set'}. Please ensure the database file exists.`);
    }

    fs.copyFileSync(dbPath, backupPath);

    // ตรวจสอบขนาดไฟล์
    const stats = fs.statSync(backupPath);
    const fileSize = stats.size;

    // บันทึกข้อมูลการสำรองลงฐานข้อมูล
    const backup = await prisma.backup.create({
      data: {
        fileName,
        filePath: backupPath,
        fileSize,
        backupType,
      },
    });

    // ทำความสะอาดไฟล์เก่า
    await cleanupOldBackups();

    logger.info('Backup created successfully', { fileName, fileSize });
    return {
      success: true,
      backup,
      message: 'สำรองข้อมูลเรียบร้อย',
    };
  } catch (error: any) {
    logger.error('Backup creation failed', error);
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการสำรองข้อมูล',
    };
  }
}

// เรียกคืนข้อมูลจากไฟล์สำรอง
export async function restoreBackup(backupId: string) {
  try {
    logger.info('Starting backup restore', { backupId });
    const backup = await prisma.backup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // ตรวจสอบว่าไฟล์สำรองมีอยู่จริง
    if (!fs.existsSync(backup.filePath)) {
      throw new Error('Backup file not found');
    }

    // สำรองฐานข้อมูลปัจจุบันก่อนเรียกคืน (safety)
    logger.info('Creating safety backup before restore');
    await createBackup('auto');

    // Get database path dynamically
    const dbPath = getDatabasePath();
    
    // เรียกคืนข้อมูล
    fs.copyFileSync(backup.filePath, dbPath);

    logger.info('Backup restored successfully', { fileName: backup.fileName });
    return {
      success: true,
      message: 'เรียกคืนข้อมูลเรียบร้อย - กรุณารีสตาร์ทแอปพลิเคชัน',
    };
  } catch (error: any) {
    logger.error('Backup restore failed', error);
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการเรียกคืนข้อมูล',
    };
  }
}

// รับรายการไฟล์สำรอง
export async function getBackupList() {
  try {
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // จำกัดที่ 100 รายการล่าสุด
    });

    return backups;
  } catch (error) {
    console.error('Get backup list error:', error);
    return [];
  }
}

// ลบไฟล์สำรอง
export async function deleteBackup(backupId: string) {
  try {
    const backup = await prisma.backup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // ลบไฟล์
    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    // ลบข้อมูลจากฐานข้อมูล
    await prisma.backup.delete({
      where: { id: backupId },
    });

    return {
      success: true,
      message: 'ลบข้อมูลสำรองเรียบร้อย',
    };
  } catch (error: any) {
    console.error('Delete backup error:', error);
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล',
    };
  }
}

// ทำความสะอาดไฟล์เก่า (ตามการตั้งค่า)
export async function cleanupOldBackups() {
  try {
    // หาการตั้งค่าจำนวนสูงสุด
    const maxBackupsSetting = await prisma.setting.findUnique({
      where: { key: 'backup_max_count' },
    });

    const maxBackups = maxBackupsSetting 
      ? parseInt(maxBackupsSetting.value) || 30 
      : 30;

    // ดึงรายการทั้งหมดเรียงตามวันที่ (เก่าที่สุดก่อน)
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // ถ้าเกินจำนวนสูงสุด ลบไฟล์เก่า
    if (backups.length > maxBackups) {
      const toDelete = backups.slice(0, backups.length - maxBackups);
      
      for (const backup of toDelete) {
        // ลบไฟล์
        if (fs.existsSync(backup.filePath)) {
          fs.unlinkSync(backup.filePath);
        }
        // ลบข้อมูลจากฐานข้อมูล
        await prisma.backup.delete({
          where: { id: backup.id },
        });
      }

      logger.info(`Cleaned up ${toDelete.length} old backup files`);
    }
  } catch (error) {
    logger.error('Failed to cleanup old backups', error);
  }
}

// ตรวจสอบและสำรองข้อมูลอัตโนมัติ
export async function autoBackup() {
  try {
    logger.info('Auto backup triggered');
    const autoBackupSetting = await prisma.setting.findUnique({
      where: { key: 'backup_enabled' },
    });

    // ถ้าไม่เปิดใช้งาน auto backup
    if (!autoBackupSetting || autoBackupSetting.value !== 'true') {
      logger.debug('Auto backup is disabled in settings');
      return;
    }

    // สำรองข้อมูล
    const result = await createBackup('auto');
    logger.info('Auto backup completed successfully', { result });

    return result;
  } catch (error) {
    logger.error('Auto backup failed', error);
  }
}


