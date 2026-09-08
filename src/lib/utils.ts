import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NextRequest } from 'next/server';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

export function generateCode(prefix: string, sequence: number): string {
  return `${prefix}${sequence.toString().padStart(6, '0')}`;
}

// คำนวณน้ำหนักสุทธิจากน้ำหนักรวมภาชนะลบน้ำหนักภาชนะ
export function calculateNetWeight(grossWeight: number, containerWeight: number = 0): number {
  return grossWeight - containerWeight;
}

// คำนวณน้ำหนักแห้งจากน้ำหนักสดและ %ยาง
export function calculateDryWeight(netWeight: number, rubberPercent: number): number {
  return (netWeight * rubberPercent) / 100;
}

// ปรับราคาต่อกก. ตาม %ยาง (DRC) — คิดเป็นสัดส่วนของราคากลาง
export function calculateAdjustedPrice(
  basePrice: number,
  rubberPercent?: number | null
): number {
  if (rubberPercent == null || Number.isNaN(rubberPercent)) {
    return basePrice;
  }
  return (basePrice * rubberPercent) / 100;
}

// คำนวณการแบ่งเงินเจ้าของสวนและคนตัด
export function calculateSplit(
  totalAmount: number,
  ownerPercent: number,
  tapperPercent: number
): { ownerAmount: number; tapperAmount: number } {
  const ownerAmount = (totalAmount * ownerPercent) / 100;
  const tapperAmount = (totalAmount * tapperPercent) / 100;
  
  return { ownerAmount, tapperAmount };
}

// สร้างเลขที่เอกสารอัตโนมัติ
export function generateDocumentNumber(prefix: string, date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  // Use last 6 digits of unix-ms timestamp — monotonically increasing within a process,
  // ~1M unique values vs the previous 10K random, and still collision-safe when callers
  // wrap creation in a retry on Prisma P2002 (unique constraint violation).
  const seq = (Date.now() % 1_000_000).toString().padStart(6, '0');
  return `${prefix}-${year}${month}-${seq}`;
}

// Helper function to extract user info from auth token
export function getUserFromToken(request: NextRequest): { userId: string; username: string } | null {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const user = getVerifiedUserFromToken(token);
  if (!user) {
    return null;
  }

  return { userId: user.userId, username: user.username };
}

