# Fix for "yarn setup:local" Error

## ❌ Error You Got

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Error validating datasource `db`: the URL must start with the protocol `file:`.
  -->  prisma/schema.prisma:14
   | 
13 |   provider = "sqlite"
14 |   url      = env("DATABASE_URL")
```

## 🔍 Root Cause

You had a **mismatch** between:
- **prisma/schema.prisma**: Set to `sqlite` provider
- **.env file**: Contains PostgreSQL URL from Neon

This caused Prisma to expect `file:./dev.db` but found a PostgreSQL connection string instead.

## ✅ What I Fixed

1. ✅ Restored `prisma/schema.prisma` to use **PostgreSQL** (for Vercel deployment)
2. ✅ Updated `setup-local-db.sh` to properly configure `.env` for SQLite

---

## 🎯 Understanding Your Setup

Your project now supports **TWO environments**:

### 1. **Production (Vercel)** → Uses PostgreSQL (Neon)
- **Schema**: `prisma/schema.prisma` → PostgreSQL provider
- **Database**: Neon PostgreSQL on Vercel
- **Env File**: Environment variable set in Vercel dashboard

### 2. **Local Development** → Can use SQLite OR PostgreSQL
- **For SQLite** (Electron/Desktop): Run `npm run setup:local`
- **For PostgreSQL** (Match production): Keep your current Neon URL in `.env`

---

## 🚀 Choose Your Development Environment

### Option A: Local SQLite (Recommended for Desktop/Electron)

```bash
# This will:
# - Update your .env to use SQLite (file:./dev.db)
# - Switch schema to SQLite temporarily
# - Create local database
# - Seed with test data

npm run setup:local
```

**When to use**: 
- ✅ Developing Electron desktop app
- ✅ Quick local testing
- ✅ No internet connection needed

### Option B: Use Neon PostgreSQL Locally (Match production exactly)

```bash
# Your .env already has Neon URL, so just:
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

**When to use**:
- ✅ Testing production setup locally
- ✅ Want exact same database as Vercel
- ✅ Debugging production issues

---

## 📋 Current Status

After my fix:

### Your Files Now:
- ✅ `prisma/schema.prisma` → **PostgreSQL** (for Vercel)
- ✅ `prisma/schema.sqlite.prisma` → SQLite backup
- ✅ `prisma/schema.postgres.prisma` → PostgreSQL backup
- ✅ `.env` → Currently has Neon PostgreSQL URL
- ✅ `scripts/setup-local-db.sh` → Fixed to properly set up SQLite

### To Use Your Current Setup (PostgreSQL):

Your `.env` currently has:
```
DATABASE_URL='postgresql://...neon.tech/neondb?sslmode=require...'
```

This means you're **already configured for PostgreSQL**. Just run:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### To Switch to SQLite for Local Development:

```bash
npm run setup:local
npm run dev
```

This will:
1. Backup your current `.env` to `.env.backup`
2. Create new `.env` with `DATABASE_URL="file:./dev.db"`
3. Switch schema to SQLite
4. Create and seed local database

---

## 🔄 Switching Between Environments

### Switch to SQLite (Local):
```bash
npm run setup:local
```

### Switch back to PostgreSQL (Neon):
```bash
npm run setup:postgres
# Or manually restore .env.backup:
cp .env.backup .env
```

---

## ⚠️ Important Notes

### For Vercel Deployment:
- ✅ `prisma/schema.prisma` MUST use PostgreSQL
- ✅ This is already configured correctly
- ✅ Don't change it for deployment

### For Local Development:
- ✅ Use `npm run setup:local` for SQLite
- ✅ Or keep Neon URL in `.env` for PostgreSQL
- ✅ Both work fine!

---

## 📝 Quick Reference

### Currently you have:
```
prisma/schema.prisma → PostgreSQL ✅
.env → Neon PostgreSQL URL ✅
```

### This means you can:

**Option 1**: Keep using PostgreSQL (Neon) locally
```bash
npm run dev  # Just works!
```

**Option 2**: Switch to SQLite for local dev
```bash
npm run setup:local
npm run dev
```

**For Vercel**: 
```bash
git push  # Will use PostgreSQL schema + DATABASE_URL from Vercel dashboard
```

---

## ✅ Summary

**The error is fixed!** You can now:

1. **For Vercel deployment**: 
   - ✅ Schema is correct (PostgreSQL)
   - ✅ Just push and set DATABASE_URL in Vercel dashboard

2. **For local development**:
   - Option A: Run `npm run setup:local` for SQLite
   - Option B: Keep current `.env` and use Neon PostgreSQL

**Choose whichever works best for you!** 🚀

---

## 🐛 If You Still Get Errors

### Error: "URL must start with protocol file:"

**Solution**: You have SQLite schema but PostgreSQL URL. Run:
```bash
npm run setup:local  # This will fix both schema and .env
```

### Error: "Can't reach database server"

**Solution**: You have PostgreSQL schema but offline/wrong URL. Either:
1. Run `npm run setup:local` for SQLite
2. Or check your Neon database is active

---

**Questions?** You're all set up! Just choose your development environment and run the appropriate command. 🎉

