import { describe, it, expect } from 'vitest';
import {
  normalizeSlipTemplate,
  paperSizeForTemplate,
  resolveStoredSlipTemplate,
} from '../slipTemplate';

describe('slipTemplate', () => {
  it('accepts the three template ids and falls back to the current slip', () => {
    expect(normalizeSlipTemplate('signature')).toBe('signature');
    expect(normalizeSlipTemplate('slip')).toBe('slip');
    expect(normalizeSlipTemplate('a4')).toBe('a4');
    expect(normalizeSlipTemplate('letter')).toBe('slip');
    expect(normalizeSlipTemplate(null)).toBe('slip');
  });

  it('treats a saved A4 paper size as the A4 template when no template is stored', () => {
    expect(resolveStoredSlipTemplate(undefined, 'a4')).toBe('a4');
    expect(resolveStoredSlipTemplate(undefined, '80mm')).toBe('slip');
    expect(resolveStoredSlipTemplate('signature', 'a4')).toBe('signature');
  });

  it('locks paper size to the template', () => {
    expect(paperSizeForTemplate('a4', '58mm')).toBe('a4');
    expect(paperSizeForTemplate('slip', 'a4')).toBe('80mm');
    expect(paperSizeForTemplate('signature', '104mm')).toBe('104mm');
  });
});
