# 🔄 Console to Logger Migration Guide

## ✅ Files Already Updated

### 1. **src/lib/logger.ts** - Logger Utility
- ✅ Created logger with file output
- ✅ Supports: info, warn, error, debug
- ✅ Logs to `logs/app-YYYY-MM-DD.log`

### 2. **src/lib/backup.ts** - Backup Functions
- ✅ Replaced all `console.log` with `logger.info`
- ✅ Replaced all `console.error` with `logger.error`
- ✅ Added detailed logging throughout backup operations

### 3. **src/lib/backupScheduler.ts** - Scheduler
- ✅ Replaced all console statements with logger
- ✅ Added logging for scheduler lifecycle

### 4. **src/app/api/backup/route.ts** - Backup API
- ✅ Replaced all `console.error` with `logger.error`

### 5. **src/app/api/backup/settings/route.ts** - Settings API
- ✅ Replaced all `console.error` with `logger.error`

### 6. **src/app/api/backup/[id]/download/route.ts** - Download API
- ✅ Replaced all `console.error` with `logger.error`

### 7. **.gitignore**
- ✅ Added `/logs/` and `*.log` to ignore list

## 📝 Files That Need Updates

The following files still have console statements that should be migrated:

### API Routes
- [ ] `src/app/api/auth/login/route.ts`
- [ ] `src/app/api/auth/logout/route.ts`
- [ ] `src/app/api/dashboard/route.ts`
- [ ] `src/app/api/expenses/route.ts`
- [ ] `src/app/api/members/route.ts`
- [ ] `src/app/api/purchases/route.ts`
- [ ] `src/app/api/prices/daily/route.ts`
- [ ] `src/app/api/product-types/route.ts`
- [ ] `src/app/api/users/route.ts`

### Hooks
- [ ] `src/hooks/useCart.ts`
- [ ] `src/hooks/useDashboardData.ts`
- [ ] `src/hooks/useExpenses.ts`
- [ ] `src/hooks/useMembers.ts`
- [ ] `src/hooks/usePriceData.ts`
- [ ] `src/hooks/usePurchaseData.ts`
- [ ] `src/hooks/usePurchaseForm.ts`
- [ ] `src/hooks/useReportData.ts`
- [ ] `src/hooks/useAdminSettings.ts`

### Pages
- [ ] `src/app/login/page.tsx`
- [ ] `src/app/members/page.tsx`
- [ ] `src/app/prices/page.tsx`

### Components
- [ ] `src/components/purchases/CartTable.tsx`
- [ ] `src/components/members/MemberPurchaseHistoryModal.tsx`

### Libraries
- [ ] `src/lib/userStore.ts`

## 🛠️ How to Update Files

### Step 1: Import Logger
```typescript
import { logger } from '@/lib/logger';
```

### Step 2: Replace Console Statements

#### console.log → logger.info
```typescript
// Before
console.log('User logged in', { userId: '123' });

// After
logger.info('User logged in', { userId: '123' });
```

#### console.error → logger.error
```typescript
// Before
console.error('Error occurred:', error);

// After
logger.error('Error occurred', error);
```

#### console.warn → logger.warn
```typescript
// Before
console.warn('Warning:', data);

// After
logger.warn('Warning', data);
```

### Step 3: For Debug Statements
```typescript
// Before
console.log('Debug info:', data);

// After (only in development)
logger.debug('Debug info', data);
```

## 📋 Example Migration

### Before:
```typescript
export async function GET() {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### After:
```typescript
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const data = await fetchData();
    logger.info('Data fetched successfully', { count: data.length });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Failed to fetch data', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

## 🚀 Quick Migration Script

You can use find and replace in your IDE:

**Find:** `console.error(`
**Replace:** `logger.error(`

**Find:** `console.log(`
**Replace:** `logger.info(`

**Find:** `console.warn(`
**Replace:** `logger.warn(`

**Then add import at top of file:**
```typescript
import { logger } from '@/lib/logger';
```

## 📊 Benefits

1. ✅ All logs go to file: `logs/app-YYYY-MM-DD.log`
2. ✅ Structured JSON format
3. ✅ Automatic daily rotation
4. ✅ Easy to search and analyze
5. ✅ Production-ready logging

## 🎯 Next Steps

1. Update remaining API routes
2. Update hooks
3. Update pages
4. Update components
5. Test logging functionality

---
**Status**: Core backup and logger files are done. Use this guide to migrate the rest!
