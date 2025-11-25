# Logging System Guide

## 📋 Overview

Your project uses a custom file-based logging system located at `src/lib/logger.ts`. Logs are automatically written to files in the `logs/` directory with daily rotation.

---

## 📂 Log File Location

Logs are stored in different locations depending on the environment:

### **In Development (Next.js)**
```
/Users/pawat/Desktop/biglatex-pro/logs/
```

### **In Electron App (Production)**
```
~/Library/Application Support/Punsook Innotech/logs/
```
*The logger automatically detects if running in Electron and uses the app's userData directory*

---

## 📝 Log File Format

### **File Naming Convention**
```
app-YYYY-MM-DD.log
```

Examples:
- `app-2025-11-16.log`
- `app-2025-11-17.log`

**One file per day** - logs automatically rotate daily

### **Log Entry Format (JSON)**

Each log entry is a JSON object on a single line:

```json
{
  "timestamp": "2025-11-16T09:48:11.701Z",
  "level": "info",
  "message": "Login successful",
  "data": {
    "userId": "3a7044cc-5cca-4211-bf81-34e94a1e228c",
    "username": "admin"
  }
}
```

---

## 🎯 Log Levels

The logger supports 4 log levels:

| Level | Purpose | Console Color | When to Use |
|-------|---------|---------------|-------------|
| **INFO** | General information | Default | Normal operations, successful actions |
| **WARN** | Warning messages | Yellow | Potential issues, non-critical problems |
| **ERROR** | Error messages | Red | Failures, exceptions, critical issues |
| **DEBUG** | Debug information | Gray | Development only, detailed traces |

---

## 💻 Usage Examples

### **Import the Logger**

```typescript
import { logger } from '@/lib/logger';
// or
import { log } from '@/lib/logger';
```

### **Basic Logging**

```typescript
// Info log
logger.info('User logged in successfully');

// Warning log
logger.warn('Database query took longer than expected');

// Error log
logger.error('Failed to save data', error);

// Debug log (only in development)
logger.debug('Processing request', { userId, action });
```

### **Logging with Additional Data**

```typescript
// Info with data
logger.info('Purchase created', {
  purchaseNo: 'P2024-001',
  memberId: 'M001',
  amount: 1500
});

// Error with data
logger.error('API request failed', error, {
  endpoint: '/api/members',
  method: 'POST'
});
```

---

## 🔍 Current Usage in Project

The logger is used in **20 files** across the project:

### **API Routes**
- `src/app/api/auth/login/route.ts` - Authentication logs
- `src/app/api/backup/route.ts` - Backup operations
- `src/app/api/expenses/route.ts` - Expense operations
- `src/app/api/members/[id]/servicefees/route.ts` - Service fees
- `src/app/api/servicefees/route.ts` - Service fee operations

### **Hooks**
- `src/hooks/useCart.ts` - Cart operations
- `src/hooks/useMembers.ts` - Member management
- `src/hooks/usePurchaseForm.ts` - Purchase form
- `src/hooks/useExpenses.ts` - Expense management
- `src/hooks/useDashboardData.ts` - Dashboard data
- `src/hooks/useReportData.ts` - Report generation
- `src/hooks/usePriceData.ts` - Price management

### **Utilities**
- `src/lib/backup.ts` - Backup/restore operations
- `src/lib/backupScheduler.ts` - Scheduled backups

### **Components**
- `src/components/UserManagement.tsx` - User management
- `src/components/purchases/CartTable.tsx` - Cart table

---

## 🛠️ Advanced Features

### **1. Automatic Log Cleanup**

Old logs are automatically deleted to save disk space:

```typescript
import { cleanupOldLogs } from '@/lib/logger';

// Keep logs for 30 days (default)
cleanupOldLogs();

// Keep logs for 7 days
cleanupOldLogs(7);
```

### **2. Environment-Aware Logging**

- **Browser**: Only logs to console (file writing is skipped)
- **Server**: Logs to both console and file
- **Debug logs**: Only appear in development mode

### **3. Error Handling**

The logger includes automatic error formatting:

```typescript
try {
  // Some operation
} catch (error) {
  logger.error('Operation failed', error);
  // Automatically extracts error.message and error.stack
}
```

---

## 📊 Log File Examples

