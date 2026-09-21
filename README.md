# Punsook Innotech - ระบบบริหารจัดการรับซื้อน้ำยาง

โปรแกรมบริหารกิจการรับซื้อน้ำยาง (Rubber Purchasing Management System) ที่ทันสมัยและมีประสิทธิภาพ

**เวอร์ชัน:** 1.4.5

## คุณสมบัติหลัก

### ✅ การจัดการราคาและประเภทสินค้า
- บันทึกราคาประกาศน้ำยางประจำวัน
- จัดการประเภทสินค้ายาง (น้ำยางสด, ยางแห้ง, เศษยาง)
- กำหนดเงื่อนไขการให้ราคาเพิ่ม/ลดตาม %ยาง
- ให้ราคาบวกเพิ่มพิเศษได้
- ดูประวัติราคาย้อนหลัง

### ✅ การรับซื้อน้ำยาง
- บันทึกการซื้อน้ำยางสด ยางแห้ง เศษยาง
- คำนวณน้ำหนักแห้งจาก %ยางอัตโนมัติ
- รองรับการซื้อแบบ Transaction (หลายรายการในครั้งเดียว)
- คำนวณน้ำหนักสุทธิ (หักภาชนะ)
- เพิ่มค่าบริการ (Service Fees) ในรายการรับซื้อ
- ดูรายการรับซื้อทั้งหมด

### ✅ การจัดการสมาชิก
- เพิ่มข้อมูลเจ้าของสวนและคนตัด
- แบ่ง % เจ้าของสวนและคนตัดอัตโนมัติ
- ติดตามประวัติการรับซื้อของแต่ละสมาชิก
- จัดการค่าบริการสมาชิก (Service Fees)
- เบิกเงินล่วงหน้าและติดตามยอดค้างชำระ

### ✅ ระบบการเงิน
- เบิกเงินล่วงหน้าของสมาชิก
- จ่ายชำระหนี้พร้อมหักหนี้อัตโนมัติ
- บันทึกค่าใช้จ่ายประจำวัน (Expenses)
- จัดการค่าบริการ (Service Fees)
- ดูสรุปยอดการเงิน

### ✅ รายงานและวิเคราะห์
- รายงานรับซื้อประจำวัน
- รายงานการจ่ายชำระหนี้
- รายงานหนี้ค้างชำระ
- วิเคราะห์ยอดรับซื้อรายสมาชิก
- รายงานกำไร-ขาดทุน
- Dashboard แสดงสถิติแบบ Real-time

### ✅ การจัดการระบบ
- สำรองข้อมูล (Backup) - เฉพาะ Admin
- ตั้งค่าระบบ - เฉพาะ Admin
- จัดการผู้ใช้งาน (User Management)
- กำหนดสิทธิ์การใช้งานผู้ใช้ (Admin, User, Viewer)
- Dark Mode Support

## เทคโนโลยีที่ใช้

- **Frontend**: Next.js 13.5.6, React 18.2.0, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (production / Vercel / Neon) หรือ SQLite (local development)
- **State Management**: TanStack React Query
- **Reporting**: jsPDF, jsPDF-AutoTable, Recharts
- **Testing**: Vitest, Testing Library
- **UI/UX**: Modern responsive design with Thai language support, Dark Mode

## การติดตั้ง

### ข้อกำหนดระบบ
- Node.js 18 หรือสูงกว่า
- npm หรือ yarn

### ขั้นตอนการติดตั้ง

#### สำหรับ Web Application (Development)

1. ติดตั้ง dependencies:
```bash
npm install
```

2. ตั้งค่าฐานข้อมูล (เลือกแบบใดแบบหนึ่ง):

**Option A: SQLite (แนะนำสำหรับ Development)**
```bash
npm run setup:sqlite
```

**Option B: PostgreSQL (สำหรับ Production)**
```bash
npm run setup:postgres
```

3. เพิ่มข้อมูลตัวอย่าง (ถ้าต้องการ):
```bash
npm run db:seed
```

4. รันโปรแกรม:
```bash
npm run dev
```

5. เปิดเบราว์เซอร์ที่: `http://localhost:3000`

## ข้อมูลผู้ใช้เริ่มต้น

- **Username**: admin
- **Password**: admin123

## โครงสร้างโปรเจค

