import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob } from '../utils';

describe('downloadBlob', () => {
  const createObjectURL = vi.fn(() => 'blob:mock-url');
  const revokeObjectURL = vi.fn();
  const click = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      return { href: '', download: '', click } as unknown as HTMLAnchorElement;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates an object URL, clicks a download link, then revokes the URL', () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    downloadBlob(blob, 'report.xls');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
