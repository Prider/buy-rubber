# 📖 คู่มือการใช้งานระบบสำรองข้อมูล

## 🔧 ขั้นตอนการติดตั้ง

### 1. ติดตั้ง Node-cron (สำหรับการสำรองอัตโนมัติ)
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

### 2. รัน Prisma Migration
```bash
npx prisma migrate dev --name add_backup_model
npx prisma generate
```

### 3. สร้างโฟลเดอร์สำรองข้อมูล
```bash
mkdir -p prisma/backups
```

### 4. ตั้งค่าเริ่มต้นใน Database
```typescript
// ในไฟล์ seed.ts หรือ CLI
await prisma.setting.createMany({
  data: [
    { key: 'backup_enabled', value: 'true' },
    { key: 'backup_frequency', value: 'daily' },
    { key: 'backup_time', value: '22:00' },
    { key: 'backup_max_count', value: '30' },
    { key: 'backup_auto_cleanup', value: 'true' },
  ]
});
```

### 5. เริ่มใช้งาน Auto Backup Scheduler

ในไฟล์ `src/app/layout.tsx` หรือ `src/lib/server.ts`:

```typescript
import { startAutoBackup } from '@/lib/backupScheduler';

// ใน server-side code
if (typeof window === 'undefined') {
  startAutoBackup();
}
```

## 🎯 วิธีการใช้งาน

### สำรองข้อมูลด้วยตนเอง
```typescript
import { useBackup } from '@/hooks/useBackup';

const { createBackup, loading } = useBackup();

const handleBackup = async () => {
  const result = await createBackup('manual');
  if (result.success) {
    alert('สำรองข้อมูลเรียบร้อย!');
  }
};
```

### ดูรายการสำรองข้อมูล
```typescript
import { useBackup } from '@/hooks/useBackup';

const { loadBackups } = useBackup();

useEffect(() => {
  const loadData = async () => {
    const backups = await loadBackups();
    console.log(backups);
  };
  loadData();
}, []);
```

### เรียกคืนข้อมูล
```typescript
const { restoreBackup } = useBackup();

const handleRestore = async (backupId: string) => {
  const result = await restoreBackup(backupId);
  if (result.success) {
    alert('เรียกคืนข้อมูลเรียบร้อย - กรุณารีสตาร์ทแอปพลิเคชัน');
  }
};
```

### ดาวน์โหลดไฟล์สำรอง
```typescript
const { downloadBackup } = useBackup();

const handleDownload = (backupId: string, fileName: string) => {
  downloadBackup(backupId, fileName);
};
```

### ลบไฟล์สำรอง
```typescript
const { deleteBackup } = useBackup();

const handleDelete = async (backupId: string) => {
  const result = await deleteBackup(backupId);
  if (result.success) {
    // Reload list
  }
};
```

## 📝 API Endpoints

### 1. สร้างสำรองข้อมูล
```bash
POST /api/backup
Body: { "type": "manual" }
```

### 2. ดูรายการสำรอง
```bash
GET /api/backup
```

### 3. เรียกคืนข้อมูล
```bash
PUT /api/backup
Body: { "id": "backup-id" }
```

### 4. ลบไฟล์สำรอง
```bash
DELETE /api/backup?id=backup-id
```

### 5. ดาวน์โหลดไฟล์
```bash
GET /api/backup/backup-id/download
```

## ⚙️ การตั้งค่าการสำรอง

### เปิด/ปิดการสำรองอัตโนมัติ
```typescript
// ในฐานข้อมูล
await prisma.setting.update({
  where: { key: 'backup_enabled' },
  data: { value: 'true' } // หรือ 'false'
});
```

### เปลี่ยนเวลาในการสำรอง
```typescript
await prisma.setting.update({
  where: { key: 'backup_time' },
  data: { value: '18:00' } // เวลาใหม่
});
```

### เปลี่ยนจำนวนสูงสุดที่เก็บไว้
```typescript
await prisma.setting.update({
  where: { key: 'backup_max_count' },
  data: { value: '50' }
});
```

## 🔄 การตั้งค่า Cron Schedule

```typescript
// ทุกวัน เวลา 22:00
'0 22 * * *'

// ทุกสัปดาห์ วันจันทร์ เวลา 22:00
'0 22 * * 1'

// ทุกเดือน วันที่ 1 เวลา 02:00
'0 2 1 * *'

// ทุก 6 ชั่วโมง
'0 */6 * * *'
```

## 🛠️ การแก้ปัญหา

### ปัญหา: ไม่สามารถเขียนไฟล์ได้
**แก้ไข**: ตรวจสอบสิทธิ์โฟลเดอร์
```bash
chmod 755 prisma/backups
```

### ปัญหา: ไฟล์สำรองมีขนาด 0 bytes
**แก้ไข**: ตรวจสอบว่าไฟล์ฐานข้อมูลสามารถอ่านได้
```bash
ls -lh prisma/dev.db
```

### ปัญหา: Auto backup ไม่ทำงาน
**แก้ไข**: 
1. ตรวจสอบว่า `startAutoBackup()` ถูกเรียกใช้
2. ตรวจสอบการตั้งค่า `backup_enabled` ในฐานข้อมูล
3. ดู log ที่ console

## 📊 Monitoring

### ดูขนาดโฟลเดอร์สำรอง
```bash
du -sh prisma/backups
```

### ดูจำนวนไฟล์สำรอง
```bash
ls -l prisma/backups | wc -l
```

### ดูประวัติการสำรอง
```typescript
const backups = await prisma.backup.findMany({
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

## 🔒 Security Best Practices

1. **เข้ารหัสไฟล์สำรอง** (optional)
```typescript
import crypto from 'crypto';
// Encryption/Decryption logic
```

2. **เก็บสำรองใน external storage**
- Google Drive API
- AWS S3
- Dropbox API

3. **ตรวจสอบความสมบูรณ์ของไฟล์**
```typescript
import crypto from 'crypto';

function getFileHash(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
}
```

## 📱 Next Steps

1. ✅ ติดตั้ง dependencies
2. ✅ รัน migration
3. ✅ สร้างโฟลเดอร์ backups
4. ✅ ทดสอบการสำรองด้วยตนเอง
5. 🔄 สร้าง UI สำหรับจัดการสำรองข้อมูล
6. 🔄 เปิดใช้งานการสำรองอัตโนมัติ
7. 🔄 ทดสอบการเรียกคืนข้อมูล
8. 🔄 ตั้งค่า cleanup old backups

---
**หมายเหตุ**: ควรทดสอบทุกขั้นตอนในสภาพแวดล้อมทดสอบก่อนนำไปใช้จริง!
