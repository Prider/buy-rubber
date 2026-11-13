import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SLIP_LOGO, normalizeSlipLogo, resolveSlipLogo, SLIP_LOGO_MAX_CHARS } from '../slipLogo';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('resolveSlipLogo', () => {
  it('uses the app icon when a new install has no logo', () => {
    expect(resolveSlipLogo(null)).toBe(DEFAULT_SLIP_LOGO);
    expect(resolveSlipLogo(undefined)).toBe(DEFAULT_SLIP_LOGO);
    expect(DEFAULT_SLIP_LOGO.startsWith('data:image/png;base64,')).toBe(true);
    const file = readFileSync(path.join(process.cwd(), 'public/icon.png'));
    const encoded = DEFAULT_SLIP_LOGO.slice('data:image/png;base64,'.length);
    expect(Buffer.from(encoded, 'base64').equals(file)).toBe(true);
  });

  it('keeps a removed logo blank', () => {
    expect(resolveSlipLogo('')).toBe('');
    expect(resolveSlipLogo('   ')).toBe('');
  });
});

describe('normalizeSlipLogo', () => {
  it('accepts a png, jpeg, or webp data URL', () => {
    expect(normalizeSlipLogo(PNG)).toBe(PNG);
    expect(normalizeSlipLogo('data:image/jpeg;base64,abc+/=')).toBe('data:image/jpeg;base64,abc+/=');
    expect(normalizeSlipLogo('  data:image/webp;base64,abcd  ')).toBe('data:image/webp;base64,abcd');
  });

  it('treats a blank value as a cleared logo', () => {
    expect(normalizeSlipLogo('   ')).toBe('');
  });

  it('rejects values that are not a stored logo', () => {
    expect(normalizeSlipLogo(null)).toBeNull();
    expect(normalizeSlipLogo('https://example.com/logo.png')).toBeNull();
    expect(normalizeSlipLogo('data:image/svg+xml;base64,PHN2Zz4=')).toBeNull();
    expect(normalizeSlipLogo('data:image/png;base64,<script>')).toBeNull();
    expect(normalizeSlipLogo(`data:image/png;base64,${'a'.repeat(SLIP_LOGO_MAX_CHARS)}`)).toBeNull();
  });
});
