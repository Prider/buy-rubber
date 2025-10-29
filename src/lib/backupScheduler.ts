import * as cron from 'node-cron';
import { autoBackup } from './backup';
import { prisma } from './prisma';
import { logger } from './logger';

let scheduledTask: cron.ScheduledTask | null = null;

// Convert time to cron format
function getCronExpression(time: string, frequency: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  
  switch (frequency) {
    case 'daily':
      return `${minutes} ${hours} * * *`;
    case 'weekly':
      return `${minutes} ${hours} * * 0`; // Sunday
    case 'monthly':
      return `${minutes} ${hours} 1 * *`; // First day of month
    default:
      return `${minutes} ${hours} * * *`; // Daily as default
  }
}

// กำหนดการสำรองอัตโนมัติ
export async function startAutoBackup() {
  try {
    // Load settings from database
    const settings = await getBackupSettings();
    
    if (!settings.enabled) {
      logger.info('Auto backup is disabled');
      return;
    }

    // Stop existing task if running
    if (scheduledTask) {
      scheduledTask.stop();
    }

    // Get cron expression based on settings
    const cronExpression = getCronExpression(settings.time, settings.frequency);
    
    scheduledTask = cron.schedule(cronExpression, async () => {
      logger.info('Running scheduled backup...');
      await autoBackup();
    });

    logger.info(`Auto backup scheduler started (${settings.frequency} at ${settings.time})`);
  } catch (error) {
    logger.error('Failed to start auto backup scheduler', error);
  }
}

// Load backup settings from database
async function getBackupSettings() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['backup_enabled', 'backup_frequency', 'backup_time']
      }
    }
  });

  const settingsObj = {
    enabled: false,
    frequency: 'daily',
    time: '22:00',
  };

  settings.forEach(setting => {
    switch (setting.key) {
      case 'backup_enabled':
        settingsObj.enabled = setting.value === 'true';
        break;
      case 'backup_frequency':
        settingsObj.frequency = setting.value;
        break;
      case 'backup_time':
        settingsObj.time = setting.value;
        break;
    }
  });

  return settingsObj;
}

// หยุดการสำรองอัตโนมัติ
export function stopAutoBackup() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Auto backup scheduler stopped');
  }
}

// ตรวจสอบสถานะการทำงาน
export function isAutoBackupRunning(): boolean {
  return scheduledTask !== null;
}

// Restart scheduler with new settings
export async function restartAutoBackup() {
  stopAutoBackup();
  await startAutoBackup();
}

