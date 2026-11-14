import type { MoistureUnit } from '@/lib/purchases/moisture';
import type { PurchaseLine } from './types';

export interface PurchaseEditFormValues {
  date: string;
  memberId: string;
  productTypeId: string;
  grossWeight: string;
  containerWeight: string;
  netWeight: string;
  pricePerUnit: string;
  moisturePercent: string;
  moistureUnit: MoistureUnit;
  bonusPrice: string;
  notes: string;
}

export function toDateInputValue(value: string): string {
  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (dateOnly && !value.includes('T')) {
    return dateOnly[1];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return dateOnly?.[1] ?? '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function purchaseToFormSource(purchase: PurchaseLine) {
  return {
    date: toDateInputValue(purchase.date),
    memberId: purchase.member?.id ?? purchase.memberId ?? '',
    productTypeId: purchase.productType?.id ?? purchase.productTypeId ?? '',
    grossWeight: purchase.grossWeight,
    containerWeight: purchase.containerWeight,
    pricePerUnit: purchase.basePrice ?? purchase.finalPrice,
    moisturePercent: purchase.moisturePercent ?? 0,
    moistureUnit: purchase.moistureUnit === 'kg' ? 'kg' : 'baht',
    bonusPrice: purchase.bonusPrice ?? 0,
    notes: purchase.notes ?? '',
  };
}

export function buildPurchaseUpdateBody(form: PurchaseEditFormValues, purchase: PurchaseLine) {
  const dateUnchanged = form.date === toDateInputValue(purchase.date);
  return {
    date: dateUnchanged ? purchase.date : form.date,
    memberId: form.memberId,
    productTypeId: form.productTypeId,
    grossWeight: Number(form.grossWeight),
    containerWeight: form.containerWeight === '' ? 0 : Number(form.containerWeight),
    netWeight: Number(form.netWeight),
    moisturePercent: form.moisturePercent === '' ? 0 : Number(form.moisturePercent),
    moistureUnit: form.moistureUnit,
    pricePerUnit: Number(form.pricePerUnit),
    bonusPrice: form.bonusPrice === '' ? 0 : Number(form.bonusPrice),
    notes: form.notes,
    rubberPercent: purchase.rubberPercent ?? null,
  };
}
