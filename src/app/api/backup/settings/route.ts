import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { restartAutoBackup } from '@/lib/backupScheduler';

// GET /api/backup/settings - ดึงการตั้งค่าการสำรอง
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['backup_enabled', 'backup_frequency', 'backup_time', 'backup_max_count', 'backup_auto_cleanup']
        }
      }
    });

    // Create settings object with defaults
    const settingsObj = {
      enabled: false,
      frequency: 'daily',
      time: '22:00',
      maxCount: 30,
      autoCleanup: true,
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
        case 'backup_max_count':
          settingsObj.maxCount = parseInt(setting.value) || 30;
          break;
        case 'backup_auto_cleanup':
          settingsObj.autoCleanup = setting.value === 'true';
          break;
      }
    });

    return NextResponse.json(settingsObj);
  } catch (error: any) {
    console.error('Get backup settings error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงการตั้งค่า' },
      { status: 500 }
    );
  }
}

// POST /api/backup/settings - บันทึกการตั้งค่าการสำรอง
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { enabled, frequency, time, maxCount, autoCleanup } = data;

    // Update or create settings
    await Promise.all([
      prisma.setting.upsert({
        where: { key: 'backup_enabled' },
        update: { value: enabled ? 'true' : 'false' },
        create: { key: 'backup_enabled', value: enabled ? 'true' : 'false' },
      }),
      prisma.setting.upsert({
        where: { key: 'backup_frequency' },
        update: { value: frequency || 'daily' },
        create: { key: 'backup_frequency', value: frequency || 'daily' },
      }),
      prisma.setting.upsert({
        where: { key: 'backup_time' },
        update: { value: time || '22:00' },
        create: { key: 'backup_time', value: time || '22:00' },
      }),
      prisma.setting.upsert({
        where: { key: 'backup_max_count' },
        update: { value: (maxCount || 30).toString() },
        create: { key: 'backup_max_count', value: (maxCount || 30).toString() },
      }),
      prisma.setting.upsert({
        where: { key: 'backup_auto_cleanup' },
        update: { value: autoCleanup ? 'true' : 'false' },
        create: { key: 'backup_auto_cleanup', value: autoCleanup ? 'true' : 'false' },
      }),
    ]);

    // Restart scheduler with new settings
    await restartAutoBackup();

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าเรียบร้อย',
    });
  } catch (error: any) {
    console.error('Save backup settings error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' },
      { status: 500 }
    );
  }
}