```
punsook-innotech/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # Authentication
│   │   │   ├── members/        # จัดการสมาชิก
│   │   │   ├── purchases/      # รับซื้อยาง
│   │   │   ├── prices/         # ตั้งราคา
│   │   │   ├── product-types/  # ประเภทสินค้า
│   │   │   ├── expenses/       # ค่าใช้จ่าย
│   │   │   ├── servicefees/    # ค่าบริการ
│   │   │   ├── dashboard/      # ข้อมูลแดชบอร์ด
│   │   │   ├── backup/         # สำรองข้อมูล
│   │   │   └── users/          # จัดการผู้ใช้
│   │   ├── (authenticated)/    # หน้าที่ต้อง Login
│   │   │   ├── dashboard/      # หน้าแดชบอร์ด
│   │   │   ├── purchases/      # ระบบรับซื้อ
│   │   │   ├── purchases-list/ # รายการรับซื้อ
│   │   │   ├── members/        # จัดการสมาชิก
│   │   │   ├── expenses/       # ค่าใช้จ่าย
│   │   │   ├── prices/         # ตั้งราคา
│   │   │   ├── reports/        # รายงาน
│   │   │   ├── backup/         # สำรองข้อมูล
│   │   │   └── admin/          # ตั้งค่า
│   │   └── login/              # หน้า Login
│   ├── components/             # React Components
│   ├── contexts/               # React Contexts
│   ├── hooks/                  # Custom Hooks
│   ├── lib/                    # Utilities
│   └── types/                  # TypeScript Types
├── prisma/
│   ├── schema.prisma           # Database Schema (SQLite)
│   ├── schema.postgres.prisma  # PostgreSQL Schema
│   ├── schema.sqlite.prisma    # SQLite Schema
│   └── seed.ts                 # Seed Data
├── scripts/                    # Setup Scripts
└── public/                     # Static Files
```

## การใช้งาน

### 1. ตั้งค่าระบบ
- เพิ่มประเภทสินค้ายาง (Product Types)
- ตั้งราคาประกาศประจำวัน
- กำหนดเงื่อนไขราคาตาม %ยาง

### 2. เพิ่มสมาชิก
- บันทึกข้อมูลเจ้าของสวน
- เพิ่มคนตัดพร้อมกำหนด %การแบ่ง
- จัดการค่าบริการสมาชิก (ถ้ามี)

### 3. รับซื้อน้ำยาง
- เลือกสมาชิก
- บันทึกน้ำหนักและ %ยาง
- เพิ่มค่าบริการ (Service Fees) ถ้าจำเป็น
- ระบบคำนวณราคาอัตโนมัติ
- บันทึกเป็น Transaction (หลายรายการในครั้งเดียว)

### 4. จ่ายเงิน
- เลือกงวดการจ่ายเงิน
- หักหนี้เงินล่วงหน้า (ถ้ามี)
- หักค่าบริการ (ถ้ามี)

### 5. บันทึกค่าใช้จ่าย
- บันทึกค่าใช้จ่ายประจำวัน
- แยกตามหมวดหมู่ (ค่าน้ำมัน, ค่าซ่อมรถ, ค่าคนงาน, อื่นๆ)

### 6. ดูรายงาน
- Dashboard แสดงสถิติแบบ Real-time
- รายงานรับซื้อ
- รายงานการเงิน
- รายงานสมาชิก

## ฟีเจอร์เพิ่มเติม

- 📱 รองรับการใช้งานบนมือถือและแท็บเล็ต (Responsive Design)
- 🌙 Dark Mode Support
- 🖨️ พิมพ์เอกสารทุกประเภท (jsPDF)
- 📊 กราฟและรายงานวิเคราะห์ (Recharts)
- 💾 สำรองข้อมูล
- 🔐 ระบบความปลอดภัยข้อมูล (JWT Authentication, bcrypt)
- 🧪 Unit Testing (Vitest)
- ⚡ Performance Optimization (Caching, React Query)
- 🔄 Real-time Dashboard Updates
- 💰 จัดการค่าบริการ (Service Fees)
- 📝 บันทึกค่าใช้จ่าย (Expenses)

## Scripts ที่มีให้ใช้งาน

### Development
```bash
npm run dev              # รัน Next.js development server
npm run web:dev          # รัน web server (accessible from network)
```

### Build
```bash
npm run build            # Build สำหรับ production (Vercel)
```

### Database
```bash
npm run setup:sqlite         # ตั้งค่า SQLite database
npm run setup:postgres       # ตั้งค่า PostgreSQL database
npm run db:push             # Push schema ไปยัง database
npm run db:seed             # เพิ่มข้อมูลตัวอย่าง
npm run db:studio           # เปิด Prisma Studio
```

