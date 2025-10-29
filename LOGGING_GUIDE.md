# 📝 Logging Guide

## ไฟล์ Logger
`src/lib/logger.ts`

## 🎯 การใช้งาน

### Import Logger
```typescript
import { logger, log } from '@/lib/logger';
```

### Log Levels

#### 1. Info Logging
```typescript
logger.info('User logged in successfully', { userId: '123', username: 'john' });
```
**Output:**
- Console: `[INFO] User logged in successfully { userId: '123', username: 'john' }`
- File: `logs/app-2024-10-29.log`

#### 2. Warning Logging
```typescript
logger.warn('Low disk space detected', { availableSpace: '10GB' });
```

#### 3. Error Logging
```typescript
try {
  // some code
} catch (error) {
  logger.error('Failed to process payment', error, { orderId: '12345' });
}
```

#### 4. Debug Logging
```typescript
logger.debug('Processing request', { method: 'POST', path: '/api/users' });
```
*Debug logs are only written in development mode*

## 📂 Log Files

### โครงสร้าง
```
logs/
  ├── app-2024-10-29.log
  ├── app-2024-10-30.log
  └── app-2024-10-31.log
```

### Format ข้อมูล
```json
{"timestamp":"2024-10-29T10:30:00.000Z","level":"info","message":"User logged in","data":{"userId":"123"}}
```

## 🔧 ตัวอย่างการใช้งาน

### 1. ใน API Routes
```typescript
// src/app/api/users/route.ts
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  logger.info('Fetching users');
  try {
    const users = await prisma.user.findMany();
    logger.info('Users fetched successfully', { count: users.length });
    return NextResponse.json(users);
  } catch (error) {
    logger.error('Failed to fetch users', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
```

### 2. ใน Server Components
```typescript
import { logger } from '@/lib/logger';

export async function ServerComponent() {
  logger.info('Server component rendered');
  // ...
}
```

### 3. ใน Custom Hooks
```typescript
import { logger } from '@/lib/logger';

export function useCustomHook() {
  useEffect(() => {
    logger.debug('Hook initialized');
  }, []);
}
```

### 4. ใน Backend Services
```typescript
// src/lib/backup.ts
import { logger } from './logger';

export async function createBackup(type: 'auto' | 'manual') {
  logger.info('Starting backup', { type });
  try {
    // backup logic
    logger.info('Backup completed successfully');
  } catch (error) {
    logger.error('Backup failed', error);
  }
}
```

## 📊 Log Rotation

Logger automatically creates new files daily:
- Format: `app-YYYY-MM-DD.log`
- One file per day

### Cleanup Old Logs
```typescript
import { cleanupOldLogs } from '@/lib/logger';

// Delete logs older than 30 days
cleanupOldLogs(30);
```

## ⚙️ Configuration

### Environment-based Logging
```typescript
// Only debug in development
if (process.env.NODE_ENV === 'development') {
  logger.debug('Debug information', data);
}
```

### Log Levels by Environment
- **Development**: All levels (info, warn, error, debug)
- **Production**: Only info, warn, error

## 📋 Best Practices

### ✅ DO
```typescript
// Good
logger.info('User created', { userId: user.id, username: user.username });
logger.error('Payment failed', error, { orderId, amount });
```

### ❌ DON'T
```typescript
// Bad - Don't log sensitive information
logger.info('User logged in', { password: user.password }); // ❌

// Bad - Don't log everything
logger.info('Processing...'); // Too vague
logger.info('a'); // Too short
```

## 🎨 Custom Logging

### Create Specialized Loggers

For backup operations:
```typescript
// src/lib/backupLogger.ts
import { logger } from './logger';

export const backupLogger = {
  start: () => logger.info('[BACKUP] Starting automatic backup'),
  success: (fileName: string) => logger.info('[BACKUP] Backup created', { fileName }),
  fail: (error: Error) => logger.error('[BACKUP] Backup failed', error),
};
```

## 📈 Monitoring

### View Logs
```bash
# View today's log
cat logs/app-$(date +%Y-%m-%d).log

# View all logs
ls -lh logs/

# Tail logs in real-time
tail -f logs/app-$(date +%Y-%m-%d).log

# Search for errors
grep "error" logs/app-*.log

# Search for specific user
grep "userId:123" logs/app-*.log
```

### Log Statistics
```bash
# Count log entries by level
grep -c "level" logs/app-*.log

# Find most common errors
grep "error" logs/app-*.log | sort | uniq -c | sort -rn
```

## 🔍 Integration Examples

### 1. Backup System
```typescript
import { logger } from '@/lib/logger';

export async function createBackup(type: 'auto' | 'manual') {
  logger.info('Creating backup', { type });
  // ... backup logic
}
```

### 2. Expense Operations
```typescript
import { logger } from '@/lib/logger';

export async function createExpense(data: any) {
  logger.info('Creating expense', { amount: data.amount, category: data.category });
  // ... logic
}
```

### 3. API Error Handling
```typescript
import { logger } from '@/lib/logger';

export async function handler(req: NextRequest) {
  try {
    // logic
  } catch (error) {
    logger.error('API error', error, { path: req.url, method: req.method });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## 🚀 Next Steps

### Advanced Features
1. **Log aggregation** - Send logs to external service
2. **Alerting** - Send notifications on errors
3. **Log analysis** - Build dashboard
4. **Sensitive data scrubbing** - Remove passwords, tokens
5. **Performance logging** - Track execution time

---
**เริ่มใช้งาน**: Import และใช้งาน logger ทันที!
