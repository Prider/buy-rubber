# Fix for Electron White Screen Issue

## Problem
When opening the built Electron app (DMG), the window shows a white screen instead of the application.

## Root Causes
1. **Next.js Standalone Mode**: The app uses `standalone` output mode which requires special handling
2. **Server Startup Timing**: The window tries to load before the server is ready
3. **Missing Error Handling**: Errors aren't displayed to help debug

## Fixes Applied

### 1. Updated `electron/server.js`
- Added support for Next.js standalone mode
- Added better error handling and logging
- Added fallback to standard Next.js server mode
- Improved port handling (tries multiple ports if 3000 is busy)

### 2. Updated `electron/main.js`
- Added error handling for server startup failures
- Added error display for failed page loads
- Added console logging for debugging
- Added option to open DevTools in production for debugging

### 3. Updated `package.json`
- Added `public/**/*` to files list (for static assets)

## How to Test

1. **Rebuild the app:**
   ```bash
   npm run electron:build:mac
   ```

2. **Open the DMG and run the app**

3. **Check the Console:**
   - If you still see a white screen, open Console.app (macOS)
   - Filter for your app name "Punsook Innotech"
   - Look for error messages

4. **Enable DevTools (temporary for debugging):**
   - In `electron/main.js`, uncomment line 63:
   ```javascript
   mainWindow.webContents.openDevTools();
   ```
   - This will show DevTools when the app opens
   - Check the Console tab for errors

## Common Issues and Solutions

### Issue: Server won't start
**Symptoms:** Error page showing "Failed to Start Server"

**Possible causes:**
- `.next` folder not included in build
- Missing dependencies
- Port already in use

**Solution:**
- Check that `.next` folder exists after `npm run build`
- Verify `node_modules` includes `next`

### Issue: Page fails to load
**Symptoms:** Error page showing "Failed to Load Application"

**Possible causes:**
- Server not accessible on localhost
- Static files missing (CSS, JS)
- CORS issues

**Solution:**
- Check Console.app for detailed errors
- Verify `public` folder files are included

### Issue: Still white screen after fixes
**If you still see a white screen:**

1. **Enable DevTools** (uncomment line in main.js)
2. **Check Console tab** for JavaScript errors
3. **Check Network tab** for failed requests
4. **Check Console.app** for Electron main process errors

## Alternative: Disable Standalone Mode (If Issues Persist)

If standalone mode causes problems, you can disable it:

1. Edit `next.config.js`:
   ```javascript
   output: undefined, // Remove standalone mode
   ```

2. Rebuild:
   ```bash
   npm run build
   npm run electron:build:mac
   ```

## Verifying the Build

To check what's included in the build:

```bash
# Check the built app structure
ls -la "dist/mac/Punsook Innotech.app/Contents/Resources/"

# Check if .next exists
ls -la "dist/mac/Punsook Innotech.app/Contents/Resources/.next/"
```

## Next Steps

1. **Rebuild and test** with the fixes
2. **Check Console.app** for any errors
3. **Report specific error messages** if the issue persists
4. **Remove DevTools** from production once working

## Debugging Checklist

- [ ] Server starts successfully (check console logs)
- [ ] `.next` folder exists in packaged app
- [ ] `node_modules` includes Next.js
- [ ] `public` folder files are included
- [ ] No errors in Console.app
- [ ] No JavaScript errors in DevTools
- [ ] Network requests succeed (check DevTools Network tab)

---

**Note:** The white screen is usually caused by the server not starting or the window loading before the server is ready. The fixes above address both of these issues.
