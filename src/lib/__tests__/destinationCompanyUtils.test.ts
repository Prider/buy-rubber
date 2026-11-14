import { describe, it, expect } from 'vitest';
import { validateDestinationCompanyData } from '../destinationCompanyUtils';
import { THAI_PHONE_ERROR } from '../memberUtils';
import { DestinationCompany } from '@/types/destinationCompany';

const company = (overrides: Partial<DestinationCompany> = {}): DestinationCompany => ({
  id: '1',
  code: 'C001',
  name: 'บริษัท ยางไทย จำกัด',
  phone: '074311001',
  address: '',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('validateDestinationCompanyData', () => {
  it('allows a blank phone', () => {
    expect(validateDestinationCompanyData({ name: 'บริษัทใหม่', phone: '' }, [])).toBeNull();
    expect(validateDestinationCompanyData({ name: 'บริษัทใหม่', phone: '   ' }, [])).toBeNull();
  });

  it('accepts a Thai mobile or landline', () => {
    expect(validateDestinationCompanyData({ name: 'บริษัทใหม่', phone: '0812345678' }, [])).toBeNull();
    expect(validateDestinationCompanyData({ name: 'บริษัทใหม่', phone: '074311001' }, [])).toBeNull();
  });

  it('rejects a phone that is not a Thai mobile or landline', () => {
    expect(validateDestinationCompanyData({ name: 'บริษัทใหม่', phone: '12345' }, [])).toBe(THAI_PHONE_ERROR);
  });

  it('checks the phone before skipping the duplicate-name check on edit', () => {
    const existing = company();
    expect(
      validateDestinationCompanyData(
        { name: existing.name, phone: '12345' },
        [existing],
        existing,
      ),
    ).toBe(THAI_PHONE_ERROR);
  });
});
