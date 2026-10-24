import { describe, it, expect } from 'vitest';
import { resolveBackNavigation } from '../lib/utils/navigation';

describe('resolveBackNavigation', () => {
  it('navigates to dashboard when historyLength is 1 (clean or dirty)', () => {
    expect(resolveBackNavigation(1, false)).toBe('dashboard');
    expect(resolveBackNavigation(1, true)).toBe('dashboard');
  });

  it('navigates back when historyLength is 2 and clean, but to dashboard when dirty (guard state threshold)', () => {
    expect(resolveBackNavigation(2, false)).toBe('back');
    expect(resolveBackNavigation(2, true)).toBe('dashboard');
  });

  it('navigates back when historyLength is 3 (clean or dirty)', () => {
    expect(resolveBackNavigation(3, false)).toBe('back');
    expect(resolveBackNavigation(3, true)).toBe('back');
  });

  it('covers all 6 historyLength (1, 2, 3) x isDirty (false, true) combinations correctly', () => {
    const matrix: Array<{ length: number; isDirty: boolean; expected: 'back' | 'dashboard' }> = [
      { length: 1, isDirty: false, expected: 'dashboard' },
      { length: 1, isDirty: true, expected: 'dashboard' },
      { length: 2, isDirty: false, expected: 'back' },
      { length: 2, isDirty: true, expected: 'dashboard' },
      { length: 3, isDirty: false, expected: 'back' },
      { length: 3, isDirty: true, expected: 'back' },
    ];

    for (const { length, isDirty, expected } of matrix) {
      expect(resolveBackNavigation(length, isDirty)).toBe(expected);
    }
  });
});
