# Punsook Innotech - Electron Desktop Application

This guide explains how to run and build the Electron desktop version of Punsook Innotech for Windows and macOS.

## Prerequisites

Before you begin, ensure you have:
- Node.js (v18 or higher)
- Yarn or npm package manager
- For building Windows apps on Mac: Wine (optional)
- For building Mac apps on Windows: Not possible (requires macOS)

## Installation

1. **Install Dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

2. **Setup Database**
   ```bash
   yarn db:push
   yarn db:seed
   ```

## Development

### Running in Development Mode

To run the application in development mode with hot-reload:

```bash
yarn dev
# or
npm run dev
```

This will:
1. Start the Next.js development server on `http://localhost:3000`
2. Wait for the server to be ready
3. Launch the Electron window automatically

**Note:** The Electron window will open automatically once Next.js is ready.

## Building for Production

### Build for Current Platform

Build for your current operating system:

```bash
yarn electron:build
# or
npm run electron:build
```

### Build for Windows

```bash
yarn electron:build:win
# or
npm run electron:build:win
```

**Output:**
- `dist/Punsook Innotech Setup X.X.X.exe` - Windows installer (NSIS)

**System Requirements:**
- Windows 10 or later
- 4GB RAM minimum
- 500MB disk space

### Build for macOS

```bash
yarn electron:build:mac
# or
npm run electron:build:mac
```

**Output:**
- `dist/Punsook Innotech-X.X.X.dmg` - macOS disk image
- `dist/Punsook Innotech-X.X.X-mac.zip` - macOS zip archive

**System Requirements:**
- macOS 10.13 (High Sierra) or later
- 4GB RAM minimum
- 500MB disk space

**Note:** Building for macOS must be done on a Mac computer due to Apple's code signing requirements.

### Build for Both Platforms

If you're on macOS and want to build for both platforms:

```bash
yarn electron:build:all
# or
npm run electron:build:all
```

**Note:** Windows builds on macOS require Wine to be installed.

## Application Icon

The application icon is located at `electron/icon.png`. 

**To customize the icon:**

1. Create a 512x512 PNG image
2. Replace `electron/icon.png` with your image
3. Rebuild the application

**Icon Requirements:**
- Format: PNG
- Size: 512x512 pixels (minimum)
- Transparent background recommended
- Clear, recognizable design

**Free Icon Tools:**
- [Icon Kitchen](https://icon.kitchen/) - Free icon generator
- [Canva](https://www.canva.com) - Design tool
- GIMP, Photoshop, etc.

## Distribution

### Windows Distribution

1. The built `.exe` file is a complete installer
2. Users can download and run it
3. The app will install to `C:\Users\[Username]\AppData\Local\Punsook Innotech`
4. A desktop shortcut will be created automatically

**Installation for Users:**
- Download `Punsook Innotech Setup X.X.X.exe`
- Double-click to run
- Follow the installation wizard
- Launch from desktop shortcut or Start menu

### macOS Distribution

1. The built `.dmg` file contains the application
2. Users can download and mount it
3. Drag the app to Applications folder
4. Launch from Applications or Spotlight

**Installation for Users:**
- Download `Punsook Innotech-X.X.X.dmg`
- Open the DMG file
- Drag app to Applications folder
- Launch from Applications or Spotlight

**Note:** First-time users may need to right-click and select "Open" due to Gatekeeper if the app is not code-signed.

## Database Location

The application uses SQLite database with the following locations:

**Development:**
- `prisma/dev.db` in the project directory

**Production (Electron):**
- **Windows:** `%APPDATA%\Punsook Innotech\prisma\dev.db`
- **macOS:** `~/Library/Application Support/Punsook Innotech/prisma/dev.db`

The database is automatically created on first launch.

## Troubleshooting

### Issue: Electron window doesn't open

**Solution:**
- Make sure Next.js server is running on port 3000
- Check if another application is using port 3000
- Try closing and reopening the application

### Issue: Build fails

**Solution:**
- Delete `node_modules` and reinstall: `yarn install`
- Delete `.next` folder: `rm -rf .next`
- Clear Electron cache: `rm -rf dist`
- Try again

### Issue: App crashes on startup

**Solution:**
- Check console logs for errors
- Ensure database is properly initialized
- Try deleting the app data folder and restarting

### Issue: Cannot build for Windows on macOS

**Solution:**
- Install Wine: `brew install --cask wine-stable`
- Or build on a Windows machine instead

### Issue: White screen on launch

**Solution:**
- Wait a few seconds for Next.js to initialize
- Check the developer console (Ctrl+Shift+I or Cmd+Option+I)
- Ensure all dependencies are installed

## Features in Electron Version

✅ **Offline Capable** - Works without internet connection  
✅ **Native Performance** - Faster than web version  
✅ **Desktop Integration** - Native notifications and file system access  
✅ **Auto-Updates** - Automatic update checks (can be enabled)  
✅ **Secure** - Isolated from browser security issues  
✅ **Multi-Window** - Can open multiple windows if needed  

## Scripts Reference

| Script | Description |
|--------|-------------|
| `yarn dev` | Run in development mode |
| `yarn build` | Build Next.js for production |
| `yarn electron` | Run Electron (requires built Next.js) |
| `yarn electron:build` | Build for current platform |
| `yarn electron:build:win` | Build for Windows |
| `yarn electron:build:mac` | Build for macOS |
| `yarn electron:build:all` | Build for all platforms |

## Tech Stack

- **Electron** - Desktop application framework
- **Next.js 14** - React framework
- **React 18** - UI library
- **Prisma** - Database ORM
- **SQLite** - Database
- **TailwindCSS** - Styling
- **TypeScript** - Type safety

## Security

The Electron application is configured with security best practices:

- ✅ `contextIsolation: true` - Isolates renderer process
- ✅ `nodeIntegration: false` - Disables Node.js in renderer
- ✅ Preload script for safe IPC communication
- ✅ Content Security Policy
- ✅ No remote module access

## Next Steps

1. **Customize the icon** - Replace `electron/icon.png`
2. **Test thoroughly** - Test on target platforms
3. **Setup auto-updates** - Configure electron-updater (optional)
4. **Code signing** - Sign your app for distribution (recommended)
5. **Create installer** - Use electron-builder (already configured)

## Support

For issues or questions:
1. Check this documentation
2. Review the main README.md
3. Check the project's issue tracker
4. Contact the development team

## License

Same as the main project license.

