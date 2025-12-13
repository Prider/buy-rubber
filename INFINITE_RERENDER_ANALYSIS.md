# Infinite Re-rendering Analysis

This document identifies components and hooks that have potential infinite re-rendering problems that could cause app crashes.

## 🔴 CRITICAL ISSUES (High Risk of Infinite Loops)

### 1. `src/hooks/usePriceData.ts` - Missing Dependency in useEffect
**Location:** Lines 18-25

**Problem:**
```typescript
useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    router.push('/login');
    return;
  }
  loadData(); // ❌ loadData is not in dependency array
}, [router]); // Only router is in dependencies
```

**Issue:**
- `loadData` is called inside `useEffect` but not included in the dependency array
- `loadData` is a regular function (not memoized), so it's recreated on every render
- If `loadData` changes, the effect won't re-run, but if `router` changes, it will call a stale `loadData`
- **Risk:** Medium - Could cause stale closures or missing updates

**Fix:**
```typescript
const loadData = useCallback(async () => {
  // ... existing code
}, []);

useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    router.push('/login');
    return;
  }
  loadData();
}, [router, loadData]); // Add loadData to dependencies
```

---

### 2. `src/hooks/usePurchaseForm.ts` - Potential Date Update Loop
**Location:** Lines 58-62

**Problem:**
```typescript
useEffect(() => {
  if (!formData.date) {
    setFormData(prev => ({ ...prev, date: getTodayDate() }));
  }
}, [formData.date]);
```

**Issue:**
- If `formData.date` becomes empty or falsy after being set, this could trigger a loop
- `getTodayDate()` is called on every render (not memoized), but it should be stable
- **Risk:** Low-Medium - Only problematic if date somehow becomes empty after being set

**Fix:**
```typescript
const todayDate = useMemo(() => getTodayDate(), []);

useEffect(() => {
  if (!formData.date) {
    setFormData(prev => ({ ...prev, date: todayDate }));
  }
}, [formData.date, todayDate]);
```

---

## 🟡 MEDIUM RISK ISSUES (Potential Performance Problems)

### 3. `src/contexts/AuthContext.tsx` - Context Value Recreation
**Location:** Lines 113-121

**Problem:**
```typescript
const value: AuthContextType = {
  user,
  isAuthenticated: !!user,
  isLoading,
  login,
  logout,
  hasRole,
  hasAnyRole,
};
```

**Issue:**
- The `value` object is recreated on every render
- All consumers of `AuthContext` will re-render unnecessarily
- `login`, `logout`, `hasRole`, `hasAnyRole` are not memoized
- **Risk:** Medium - Causes unnecessary re-renders of all authenticated components

**Fix:**
```typescript
const login = useCallback(async (username: string, password: string): Promise<boolean> => {
  // ... existing code
}, []);

const logout = useCallback(async () => {
  // ... existing code
}, []);

const hasRole = useCallback((role: UserRole): boolean => {
  return user?.role === role;
}, [user?.role]);

const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
  return user ? roles.includes(user.role) : false;
}, [user]);

const value: AuthContextType = useMemo(() => ({
  user,
  isAuthenticated: !!user,
  isLoading,
  login,
  logout,
  hasRole,
  hasAnyRole,
}), [user, isLoading, login, logout, hasRole, hasAnyRole]);
```

---

### 4. `src/app/(authenticated)/members/page.tsx` - Multiple Dependencies
**Location:** Line 111

**Problem:**
```typescript
useEffect(() => {
  if (authLoading) return;
  if (!user) {
    router.push('/login');
    return;
  }
  loadMembers(currentPage, debouncedSearchTerm);
}, [user, authLoading, router, currentPage, debouncedSearchTerm, loadMembers]);
```

**Issue:**
- `loadMembers` is in the dependency array. If it's not properly memoized, it could change on every render
- `router` from Next.js is generally stable, but could change
- **Risk:** Low-Medium - Depends on `loadMembers` stability

**Status:** ✅ `loadMembers` is memoized with `useCallback` in `useMembers.ts`, so this should be safe.

---

### 5. `src/components/purchases/PurchasesList.tsx` - loadTransactions Dependency
**Location:** Line 74

**Problem:**
```typescript
useEffect(() => {
  loadTransactions(currentPage, debouncedSearchTerm || undefined);
}, [currentPage, debouncedSearchTerm, loadTransactions]);
```

**Issue:**
- `loadTransactions` is in the dependency array
- If `loadTransactions` is not stable, this could cause infinite loops
- **Risk:** Low - `loadTransactions` is memoized with `useCallback` in `usePurchaseTransactions.ts`

**Status:** ✅ Should be safe, but worth monitoring.

---

### 6. `src/hooks/useExpenses.ts` - Pagination Object Dependencies
**Location:** Lines 171, 183, 187, 191