### Testing
```bash
npm run test                # รัน tests (watch mode)
npm run test:run            # รัน tests (single run)
npm run test:coverage       # รัน tests พร้อม coverage report
npm run test:ui             # รัน tests พร้อม UI
```

### Other
```bash
npm run lint                # ตรวจสอบ code quality
npm run push:github         # Setup, commit และ push ไปยัง GitHub
```

## การ Deploy

### Deploy ไปยัง Vercel (Web Application)

โปรเจคนี้รองรับการ deploy ไปยัง Vercel พร้อม Neon PostgreSQL database

1. สร้าง Neon Database ที่ https://neon.tech
2. Deploy ไปยัง Vercel:
```bash
npm install -g vercel
vercel login
vercel
vercel env add DATABASE_URL  # เพิ่ม connection string
vercel --prod
```

📖 **คู่มือละเอียด:** อ่านได้ที่ [QUICKSTART.md](./QUICKSTART.md) และ [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

## เอกสารเพิ่มเติม

- [QUICKSTART.md](./QUICKSTART.md) - คู่มือเริ่มต้นใช้งาน
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - สรุปโปรเจคและฟีเจอร์
- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - คู่มือการ Deploy
- [SQLITE_LOCAL_SETUP.md](./SQLITE_LOCAL_SETUP.md) - คู่มือตั้งค่า SQLite
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - คู่มือการทดสอบ

## API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ

### Members
- `GET /api/members` - ดึงรายการสมาชิก
- `POST /api/members` - เพิ่มสมาชิก
- `GET /api/members/[id]` - ดึงข้อมูลสมาชิก
- `PUT /api/members/[id]` - แก้ไขสมาชิก
- `DELETE /api/members/[id]` - ลบสมาชิก
- `GET /api/members/[id]/purchases` - ประวัติการรับซื้อ
- `GET /api/members/[id]/servicefees` - ค่าบริการสมาชิก

### Purchases
- `GET /api/purchases` - ดึงรายการรับซื้อ
- `POST /api/purchases` - เพิ่มรายการรับซื้อ
- `GET /api/purchases/[id]` - ดึงข้อมูลรับซื้อ
- `PUT /api/purchases/[id]` - แก้ไขรายการรับซื้อ
- `DELETE /api/purchases/[id]` - ลบรายการรับซื้อ
- `POST /api/purchases/transactions` - บันทึก Transaction (หลายรายการ)

### Prices
- `GET /api/prices/daily` - ราคาประจำวัน
- `POST /api/prices/daily` - ตั้งราคาประจำวัน
- `GET /api/prices/history` - ประวัติราคา

### Product Types
- `GET /api/product-types` - ดึงรายการประเภทสินค้า
- `POST /api/product-types` - เพิ่มประเภทสินค้า
- `PUT /api/product-types/[id]` - แก้ไขประเภทสินค้า
- `DELETE /api/product-types/[id]` - ลบประเภทสินค้า

### Expenses
- `GET /api/expenses` - ดึงรายการค่าใช้จ่าย
- `POST /api/expenses` - เพิ่มค่าใช้จ่าย
- `DELETE /api/expenses/[id]` - ลบค่าใช้จ่าย

### Service Fees
- `GET /api/servicefees` - ดึงรายการค่าบริการ
- `POST /api/servicefees` - เพิ่มค่าบริการ
- `PUT /api/servicefees/[id]` - แก้ไขค่าบริการ
- `DELETE /api/servicefees/[id]` - ลบค่าบริการ

### Dashboard
- `GET /api/dashboard` - ข้อมูล Dashboard

### Backup
- `GET /api/backup` - ดึงรายการ Backup
- `POST /api/backup` - สร้าง Backup
- `GET /api/backup/[id]/download` - ดาวน์โหลด Backup
- `GET /api/backup/settings` - ตั้งค่า Backup

### Users
- `GET /api/users` - ดึงรายการผู้ใช้
- `POST /api/users` - เพิ่มผู้ใช้
- `PUT /api/users/[id]` - แก้ไขผู้ใช้
- `DELETE /api/users/[id]` - ลบผู้ใช้

## การสนับสนุน

หากมีข้อสงสัยหรือต้องการความช่วยเหลือ กรุณาติดต่อ:
- Email: support@punsook-innotech.com
- Website: https://www.punsook-innotech.com

## ลิขสิทธิ์

© 2025 Punsook Innotech. All rights reserved.

