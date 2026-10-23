import { describe, it, expect } from 'vitest';
import { averageFit, formatMonthDay, fitValue, compareNullsLast } from '../lib/utils/ledger-format';

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

  describe('fitValue', () => {
    it('calculates average for (4, 5) -> 4.5', () => {
      expect(fitValue(4, 5)).toBe(4.5);
    });

    it('calculates average for (3, 3) -> 3', () => {
      expect(fitValue(3, 3)).toBe(3);
    });

    it('handles single value (4, null) -> 4', () => {
      expect(fitValue(4, null)).toBe(4);
    });

    it('handles single value (null, 5) -> 5', () => {
      expect(fitValue(null, 5)).toBe(5);
    });

    it('handles (null, null) -> null', () => {
      expect(fitValue(null, null)).toBeNull();
    });

    it('handles (undefined, undefined) -> null', () => {
      expect(fitValue(undefined, undefined)).toBeNull();
    });

    it('calculates average for (1, 2) -> 1.5', () => {
      expect(fitValue(1, 2)).toBe(1.5);
    });
  });

  describe('compareNullsLast', () => {
    it('returns negative for 3 vs 4 in asc', () => {
      expect(compareNullsLast(3, 4, true)).toBeLessThan(0);
    });

    it('returns positive for 3 vs 4 in desc', () => {
      expect(compareNullsLast(3, 4, false)).toBeGreaterThan(0);
    });

    it('returns positive for null vs 4 in asc AND desc', () => {
      expect(compareNullsLast(null, 4, true)).toBeGreaterThan(0);
      expect(compareNullsLast(null, 4, false)).toBeGreaterThan(0);
    });

    it('returns negative for 4 vs null in asc AND desc', () => {
      expect(compareNullsLast(4, null, true)).toBeLessThan(0);
      expect(compareNullsLast(4, null, false)).toBeLessThan(0);
    });

    it('returns 0 for null vs null', () => {
      expect(compareNullsLast(null, null, true)).toBe(0);
      expect(compareNullsLast(null, null, false)).toBe(0);
    });

    it('returns 0 for equal numbers', () => {
      expect(compareNullsLast(4, 4, true)).toBe(0);
      expect(compareNullsLast(4, 4, false)).toBe(0);
    });
  });
});
