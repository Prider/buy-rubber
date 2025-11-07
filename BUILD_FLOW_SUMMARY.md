# 📦 Electron Build Flow with Database - Quick Reference

## Complete Build Process

### 1. Build Command
```bash
npm run electron:build:mac
```

This command automatically:
1. ✅ Seeds database with initial data
2. ✅ Builds Next.js app
3. ✅ Packages Electron app with seeded database

### 2. What Happens During Build

#### Step 1: Prepare Database (`prepare:build`)
```bash
node scripts/prepare-build-db.js
```
- Creates/updates database schema
- Seeds with:
  - 3 users (admin, user, viewer)
  - 3 product types
  - Sample prices
  - 103 sample members

#### Step 2: Build Next.js
```bash
npm run build
```
- Creates optimized production build
- Outputs to `.next/` folder

#### Step 3: Package Electron
```bash
electron-builder --mac
```
- Packages app with:
  - Seeded database (`prisma/dev.db`)
  - Next.js build (`.next/`)
  - All dependencies (`node_modules/`)

## First Run Flow

### When User Opens App First Time:

```
1. App Starts
   ↓
2. Electron Ready Event
   ↓
3. Database Initialization (db-init.js)
   ├── Check: Does userData/prisma/dev.db exist?
   ├── NO → Copy from app bundle to userData
   └── YES → Use existing (user's data)
   ↓
4. Window Opens
   ↓
5. User Can Login Immediately
   ✅ admin/admin123
   ✅ user/user123  
   ✅ viewer/viewer123
```

## Default Login Credentials

| Username | Password | Role | Access |
|----------|----------|------|--------|
| `admin` | `admin123` | Admin | Full access |
| `user` | `user123` | User | Edit access |
| `viewer` | `viewer123` | Viewer | Read-only |

**⚠️ Users should change passwords after first login!**

## File Structure

### Before Build
```
project/
├── prisma/
│   ├── dev.db (seeded)
│   ├── seed.ts
│   └── schema.prisma
├── scripts/
│   └── prepare-build-db.js
└── electron/
    ├── main.js
    └── db-init.js
```

### After Build (Packaged App)
```
App Bundle/
├── prisma/
│   └── dev.db (seeded copy - read-only)
└── ...other app files...

User Data/
└── prisma/
    └── dev.db (working copy - user's data)
```

## Database Locations

### Development
- `prisma/dev.db` (project root)

### Production (User's Data)
- macOS: `~/Library/Application Support/Punsook Innotech/prisma/dev.db`
- Windows: `%APPDATA%/Punsook Innotech/prisma/dev.db`
- Linux: `~/.config/Punsook Innotech/prisma/dev.db`

## Quick Test

### Test Build
```bash
# 1. Build
npm run electron:build:mac

# 2. Install DMG

# 3. Open app

# 4. Login with admin/admin123
```

### Test Fresh Install
```bash
# 1. Remove user data (simulates fresh install)
# macOS:
rm -rf ~/Library/Application\ Support/Punsook\ Innotech

# 2. Open app - should copy seeded DB

# 3. Login with default credentials
```

## Troubleshooting

### ❌ "Can't login with admin/admin123"
**Fix:** 
1. Check console logs for database initialization
2. Verify database was copied to userData
3. Try `npm run db:seed` manually to recreate

### ❌ "Database not found"
**Fix:**
1. Ensure `npm run prepare:build` ran successfully
2. Check `prisma/dev.db` exists before building
3. Verify it's in package.json `files` array

### ❌ "White screen after opening app"
**Fix:**
1. Check Console.app for errors
2. Enable DevTools in main.js
3. Verify Next.js server starts

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run prepare:build` | Seed database before build |
| `npm run build` | Build Next.js app |
| `npm run electron:build:mac` | Full build for macOS |
| `npm run electron:build:win` | Full build for Windows |
| `npm run db:seed` | Manually seed database |

---

**See `ELECTRON_BUILD_WITH_DATABASE.md` for detailed documentation.**


