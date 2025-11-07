# Electron Build with Seeded Database - Complete Guide

## Overview

This guide explains how the app is packaged with a seeded database that includes initial data (users, members, product types, etc.) so users can login immediately after installation.

## Build Process Flow

```
1. Build Database (prepare:build)
   ├── Push Prisma schema to create database structure
   └── Seed database with initial data
       ├── Admin user (admin/admin123)
       ├── Regular user (user/user123)
       ├── Viewer user (viewer/viewer123)
       ├── 3 Product Types
       ├── Sample product prices
       └── 103 Sample members

2. Build Next.js App
   └── npm run build

3. Package with Electron Builder
   └── Includes seeded database in prisma/dev.db
```

## Database Initialization Flow

### First Run (New Installation)
```
1. App Starts
   ├── Electron ready event fires
   ├── db-init.js checks userData/prisma/dev.db
   └── If NOT exists:
       ├── Find seeded database in app bundle
       ├── Copy to userData/prisma/dev.db
       └── Database ready with all seeded data

2. User Can Login
   └── Use seeded credentials:
       - admin/admin123
       - user/user123
       - viewer/viewer123
```

### Subsequent Runs
```
1. App Starts
   ├── Check userData/prisma/dev.db
   └── If EXISTS:
       └── Use existing database (user's data)
```

## Default Login Credentials

After installation, users can login with:

| Role | Username | Password | Access Level |
|------|----------|---------|--------------|
| Admin | `admin` | `admin123` | Full access (users, settings, all features) |
| User | `user` | `user123` | Edit access (can create/edit purchases, members, etc.) |
| Viewer | `viewer` | `viewer123` | Read-only (view data only) |

**⚠️ IMPORTANT:** Users should change these passwords after first login!

## Build Commands

### For macOS
```bash
npm run electron:build:mac
```

### For Windows
```bash
npm run electron:build:win
```

### For All Platforms
```bash
npm run electron:build:all
```

### Manual Steps (if needed)
```bash
# Step 1: Prepare database (seed with initial data)
npm run prepare:build

# Step 2: Build Next.js app
npm run build

# Step 3: Package Electron app
electron-builder --mac  # or --win
```

## Database Location

### Development
- **Location:** `prisma/dev.db`
- **Path:** Relative to project root

### Production (Packaged App)
- **Seeded DB (Bundle):** `app.asar/prisma/dev.db` (read-only copy)
- **User DB (First Copy):** `userData/prisma/dev.db` (user's working copy)
  - macOS: `~/Library/Application Support/Punsook Innotech/prisma/dev.db`
  - Windows: `%APPDATA%/Punsook Innotech/prisma/dev.db`
  - Linux: `~/.config/Punsook Innotech/prisma/dev.db`

## Architecture

### Files Involved

1. **`scripts/prepare-build-db.js`**
   - Runs before build
   - Pushes Prisma schema
   - Seeds database with initial data

2. **`electron/db-init.js`**
   - Runs on app startup
   - Checks if database exists in userData
   - Copies seeded database if needed

3. **`electron/main.js`**
   - Calls `initializeDatabase()` on app ready
   - Handles database path IPC

4. **`prisma/seed.ts`**
   - Contains seed data
   - Creates users, members, product types, etc.

## What Gets Seeded

### Users (3)
- Admin user
- Regular user
- Viewer user

### Product Types (3)
- น้ำยางสด (Fresh Rubber)
- ยางแห้ง (Dry Rubber)
- เศษยาง (Scrap Rubber)

### Product Prices
- Sample prices for last 3 days
- Different prices for each product type

### Members (103)
- Sample member data with codes M001-M103
- Includes owner/tapper percentages
- Contact information

## Troubleshooting

### Database Not Found Error
**Problem:** App says database not found

**Solution:**
1. Check that `npm run prepare:build` ran successfully
2. Verify `prisma/dev.db` exists before building
3. Check that database is included in package.json `files` array

### Can't Login After Installation
**Problem:** Login fails even with default credentials

**Check:**
1. Verify database was copied to userData
2. Check console logs for initialization errors
3. Try running `npm run db:seed` manually to recreate seed data

### Database Not Copying on First Run
**Problem:** Empty database on first run

**Check:**
1. Verify `electron/db-init.js` is running (check console logs)
2. Check that seeded database exists in app bundle
3. Check file permissions on userData directory

## Testing the Build

### Test Database Initialization
```bash
# 1. Clean userData to simulate first run
# macOS:
rm -rf ~/Library/Application\ Support/Punsook\ Innotech

# 2. Run the built app
# 3. Check logs for "Database initialized" message
# 4. Verify you can login with admin/admin123
```

### Test with Existing Database
```bash
# 1. Install app (creates userData with seeded DB)
# 2. Make some changes/add data
# 3. Uninstall and reinstall
# 4. Verify your data is still there (it should be, as userData persists)
```

## Distribution Checklist

- [ ] Run `npm run prepare:build` successfully
- [ ] Verify `prisma/dev.db` exists and has data
- [ ] Build app with `npm run electron:build:mac`
- [ ] Test installation on clean system
- [ ] Verify default credentials work
- [ ] Test that database persists after app restart
- [ ] Document login credentials for users

## Security Notes

1. **Default Passwords:** Users MUST change default passwords
2. **Database Location:** User's database is in their userData directory (not shared)
3. **Seeded Data:** Only included in first installation; subsequent installs don't overwrite user data

## Future Improvements

- [ ] Add password change requirement on first login
- [ ] Add database migration system
- [ ] Add backup/restore feature
- [ ] Add option to reset to seeded state

---

**Last Updated:** 2024-10-29


