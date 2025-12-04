# Punsook Innotech - Electron Project Structure

## 📂 Project Structure Overview

```
punsook-innotech/
│
├── 🖥️ electron/                    # Electron desktop app files
│   ├── main.js                    # Main process (app entry point)
│   ├── preload.js                 # Preload script (IPC bridge)
│   ├── server.js                  # Next.js server for production
│   ├── types.d.ts                 # TypeScript definitions
│   └── icon.png                   # App icon (replace with yours)
│
├── 📱 src/                        # Next.js application
│   ├── app/                       # App router pages
│   │   ├── api/                   # API routes
│   │   ├── dashboard/             # Dashboard page
│   │   ├── login/                 # Login page
│   │   ├── members/               # Members management
│   │   ├── purchases/             # Purchases page
│   │   ├── reports/               # Reports page
│   │   └── ...                    # Other pages
│   │
│   ├── components/                # React components
│   ├── lib/                       # Utility libraries
│   └── types/                     # TypeScript types
│
├── 🗄️ prisma/                     # Database
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Seed data
│   └── dev.db                     # SQLite database (development)
│
├── 📚 Documentation
│   ├── README.md                  # Main documentation (UPDATED)
│   ├── ELECTRON_SETUP.md          # Full Electron setup guide (NEW)
│   ├── ELECTRON_QUICKSTART.md     # 5-minute quick start (NEW)
│   ├── ELECTRON_MIGRATION_SUMMARY.md  # Migration summary (NEW)
│   ├── PROJECT_STRUCTURE_ELECTRON.md  # This file (NEW)
│   ├── INSTALLATION.md            # Installation guide
│   ├── FEATURES.md                # Features documentation
│   └── USER_MANUAL.md             # User manual
│
├── 🚀 Helper Scripts
│   ├── run-electron.sh            # macOS/Linux runner (NEW)
│   └── run-electron.bat           # Windows runner (NEW)
│
├── ⚙️ Configuration Files
│   ├── package.json               # NPM config + Electron build config (UPDATED)
│   ├── next.config.js             # Next.js config (UPDATED)
│   ├── tsconfig.json              # TypeScript config (UPDATED)
│   ├── tailwind.config.js         # Tailwind CSS config
│   ├── postcss.config.js          # PostCSS config
│   ├── electron.env               # Electron environment vars (NEW)
│   └── .gitignore                 # Git ignore patterns (UPDATED)
│
└── 📦 Build Output (after building)
    └── dist/                      # Built installers
        ├── Punsook Innotech Setup X.X.X.exe  (Windows)
        ├── Punsook Innotech-X.X.X.dmg        (macOS)
        └── ...
```

## 🎯 Key Files Explained

### Electron Core Files

#### `electron/main.js`
- Main Electron process
- Creates and manages app window
- Handles app lifecycle events
- Sets up IPC communication
- Configures security settings

#### `electron/preload.js`
- Secure bridge between main and renderer
- Exposes limited APIs to renderer
- Implements context isolation

#### `electron/server.js`
- Starts Next.js server in production
- Serves the built Next.js app
- Handles HTTP requests

### Configuration Changes

#### `package.json`
```json
{
  "main": "electron/main.js",          // ← Entry point
  "scripts": {
    "dev": "concurrently ...",         // ← Dev with Electron
    "electron:build:win": "...",       // ← Build Windows
    "electron:build:mac": "..."        // ← Build macOS
  },
  "devDependencies": {
    "electron": "^27.0.0",             // ← Electron framework
    "electron-builder": "^24.6.4",     // ← Build tool
    "concurrently": "^8.2.2",          // ← Run parallel commands
    "wait-on": "^7.2.0"                // ← Wait for server
  },
  "build": {                            // ← electron-builder config
    "appId": "com.punsook.innotech",
    "productName": "Punsook Innotech",
    // ... platform-specific settings
  }
}
```

#### `next.config.js`
```javascript
{
  images: { unoptimized: true },      // ← For Electron
  output: 'standalone'                // ← Optimized build
}
```

