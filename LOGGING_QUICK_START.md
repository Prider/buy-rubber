# 🚀 Logging System - Quick Start

## ✅ What's Implemented

### Core Logger
- **File:** `src/lib/logger.ts`
- **Features:**
  - ✅ File-based logging to `logs/app-YYYY-MM-DD.log`
  - ✅ JSON format with timestamps
  - ✅ 4 log levels: info, warn, error, debug
  - ✅ Auto log rotation (daily)
  - ✅ Console + file output

### Updated Files
- ✅ `src/lib/backup.ts` - Full logging
- ✅ `src/lib/backupScheduler.ts` - Full logging
- ✅ `src/app/api/backup/*` - All routes logged
- ✅ `src/app/api/auth/login/route.ts` - Login logging
- ✅ `src/app/api/expenses/route.ts` - Error logging
- ✅ `.gitignore` - Logs ignored

## 📖 Basic Usage

### Import
```typescript
import { logger } from '@/lib/logger';
```

### Examples
```typescript
// Info - General information
logger.info('User created successfully', { userId: '123' });

// Error - With error object
try {
  // code
} catch (error) {
  logger.error('Operation failed', error, { context: 'user creation' });
}

// Warning
logger.warn('Low disk space', { available: '10GB' });

// Debug - Only in development
logger.debug('Processing request', { method: 'POST', path: '/api' });
```

## 📁 Log Files

Logs are saved to:
```
logs/
  ├── app-2024-10-29.log
  ├── app-2024-10-30.log
  └── app-2024-10-31.log
```

## 📊 Log Format

Each log entry is JSON:
```json
{
  "timestamp": "2024-10-29T10:30:00.000Z",
  "level": "info",
  "message": "Backup created successfully",
  "data": { "fileName": "backup-2024-10-29T10-30-00.db" }
}
```

## 🔍 View Logs

### Terminal Commands
```bash
# View today's log
cat logs/app-$(date +%Y-%m-%d).log

# View and follow logs
tail -f logs/app-$(date +%Y-%m-%d).log

# Search for errors
grep "error" logs/app-*.log

# Count log entries
wc -l logs/app-$(date +%Y-%m-%d).log

# Pretty print JSON logs
cat logs/app-$(date +%Y-%m-%d).log | jq .
```

## 🎯 Migration Status

### ✅ Fully Migrated
- Backup system
- Authentication
- Expense operations

### 📝 Still Using Console
Most other API routes and components still use console statements. You can gradually migrate them using the `CONSOLE_TO_LOGGER_MIGRATION.md` guide.

## 🛠️ Quick Replace in IDE

Use Find & Replace:

1. **Find:** `console.error(`
   **Replace:** `logger.error(`

2. **Find:** `console.log(`
   **Replace:** `logger.info(`

3. **Find:** `console.warn(`
   **Replace:** `logger.warn(`

4. **Add at top of each file:**
   ```typescript
   import { logger } from '@/lib/logger';
   ```

## ✨ Next Steps

The logging system is ready! To complete the migration:

1. Review `CONSOLE_TO_LOGGER_MIGRATION.md`
2. Update remaining API routes
3. Update hooks
4. Update components
5. Test logging output

---
**Logging system is functional and ready to use!**