**Problem:**
```typescript
const createExpense = useCallback(async (expenseData: any) => {
  // ...
  await loadExpenses({ page: 1, pageSize: pagination.pageSize });
}, [loadExpenses, pagination.pageSize]); // ❌ pagination.pageSize could change

const deleteExpense = useCallback(async (id: string) => {
  // ...
  await loadExpenses({ page: pagination.page, pageSize: pagination.pageSize });
}, [loadExpenses, pagination.page, pagination.pageSize]); // ❌ pagination properties
```

**Issue:**
- Multiple callbacks depend on `pagination.pageSize` and `pagination.page`
- If `pagination` object is recreated (even with same values), all these callbacks will be recreated
- This could cause cascading re-renders
- **Risk:** Medium - Could cause unnecessary re-renders

**Fix:**
```typescript
// Extract values to avoid object recreation issues
const pageSize = pagination.pageSize;
const currentPage = pagination.page;

const createExpense = useCallback(async (expenseData: any) => {
  // ...
  await loadExpenses({ page: 1, pageSize });
}, [loadExpenses, pageSize]);
```

---

### 7. `src/hooks/useMembers.ts` - Circular Dependencies
**Location:** Lines 43, 55, 67, 80

**Problem:**
```typescript
const createMember = useCallback(async (data: MemberFormData) => {
  // ...
  await loadMembers(); // Refresh the list
}, [loadMembers]);

const updateMember = useCallback(async (id: string, data: MemberFormData) => {
  // ...
  await loadMembers(); // Refresh the list
}, [loadMembers]);
```

**Issue:**
- All mutation functions (`createMember`, `updateMember`, `deleteMember`, `reactivateMember`) depend on `loadMembers`
- `loadMembers` is memoized, so it should be stable
- However, if `loadMembers` changes, all these functions change, potentially causing cascading updates
- **Risk:** Low - Should be safe since `loadMembers` is memoized

**Status:** ✅ Should be safe, but creates tight coupling.

---

## 🟢 LOW RISK ISSUES (Minor Optimizations)

### 8. `src/hooks/usePurchaseData.ts` - Cleanup Dependency
**Location:** Line 44

**Problem:**
```typescript
useEffect(() => {
  return () => {
    cleanup();
  };
}, [cleanup]);
```

**Issue:**
- `cleanup` is in the dependency array, but it's memoized with `useCallback`
- **Risk:** Very Low - Should be safe

**Status:** ✅ Should be safe.

---

### 9. `src/hooks/useDashboardData.ts` - loadData Dependency
**Location:** Line 95

**Problem:**
```typescript
useEffect(() => {
  mountedRef.current = true;
  loadData();
  
  return () => {
    mountedRef.current = false;
  };
}, [loadData]);
```

**Issue:**
- `loadData` is in the dependency array
- `loadData` is memoized with `useCallback` with empty deps `[]`
- **Risk:** Very Low - Should be safe

**Status:** ✅ Should be safe.

---

## 📋 Summary of Recommendations

### Immediate Actions Required:
1. ✅ **Fix `usePriceData.ts`** - Memoize `loadData` and add to dependencies
2. ✅ **Fix `AuthContext.tsx`** - Memoize context value and all functions
3. ✅ **Fix `useExpenses.ts`** - Extract pagination values to avoid object recreation

### Monitoring Required:
- Watch for re-render patterns in `members/page.tsx`
- Monitor `PurchasesList` component for unnecessary re-renders
- Check if `usePurchaseForm` date logic causes issues

### Best Practices Applied:
- ✅ Most hooks use `useCallback` for functions
- ✅ Most hooks use `useMemo` for computed values
- ✅ Cleanup functions are properly implemented
- ✅ Cancel tokens are used for request cancellation

---

## 🔍 How to Detect Infinite Loops

1. **React DevTools Profiler:**
   - Use the Profiler to identify components that re-render excessively
   - Look for components that re-render on every state change

2. **Console Logging:**
   - Add `console.log` in `useEffect` hooks to track when they run
   - If you see the same effect running repeatedly, you have a loop

3. **React Strict Mode:**
   - In development, React Strict Mode double-invokes effects
   - This can help catch dependency issues early

4. **Performance Monitoring:**
   - Monitor CPU usage - infinite loops will cause high CPU
   - Check browser DevTools Performance tab for excessive re-renders

---

## 🛠️ Testing Checklist

- [ ] Test `usePriceData` hook with router changes
- [ ] Test `AuthContext` with multiple consumers
- [ ] Test `useExpenses` with rapid pagination changes
- [ ] Test `usePurchaseForm` with date edge cases
- [ ] Monitor `PurchasesList` for re-render frequency
- [ ] Test `members/page.tsx` with rapid search changes

