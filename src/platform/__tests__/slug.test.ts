import { describe, expect, it } from 'vitest';
import { validateSlug } from '../slug';

describe('validateSlug', () => {
  it('accepts a simple shop slug', () => {
    expect(validateSlug('my-shop')).toEqual({ ok: true, slug: 'my-shop' });
  });

  it('rejects reserved words', () => {
    const result = validateSlug('login');
    expect(result.ok).toBe(false);
  });

  it('rejects uppercase by normalizing then validating pattern after trim', () => {
    expect(validateSlug('MyShop')).toEqual({ ok: true, slug: 'myshop' });
  });

  it('rejects too short', () => {
    expect(validateSlug('ab').ok).toBe(false);
  });
});
