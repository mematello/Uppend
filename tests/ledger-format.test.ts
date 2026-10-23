import { describe, it, expect } from 'vitest';
import { averageFit, formatMonthDay } from '../lib/utils/ledger-format';

describe('ledger-format utils', () => {
  describe('averageFit', () => {
    it('averages (4, 5) -> "4.5/5"', () => {
      expect(averageFit(4, 5)).toBe('4.5/5');
    });

    it('averages (3, 3) -> "3/5"', () => {
      expect(averageFit(3, 3)).toBe('3/5');
    });

    it('handles single value (4, null) -> "4/5"', () => {
      expect(averageFit(4, null)).toBe('4/5');
    });

    it('handles single value (null, 5) -> "5/5"', () => {
      expect(averageFit(null, 5)).toBe('5/5');
    });

    it('handles (null, null) -> "—"', () => {
      expect(averageFit(null, null)).toBe('—');
    });

    it('handles (undefined, undefined) -> "—"', () => {
      expect(averageFit(undefined, undefined)).toBe('—');
    });

    it('averages (1, 2) -> "1.5/5"', () => {
      expect(averageFit(1, 2)).toBe('1.5/5');
    });
  });

  describe('formatMonthDay', () => {
    it('formats "2026-10-21" -> "OCT 21"', () => {
      expect(formatMonthDay('2026-10-21')).toBe('OCT 21');
    });

    it('formats "2026-09-08" -> "SEP 8"', () => {
      expect(formatMonthDay('2026-09-08')).toBe('SEP 8');
    });

    it('formats ISO string "2026-01-01T00:00:00Z" -> "JAN 1"', () => {
      expect(formatMonthDay('2026-01-01T00:00:00Z')).toBe('JAN 1');
    });

    it('formats "2026-12-31" -> "DEC 31"', () => {
      expect(formatMonthDay('2026-12-31')).toBe('DEC 31');
    });

    it('handles null -> "—"', () => {
      expect(formatMonthDay(null)).toBe('—');
    });

    it('handles empty string -> "—"', () => {
      expect(formatMonthDay('')).toBe('—');
    });

    it('handles invalid date string "not-a-date" -> "—"', () => {
      expect(formatMonthDay('not-a-date')).toBe('—');
    });
  });
});
