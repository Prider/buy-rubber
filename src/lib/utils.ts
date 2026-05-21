import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NextRequest } from 'next/server';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
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

// คำนวณน้ำหนักแห้งจากน้ำหนักสดและ %ยาง
export function calculateDryWeight(netWeight: number, rubberPercent: number): number {
  return (netWeight * rubberPercent) / 100;
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
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.userId && decoded.username) {
      return { userId: decoded.userId, username: decoded.username };
    }
    return null;
  } catch {
    return null;
  }
}

