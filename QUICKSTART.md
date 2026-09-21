# Quick Start Guide

## Project Overview

This is a Rubber Purchasing Management System (ระบบบริหารจัดการรับซื้อยาง) that runs as a **Web Application** — locally or deployed on Vercel with PostgreSQL.

## 🚀 Deployment Options

### Option 1: Deploy to Vercel (Production)

The project is **pre-configured** for Vercel deployment with Neon PostgreSQL database.

#### Quick Deploy:

1. **Create a Neon Database**
   - Sign up at https://neon.tech
   - Create a new project
   - Copy the connection string

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login
   vercel login
   
   # Deploy
   vercel
   ```

3. **Set Environment Variable**
   ```bash
   vercel env add DATABASE_URL
   # Paste your Neon connection string when prompted
   ```

4. **Done!** 🎉
   - Vercel will automatically run `npm run vercel-build`
   - This will generate Prisma client, push schema, seed data, and build

📖 **Detailed instructions**: See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

---

### Option 2: Local Development

#### A. Using PostgreSQL (Recommended - matches production)

```bash
# 1. Install PostgreSQL locally (or use Docker)

# 2. Create .env file
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/mydb"' > .env

# 3. Setup database
npm run setup:postgres

# 4. Start development server
npm run dev
```

#### B. Using SQLite (Lightweight for local dev)

```bash
# 1. Setup SQLite database (creates .env automatically)
npm run setup:local

# 2. Start development server
npm run dev
```

---

## 📦 Scripts Reference

### Development
- `npm run dev` - Start Next.js development server (with Prisma generation)
- `npm run web:dev` - Start web server on all network interfaces

### Database Setup
- `npm run setup:sqlite` - Setup SQLite for local development
- `npm run setup:postgres` - Setup PostgreSQL (local or production)
- `npm run db:push` - Push Prisma schema to database
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

### Production
- `npm run build` - Build for production (includes database setup)
- `npm run start` - Start production server
- `npm run vercel-build` - Vercel deployment build command

---

## 🗄️ Database Configuration

### Current Setup

- **Schema**: `prisma/schema.prisma` (PostgreSQL)
- **Alternative**: `prisma/schema.sqlite.prisma` (SQLite)

### Switching Between Databases

The setup scripts automatically handle this for you:

```bash
# Switch to SQLite
npm run setup:local

# Switch back to PostgreSQL
npm run setup:postgres
```

---

## 🔐 Default Login Credentials

After seeding the database, you can login with:

**Admin Account** (Full access):
- Username: `admin`
- Password: `admin123`

**User Account** (Edit access):
- Username: `user`
- Password: `user123`

**Viewer Account** (Read-only):
- Username: `viewer`
- Password: `viewer123`

---

## 📝 Environment Variables

### Production (Vercel + Neon)
```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
NODE_ENV="production"
```

### Local Development (PostgreSQL)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
NODE_ENV="development"
```

### Local Development (SQLite)
```env
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 13, React 18, Tailwind CSS
- **Database**: PostgreSQL (Neon) / SQLite
- **ORM**: Prisma
- **Deployment**: Vercel
- **Testing**: Vitest, Testing Library

---

## 📚 Additional Documentation

- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md) - Detailed deployment instructions
- [Prisma Schema](./prisma/schema.prisma) - Database schema documentation

---

## 🐛 Troubleshooting

### "Prisma Client not generated"
```bash
npx prisma generate
```

### "Database connection error"
- Check your `DATABASE_URL` in `.env`
- For PostgreSQL, ensure the database exists
- For SQLite, the file will be created automatically

### "Build fails on Vercel"
- Verify `DATABASE_URL` is set in Vercel environment variables
- Check build logs in Vercel dashboard
- Ensure Neon database is active and accessible

### Need to reset database?
```bash
# Delete and recreate
rm prisma/dev.db       # For SQLite
npm run db:push
npm run db:seed
```

---

## 💡 Tips

1. **Use PostgreSQL locally** to match production environment exactly
2. **Run tests** before deploying: `npm run test:run`
3. **View database** with Prisma Studio: `npm run db:studio`
4. **Check for type errors**: `npm run lint`

---

## 🤝 Need Help?

Check the detailed guides:
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for deployment help
- Prisma documentation: https://www.prisma.io/docs
- Next.js documentation: https://nextjs.org/docs

