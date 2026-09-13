import { describe, it, expect } from 'vitest';
import { ROLE_SELECT_OPTIONS } from '../utils';

describe('user management role options', () => {
  it('does not include Root in the create/edit role dropdown', () => {
    expect(ROLE_SELECT_OPTIONS.map((option) => option.value)).toEqual([
      'viewer',
      'user',
      'admin',
    ]);
  });
});
