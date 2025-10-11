import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateCode(prefix: string, sequence: number): string {
  return `${prefix}${sequence.toString().padStart(6, '0')}`;
}

// คำนวณน้ำหนักแห้งจากน้ำหนักสดและ %ยาง
export function calculateDryWeight(netWeight: number, rubberPercent: number): number {
  return (netWeight * rubberPercent) / 100;
}

// คำนวณราคาตาม %ยาง
export function calculateAdjustedPrice(
  basePrice: number,
  rubberPercent: number,
  priceRules: { minPercent: number; maxPercent: number; adjustment: number }[]
): number {
  const rule = priceRules.find(
    (r) => rubberPercent >= r.minPercent && rubberPercent <= r.maxPercent
  );
  
  return basePrice + (rule?.adjustment || 0);
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
export async function generateDocumentNumber(
  prefix: string,
  date: Date
): Promise<string> {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${prefix}-${year}${month}-${random}`;
}

