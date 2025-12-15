# Alert Modal Usage Guide

This document explains how to use the reusable Alert Modal system to replace `alert()` calls throughout the application.

## Setup

The `AlertProvider` is already added to the root layout (`src/app/layout.tsx`), so you can use it in any component without additional setup.

## Basic Usage

### 1. Import the hook

```typescript
import { useAlert } from '@/hooks/useAlert';
```

### 2. Use in your component

```typescript
export default function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useAlert();

  const handleAction = async () => {
    try {
      // Your async operation
      await someOperation();
      
      // Show success message
      showSuccess('สำเร็จ', 'การดำเนินการเสร็จสมบูรณ์');
    } catch (error) {
      // Show error message
      showError('เกิดข้อผิดพลาด', error.message);
    }
  };

  return (
    // Your component JSX
  );
}
```

## Available Methods

### `showSuccess(title, message, options?)`
Shows a success alert modal.

```typescript
showSuccess('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว');
```

### `showError(title, message, options?)`
Shows an error alert modal.

```typescript
showError('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
```

### `showWarning(title, message, options?)`
Shows a warning alert modal.

```typescript
showWarning('คำเตือน', 'กรุณาตรวจสอบข้อมูลก่อนบันทึก');
```

### `showInfo(title, message, options?)`
Shows an info alert modal.

```typescript
showInfo('ข้อมูล', 'ระบบจะอัพเดทในอีก 5 นาที');
```

### `showAlert(type, title, message, options?)`
Generic method to show any type of alert.

```typescript
showAlert('success', 'สำเร็จ', 'การดำเนินการเสร็จสมบูรณ์');
```

### `showConfirm(title, message, options?)`
Shows a confirmation modal and returns a Promise<boolean>. Returns `true` if user confirms, `false` if cancelled.

```typescript
const confirmed = await showConfirm(
  'ยืนยันการลบ',
  'คุณต้องการลบข้อมูลนี้หรือไม่?',
  {
    confirmText: 'ลบ',
    cancelText: 'ยกเลิก',
    variant: 'danger', // 'danger' | 'warning' | 'info'
  }
);

if (confirmed) {
  // User confirmed, proceed with action
  await deleteItem();
}
```

## Options

All methods accept an optional `options` parameter:

```typescript
{
  autoClose?: boolean;      // Auto-close the modal (default: false)
  autoCloseDelay?: number;  // Delay in milliseconds (default: 5000)
}
```

### Example with auto-close:

```typescript
showSuccess(
  'สำเร็จ',
  'บันทึกข้อมูลเรียบร้อยแล้ว',
  { autoClose: true, autoCloseDelay: 3000 }
);
```

## Features

- ✅ Non-blocking - doesn't freeze the UI
- ✅ Accessible - supports keyboard navigation (Escape to close)
- ✅ Auto-close option - can automatically close after a delay
- ✅ Multiple types - success, error, warning, info
- ✅ Beautiful design - matches the app's design system
- ✅ Dark mode support

## Migration from `alert()` and `confirm()`

### Before (alert):
```typescript
try {
  await saveData();
  alert('บันทึกข้อมูลเรียบร้อย');
} catch (error) {
  alert('เกิดข้อผิดพลาด: ' + error.message);
}
```

### After (alert):
```typescript
const { showSuccess, showError } = useAlert();

try {
  await saveData();
  showSuccess('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย');
} catch (error) {
  showError('เกิดข้อผิดพลาด', error.message);
}
```

### Before (confirm):
```typescript
if (window.confirm('ต้องการล้างตะกร้าหรือไม่?')) {
  clearCart();
}
```

### After (confirm):
```typescript
const { showConfirm } = useAlert();

const confirmed = await showConfirm(
  'ยืนยันการล้างตะกร้า',
  'ต้องการล้างตะกร้าหรือไม่?',
  { variant: 'warning' }
);

if (confirmed) {
  clearCart();
}
```

## Examples

### Example 1: Simple Success Message
```typescript
const { showSuccess } = useAlert();

const handleSave = async () => {
  await saveData();
  showSuccess('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว');
};
```

### Example 2: Error with Auto-close
```typescript
const { showError } = useAlert();

const handleDelete = async () => {
  try {
    await deleteItem();
  } catch (error) {
    showError(
      'เกิดข้อผิดพลาด',
      'ไม่สามารถลบข้อมูลได้',
      { autoClose: true, autoCloseDelay: 5000 }
    );
  }
};
```

### Example 3: Warning Message
```typescript
const { showWarning } = useAlert();

const handleAction = () => {
  if (hasUnsavedChanges) {
    showWarning('คำเตือน', 'คุณมีข้อมูลที่ยังไม่ได้บันทึก');
  }
};
```

### Example 4: Confirmation Dialog
```typescript
const { showConfirm } = useAlert();

const handleDelete = async () => {
  const confirmed = await showConfirm(
    'ยืนยันการลบ',
    'คุณต้องการลบข้อมูลนี้หรือไม่?\nการกระทำนี้ไม่สามารถยกเลิกได้',
    {
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
    }
  );

  if (confirmed) {
    await deleteItem();
    showSuccess('ลบสำเร็จ', 'ลบข้อมูลเรียบร้อยแล้ว');
  }
};
```

## Notes

- The modal is non-blocking, so the UI remains responsive
- Users can close the modal by clicking the backdrop, the close button, or pressing Escape
- Auto-close is optional and can be configured per alert
- The modal supports multi-line messages (use `\n` for line breaks)
- `showConfirm` returns a Promise<boolean>, so use `await` or `.then()` to handle the result
- Confirmation modals support three variants: 'danger' (red), 'warning' (yellow), 'info' (blue)
- Custom button text can be provided for confirm and cancel buttons

