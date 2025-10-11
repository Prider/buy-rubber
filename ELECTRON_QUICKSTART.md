# 🚀 Quick Start Guide - Electron Desktop App

Get your Punsook Innotech desktop application running in **5 minutes**!

## Option 1: Use the Helper Scripts (Easiest!)

### On macOS/Linux:
```bash
./run-electron.sh
```

### On Windows:
```cmd
run-electron.bat
```

That's it! The script will:
- ✅ Install dependencies if needed
- ✅ Setup database if needed
- ✅ Launch the desktop application

## Option 2: Manual Setup

### Step 1: Install Dependencies
```bash
yarn install
# or
npm install
```

### Step 2: Setup Database
```bash
yarn db:push
yarn db:seed
```

### Step 3: Run the App
```bash
yarn dev
```

## Building for Production

### Build Installer for Windows:
```bash
yarn electron:build:win
```
**Output:** `dist/Punsook Innotech Setup X.X.X.exe`

### Build Installer for macOS:
```bash
yarn electron:build:mac
```
**Output:** `dist/Punsook Innotech-X.X.X.dmg`

## Login Credentials

After setup, login with:
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Important:** Change the password after first login!

## Need Help?

- 📖 Full Documentation: [ELECTRON_SETUP.md](./ELECTRON_SETUP.md)
- 📝 Installation Guide: [INSTALLATION.md](./INSTALLATION.md)
- 📚 Main README: [README.md](./README.md)

## Troubleshooting

### Port 3000 is already in use
```bash
# Find and kill the process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### Module not found errors
```bash
# Clean install
rm -rf node_modules
yarn install
```

### Database errors
```bash
# Reset database
rm prisma/dev.db
yarn db:push
yarn db:seed
```

## What's Different in Desktop Version?

| Feature | Web Version | Desktop Version |
|---------|-------------|-----------------|
| Installation | Browser only | Native app install |
| Offline Support | ❌ | ✅ |
| Performance | Good | Excellent |
| Auto-start | ❌ | ✅ (optional) |
| Native Menus | ❌ | ✅ |
| File System | Limited | Full access |

## Next Steps

1. ✅ Run the application
2. ✅ Login with admin credentials
3. ✅ Explore the features
4. ✅ Add your first location/members
5. ✅ Start recording purchases
6. 🎨 Customize the app icon (`electron/icon.png`)
7. 📦 Build production installer

Happy Coding! 🎉

