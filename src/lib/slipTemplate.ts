import { type SlipPaperSizeId } from '@/lib/slipPaper';

/** slip = current receipt. signature = that receipt plus ผู้รับเงิน and ผู้จ่ายเงิน. a4 = full A4 sheet. */
export type SlipTemplateId = 'signature' | 'slip' | 'a4';

export const SLIP_TEMPLATE_STORAGE_KEY = 'slip_template';

export const DEFAULT_SLIP_TEMPLATE: SlipTemplateId = 'slip';

export const SLIP_TEMPLATE_OPTIONS: ReadonlyArray<{
  id: SlipTemplateId;
  label: string;
  hint: string;
}> = [
  { id: 'slip', label: 'สลิป', hint: 'มาตรฐาน' },
  { id: 'signature', label: 'สลิปมีลายเซ็น', hint: 'ผู้รับเงิน / ผู้จ่ายเงิน' },
  { id: 'a4', label: 'ใบ A4', hint: 'กระดาษ A4' },
];

export function normalizeSlipTemplate(raw: unknown): SlipTemplateId {
  if (raw === 'signature' || raw === 'slip' || raw === 'a4') return raw;
  return DEFAULT_SLIP_TEMPLATE;
}

/**
 * Missing template keeps the current slip, except a previously saved A4 paper size,
 * which selects the A4 sheet.
 */
export function resolveStoredSlipTemplate(templateRaw: unknown, paper: SlipPaperSizeId): SlipTemplateId {
  if (templateRaw === 'signature' || templateRaw === 'slip' || templateRaw === 'a4') return templateRaw;
  return paper === 'a4' ? 'a4' : DEFAULT_SLIP_TEMPLATE;
}

/** A4 template always prints on A4. Thermal templates never use the A4 sheet width. */
export function paperSizeForTemplate(template: SlipTemplateId, paper: SlipPaperSizeId): SlipPaperSizeId {
  if (template === 'a4') return 'a4';
  return paper === 'a4' ? '80mm' : paper;
}

export function getStoredSlipTemplate(): SlipTemplateId {
  if (typeof window === 'undefined') return DEFAULT_SLIP_TEMPLATE;
  try {
    return normalizeSlipTemplate(window.localStorage.getItem(SLIP_TEMPLATE_STORAGE_KEY));
  } catch {
    return DEFAULT_SLIP_TEMPLATE;
  }
}