### **Authentication Log**
```json
{"timestamp":"2025-11-16T09:48:11.705Z","level":"info","message":"Login attempt","data":{"username":"admin","password":"***"}}
{"timestamp":"2025-11-16T09:48:11.832Z","level":"info","message":"Login successful","data":{"userId":"3a7044cc-5cca-4211-bf81-34e94a1e228c","username":"admin","role":"admin"}}
```

### **Error Log**
```json
{"timestamp":"2025-11-16T10:15:23.456Z","level":"error","message":"Failed to create backup","data":{"error":{"message":"EACCES: permission denied","stack":"Error: EACCES..."}}}
```

### **Debug Log**
```json
{"timestamp":"2025-11-16T09:48:11.701Z","level":"debug","message":"Login API - DATABASE_URL","data":{"isSet":true,"masked":"file:./***"}}
```

---

## 🔧 Technical Details

### **How It Works**

1. **Lazy Loading**: Server modules (`fs`, `path`) are loaded only when needed
2. **Browser Safety**: File operations are skipped in browser environment
3. **Electron Detection**: Automatically uses Electron's userData path
4. **Daily Rotation**: New log file created each day
5. **JSON Format**: Each entry is valid JSON for easy parsing

### **File Writing**

```typescript
// Synchronous append to log file
fs.appendFileSync(logFilePath, logEntry + '\n');
```

**Why synchronous?**
- Ensures logs are written immediately
- Prevents loss of critical error logs
- Simple and reliable

---

## 📈 Viewing Logs

### **Command Line**

```bash
# View today's logs
tail -f logs/app-$(date +%Y-%m-%d).log

# View latest 50 entries
tail -50 logs/app-2025-11-16.log

# Pretty print JSON logs
cat logs/app-2025-11-16.log | jq

# Search for errors
grep '"level":"error"' logs/*.log

# Search for specific user
grep 'admin' logs/app-2025-11-16.log | jq
```

### **In Code (Log Analysis)**

```typescript
import fs from 'fs';

// Read and parse log file
const logFile = 'logs/app-2025-11-16.log';
const logs = fs.readFileSync(logFile, 'utf-8')
  .split('\n')
  .filter(line => line.trim())
  .map(line => JSON.parse(line));

// Filter errors
const errors = logs.filter(log => log.level === 'error');

// Find specific user actions
const userLogs = logs.filter(log => 
  log.data?.username === 'admin'
);
```

---

## 🎯 Best Practices

### **1. Use Appropriate Log Levels**

```typescript
// ✅ Good
logger.info('User created', { userId, username });
logger.warn('API rate limit approaching', { current, limit });
logger.error('Database connection failed', error);

// ❌ Bad
logger.info('Error occurred'); // Use error level!
logger.error('User clicked button'); // Use info or debug!
```

### **2. Include Relevant Context**

```typescript
// ✅ Good
logger.error('Failed to process payment', error, {
  orderId: order.id,
  amount: order.total,
  userId: user.id
});

// ❌ Bad
logger.error('Payment failed'); // No context!
```

### **3. Don't Log Sensitive Data**

```typescript
// ✅ Good
logger.info('Login attempt', { username: user.username });

// ❌ Bad
logger.info('Login attempt', { 
  username: user.username, 
  password: user.password // Never log passwords!
});
```

### **4. Use Debug for Development Only**

```typescript
// Debug logs only appear in development
logger.debug('Processing cart items', { cart });
```

---

## 🚀 Future Enhancements

Potential improvements you could add:

1. **Log Levels Configuration** - Enable/disable specific levels
2. **Log Rotation by Size** - Rotate when file reaches certain size
3. **Remote Logging** - Send logs to external service
4. **Log Viewer UI** - Built-in web interface to view logs
5. **Performance Metrics** - Track execution times
6. **Structured Logging** - Add correlation IDs for request tracking

---

## 📋 Summary

✅ **Automatic daily log rotation**  
✅ **JSON format for easy parsing**  
✅ **Works in both browser and server**  
✅ **Electron-aware (uses userData path)**  
✅ **4 log levels (info, warn, error, debug)**  
✅ **Automatic cleanup of old logs**  
✅ **Used across 20+ files in project**  
✅ **Safe error handling**  

Your logging system is production-ready and actively logging all important operations! 🎉

