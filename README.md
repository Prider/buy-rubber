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

โค้ดแบ่งเป็น 4 ส่วน `platform`, `shared`, `industries` และ `app` ส่วน `app` ไม่ใช่โมดูลธุรกิจ มันเป็นจุดที่ Next.js ผูก URL เข้ากับอีก 3 ส่วน เพราะหน้าและ API ต้องอยู่ใต้ `src/app` เท่านั้น

| โฟลเดอร์ | หน้าที่ | ใช้ซ้ำกับธุรกิจอื่น |
|---|---|---|
| `src/platform` | บัญชีร้าน: login, signup, ผู้ใช้, billing, อีเมล | ได้ ทั้ง motor parts |
| `src/shared` | โครงหน้า (layout), pagination, alerts, รูปแบบเงินและวันที่, ขนาดกระดาษใบเสร็จ | ได้ |
| `src/industries/rubber` | POS ยางพารา: รับซื้อ, สมาชิก, ขาย, สต็อก, ราคา, บริษัทปลายทาง, รายงาน, ค่าใช้จ่าย | ไม่ได้ เฉพาะยาง |
| `src/app` | URL เท่านั้น (`page.tsx`, `route.ts`) แล้วเรียกโค้ดจาก 3 ส่วนด้านบน | เป็นตัวประกอบ ไม่ใช่ของที่ใช้ซ้ำ |

กฎการ import:

- `platform` และ `shared` ไม่ import `industries`
- `industries/rubber` import `platform` และ `shared` ได้
- `src/app` เป็นจุดประกอบ จึง import ได้ทุกส่วน เช่น layout ที่ล็อกอินแล้วรับเมนูจาก `rubberNav` แล้วส่งเข้า shell ใน `shared`

ธุรกิจใหม่ เช่น ขายอะไหล่ยนต์ ให้เพิ่ม `src/industries/autoparts` และหน้าใหม่ใต้ `src/app` แล้วใช้ `platform` กับ `shared` เดิม ไม่ import `industries/rubber`

```
src/
├── app/                         # URL → เรียก platform / shared / rubber
│   ├── api/auth, signup, users, platform, billing   # platform
│   ├── api/purchases, members, expenses, ...        # rubber
│   ├── login, signup, profile, platform/            # platform
│   └── (authenticated)/purchases, members, ...      # rubber
├── platform/                    # auth, tenant, users, mail, billing
├── shared/                      # layout, ui kit, money/date helpers
└── industries/
    └── rubber/                  # nav, seed, domain, ui, hooks
prisma/
└── schema/
    ├── platform.prisma          # Tenant, User, PaymentRequest, Setting
    └── rubber.prisma            # Member, Purchase, Sale, Stock, Expense
```

`Tenant.industry` มีค่าเริ่มต้น `rubber` ตอนสมัครร้าน `provisionTenant` สร้างแค่ร้านและผู้ใช้แอดมิน แล้วเรียก `seedRubberTenant` เพื่อใส่ประเภทสินค้ายางเริ่มต้น

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

