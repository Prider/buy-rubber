# 🗄️ ออกแบบระบบสำรองข้อมูลอัตโนมัติ (Auto Backup System)

## 📋 ภาพรวม
ระบบสำรองข้อมูลอัตโนมัติสำหรับแอปพลิเคชัน BigLatex Pro

## 🎯 เป้าหมาย
1. ✅ สำรองข้อมูลอัตโนมัติตามกำหนดเวลา
2. ✅ สำรองข้อมูลด้วยตนเอง (Manual Backup)
3. ✅ เรียกคืนข้อมูลจากไฟล์สำรอง
4. ✅ จัดการไฟล์สำรอง (ดู รายการ ลบ)

## 📐 โครงสร้างระบบ

### 1. โฟลเดอร์สำหรับเก็บสำรองข้อมูล
```
prisma/
  backups/
    ├── 2024-01-15_10-30-00.db
    ├── 2024-01-15_18-00-00.db
    └── ...
```

### 2. Database Schema (เพิ่มตารางเก็บข้อมูลการสำรอง)

```prisma
// เก็บประวัติการสำรองข้อมูล
model Backup {
  id          String   @id @default(uuid())
  fileName    String   // ชื่อไฟล์ เช่น "2024-01-15_10-30-00.db"
  filePath    String   // path เต็มของไฟล์
  fileSize    Int      // ขนาดไฟล์ (bytes)
  backupType  String   // "auto" หรือ "manual"
  createdAt   DateTime @default(now())
  
  @@index([createdAt])
  @@index([backupType])
}
```

### 3. API Endpoints
- `POST /api/backup/create` - สร้างสำรองข้อมูล
- `GET /api/backup/list` - ดูรายการสำรองข้อมูล
- `POST /api/backup/restore` - เรียกคืนข้อมูล
- `DELETE /api/backup/:id` - ลบสำรองข้อมูล
- `GET /api/backup/download/:id` - ดาวน์โหลดไฟล์สำรอง

### 4. Automatic Backup Scheduling
- ใช้ Node.js `node-cron` หรือ `setInterval`
- สำรองข้อมูลทุกวัน เวลา 22:00 น.
- หรือตามการตั้งค่า

### 5. Settings Configuration
```typescript
interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // เวลา เช่น "22:00"
  maxBackups: number; // จำนวนสูงสุดที่เก็บไว้
  autoCleanup: boolean; // ลบเก่าให้อัตโนมัติ
}
```

## 🛠️ การทำงาน

### กระบวนการสำรองข้อมูล
1. **Copy Database File**
   ```bash
   cp prisma/dev.db prisma/backups/YYYY-MM-DD_HH-mm-ss.db
   ```

2. **บันทึกข้อมูลลง Database**
   - เก็บข้อมูลการสำรองลงตาราง `Backup`
   - จัดการการลบไฟล์เก่าตามการตั้งค่า

3. **จัดการพื้นที่เก็บข้อมูล**
   - ตรวจสอบจำนวนไฟล์สำรอง
   - ลบไฟล์เก่าเมื่อเกินจำนวนสูงสุด

### การเรียกคืนข้อมูล
1. **หยุดการทำงานของ Database**
2. **Restore Database File**
   ```bash
   cp prisma/backups/YYYY-MM-DD_HH-mm-ss.db prisma/dev.db
   ```
3. **เรียกใช้ Prisma Migrate**
4. **รีสตาร์ทแอปพลิเคชัน**

## 📁 ไฟล์ที่จะสร้าง

### Backend
1. `src/app/api/backup/route.ts` - API สำหรับจัดการสำรองข้อมูล
2. `src/lib/backup.ts` - Logic สำรองข้อมูลและเรียกคืน
3. `src/lib/scheduler.ts` - จัดการการสำรองอัตโนมัติ

### Frontend
1. `src/app/admin/backup/page.tsx` - หน้าจัดการสำรองข้อมูล
2. `src/components/admin/BackupManagement.tsx` - UI จัดการสำรองข้อมูล
3. `src/components/admin/BackupList.tsx` - รายการไฟล์สำรอง
4. `src/components/admin/BackupCard.tsx` - การ์ดแสดงข้อมูลการสำรอง

