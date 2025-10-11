# คู่มือการติดตั้ง BigLatex-Pro

## ข้อกำหนดระบบ

- **Node.js**: เวอร์ชัน 18.0 หรือสูงกว่า
- **npm**: เวอร์ชัน 9.0 หรือสูงกว่า (มากับ Node.js)
- **ระบบปฏิบัติการ**: Windows 10/11, macOS, Linux

## ขั้นตอนการติดตั้ง

### 1. ดาวน์โหลดโปรเจค

```bash
cd /tmp/biglatex-pro
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

การติดตั้งจะใช้เวลาประมาณ 2-5 นาที ขึ้นอยู่กับความเร็วอินเทอร์เน็ต

### 3. ตั้งค่าฐานข้อมูล

สร้างไฟล์ `.env` ในโฟลเดอร์หลัก:

```bash
cp .env.example .env
```

เนื้อหาในไฟล์ `.env`:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-this-in-production"
NEXT_PUBLIC_APP_NAME="BigLatex-Pro"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### 4. สร้างฐานข้อมูล

```bash
npm run db:push
```

คำสั่งนี้จะสร้างตารางในฐานข้อมูล SQLite

### 5. เพิ่มข้อมูลตัวอย่าง (ถ้าต้องการ)

```bash
npm run db:seed
```

คำสั่งนี้จะสร้างข้อมูลเริ่มต้น:
- ผู้ใช้: admin / admin123
- โรงรับซื้อยาง 1 แห่ง
- ประเภทสินค้า 3 ประเภท (น้ำยางสด, ยางแห้ง, เศษยาง)
- สมาชิก 3 ราย
- ราคาประกาศวันนี้

### 6. รันโปรแกรม

#### โหมด Development (สำหรับทดสอบ)

```bash
npm run dev
```

#### โหมด Production (สำหรับใช้งานจริง)

```bash
npm run build
npm start
```

### 7. เปิดเบราว์เซอร์

เปิดเบราว์เซอร์และไปที่:
```
http://localhost:3000
```

## การเข้าสู่ระบบครั้งแรก

- **Username**: admin
- **Password**: admin123

⚠️ **สำคัญ**: กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก

## การตั้งค่าเพิ่มเติม

### เปลี่ยน JWT Secret

แก้ไขไฟล์ `.env`:
```
JWT_SECRET="your-new-secret-key-here"
```

### ใช้ PostgreSQL แทน SQLite (สำหรับระบบขนาดใหญ่)

1. แก้ไขไฟล์ `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. แก้ไขไฟล์ `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/biglatex"
```

3. รันคำสั่ง:
```bash
npm run db:push
```

## การแก้ปัญหา

### ติดตั้ง Dependencies ไม่สำเร็จ

```bash
# ลบโฟลเดอร์ node_modules และติดตั้งใหม่
rm -rf node_modules
rm package-lock.json
npm install
```

### ฐานข้อมูลมีปัญหา

```bash
# ลบฐานข้อมูลและสร้างใหม่
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Port 3000 ถูกใช้งานอยู่

รันด้วย port อื่น:
```bash
PORT=3001 npm run dev
```

## การสำรองข้อมูล

ไฟล์ฐานข้อมูลอยู่ที่: `prisma/dev.db`

สำรองข้อมูลโดยการคัดลอกไฟล์นี้ไปยังที่ปลอดภัย:

```bash
# สำรอง
cp prisma/dev.db backups/backup-$(date +%Y%m%d).db

# กู้คืน
cp backups/backup-20250109.db prisma/dev.db
```

## การอัพเดท

```bash
git pull origin main
npm install
npm run db:push
npm run build
```

## การติดต่อ

หากพบปัญหาหรือต้องการความช่วยเหลือ:
- Email: support@biglatex-pro.com
- Website: https://www.biglatex-pro.com
- GitHub Issues: https://github.com/biglatex-pro/biglatex-pro/issues