## 🔄 Development Workflow

```
┌─────────────────┐
│   yarn dev      │ ← Run this command
└────────┬────────┘
         │
         ├──► Start Next.js server (localhost:3000)
         │
         └──► Wait for server to be ready
              │
              └──► Launch Electron window
                   │
                   └──► Load Next.js app in Electron
```

## 🏗️ Build Workflow

```
┌──────────────────────────┐
│ yarn electron:build:win  │ ← Run build command
└────────┬─────────────────┘
         │
         ├──► Build Next.js app (production)
         │
         └──► Run electron-builder
              │
              ├──► Package app with dependencies
              │
              ├──► Create installer
              │
              └──► Output to dist/
                   │
                   └──► Punsook Innotech Setup.exe (Windows)
                        Punsook Innotech.dmg (macOS)
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────┐
│     Main Process (Node.js)          │
│  - Full system access                │
│  - File system, OS APIs              │
│  - Database operations               │
└──────────────┬──────────────────────┘
               │
               │ Controlled IPC
               │ (electron/preload.js)
               │
┌──────────────▼──────────────────────┐
│  Renderer Process (Browser)          │
│  - No Node.js access                 │
│  - No direct system access           │
│  - Only allowed IPC calls            │
│  - Context isolated                  │
└─────────────────────────────────────┘
```

## 📦 Distribution Flow

### Windows
```
User downloads → Run .exe → Installer wizard → Install complete
                                              → Desktop shortcut created
                                              → Start menu entry added
                                              → Auto-start option
```

### macOS
```
User downloads → Open .dmg → Drag to Applications → Launch
                                                   → First run: Right-click → Open
                                                   → Subsequent: Normal launch
```

## 🗂️ Data Locations

### Development
```
Project Root/
└── prisma/
    └── dev.db          ← Database here
```

### Production (Windows)
```
C:\Users\[Username]\AppData\Roaming\Punsook Innotech\
├── prisma\
│   └── dev.db          ← Database here
└── logs\               ← (if logging enabled)
```

### Production (macOS)
```
~/Library/Application Support/Punsook Innotech/
├── prisma/
│   └── dev.db          ← Database here
└── logs/               ← (if logging enabled)
```

## 🎨 Customization Points

| What | Where | How |
|------|-------|-----|
| App Name | `package.json` → `build.productName` | Change value |
| App Icon | `electron/icon.png` | Replace file (512x512) |
| App ID | `package.json` → `build.appId` | Change value |
| Window Size | `electron/main.js` → `BrowserWindow` | Modify width/height |
| Splash Screen | Create + add to `electron/main.js` | Add new file |

## 📊 Build Sizes (Approximate)

| Platform | Installer Size | Installed Size |
|----------|----------------|----------------|
| Windows  | ~150-200 MB    | ~300-400 MB    |
| macOS    | ~150-200 MB    | ~300-400 MB    |
| Linux    | ~150-200 MB    | ~300-400 MB    |

*Sizes include Node.js, Chromium, and all dependencies*

## 🚀 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `yarn dev` | Development mode with Electron |
| `yarn build` | Build Next.js only |
| `yarn electron` | Run Electron (requires built Next.js) |
| `yarn electron:build` | Build for current OS |
| `yarn electron:build:win` | Build Windows installer |
| `yarn electron:build:mac` | Build macOS app |
| `yarn electron:build:all` | Build for all platforms |
| `yarn db:push` | Update database schema |
| `yarn db:seed` | Seed database with test data |

## 🔧 Troubleshooting Locations

| Issue | Check |
|-------|-------|
| Build errors | `dist/` folder, delete and retry |
| Dev errors | Console in Electron window (Cmd/Ctrl+Shift+I) |
| Database errors | Check database file exists |
| Port conflicts | Check if port 3000 is available |
| Module errors | Delete `node_modules`, reinstall |

## 📚 Further Reading

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Guide](https://www.electron.build/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

*This structure enables your app to run as both a web application and a native desktop application!*