## 🔧 Configuration (in database)

```typescript
// Settings table
{
  key: 'backup_enabled',
  value: 'true'
},
{
  key: 'backup_frequency', 
  value: 'daily' // daily, weekly, monthly
},
{
  key: 'backup_time',
  value: '22:00' // HH:mm format
},
{
  key: 'backup_max_count',
  value: '30' // เก็บไว้ 30 ไฟล์
},
{
  key: 'backup_auto_cleanup',
  value: 'true'
}
```

## 🎨 UI Design

### Admin Backup Management Page
```
┌─────────────────────────────────────────────┐
│  📦 สำรองข้อมูล                             │
├─────────────────────────────────────────────┤
│                                             │
│  [➕ สำรองข้อมูลตอนนี้]                      │
│  [⚙️ ตั้งค่าการสำรองอัตโนมัติ]               │
│                                             │
├─────────────────────────────────────────────┤
│  ประวัติการสำรองข้อมูล                       │
├─────────────────────────────────────────────┤
│  📅 2024-01-15 10:30:00                     │
│     ขนาด: 2.5 MB                            │
│     ประเภท: อัตโนมัติ                        │
│     [🔄 เรียกคืน] [📥 ดาวน์โหลด] [🗑️ ลบ]    │
├─────────────────────────────────────────────┤
│  📅 2024-01-14 18:00:00                     │
│     ขนาด: 2.4 MB                            │
│     ประเภท: ด้วยตนเอง                       │
│     [🔄 เรียกคืน] [📥 ดาวน์โหลด] [🗑️ ลบ]    │
└─────────────────────────────────────────────┘
```

## ⚠️ ข้อควรระวัง

1. **Permission**: ตรวจสอบสิทธิ์การเขียนไฟล์
2. **Disk Space**: ตรวจสอบพื้นที่ว่างก่อนสำรอง
3. **Concurrent Access**: ป้องกันการอ่าน/เขียนพร้อมกัน
4. **Testing**: ทดสอบการเรียกคืนข้อมูลในสภาพแวดล้อมทดสอบก่อน
5. **Encryption**: พิจารณาเข้ารหัสไฟล์สำรอง (optional)
6. **External Storage**: พิจารณาเก็บสำรองในอีกล็อก (cloud storage)

## 🚀 ขั้นตอนการนำไปใช้

### Phase 1: Basic Backup (Manual)
- ✅ สร้าง API สำหรับสำรองข้อมูลด้วยตนเอง
- ✅ UI สำหรับเรียกใช้การสำรอง
- ✅ จัดเก็บไฟล์สำรอง

### Phase 2: Automatic Backup
- ✅ เพิ่มระบบจัดการเวลา
- ✅ สำรองข้อมูลอัตโนมัติ
- ✅ การแจ้งเตือน

### Phase 3: Advanced Features
- ✅ เรียกคืนข้อมูลจากไฟล์สำรอง
- ✅ จัดการไฟล์สำรอง (ลบ, ดาวน์โหลด)
- ✅ รายงานสถิติการสำรอง

## 📊 Database Growth Management

### กลยุทธ์
1. **Retention Policy**: เก็บไฟล์ล่าสุด 30 วัน
2. **Compression**: บีบอัดไฟล์เก่า (optional)
3. **Archiving**: ย้ายไฟล์เก่าไปอีกล็อก
4. **Monitoring**: ติดตามขนาดและจำนวนไฟล์

## 🔒 Security Considerations

1. **File Permissions**: ป้องกันการเข้าถึงไฟล์ที่ไม่มีสิทธิ์
2. **Encryption**: เข้ารหัสไฟล์สำรอง (optional)
3. **Verification**: ตรวจสอบความสมบูรณ์ของไฟล์สำรอง
4. **Audit Log**: บันทึกการเข้าถึงและกระทำทุกครั้ง

## 📝 Next Steps

1. Implement Phase 1 (Manual Backup)
2. Test backup/restore functionality
3. Add automatic scheduling (Phase 2)
4. Add restore functionality (Phase 3)
5. Implement retention policies
6. Add monitoring and alerts

---
**หมายเหตุ**: ควรทดสอบในสภาพแวดล้อมทดสอบก่อนนำไปใช้จริง
