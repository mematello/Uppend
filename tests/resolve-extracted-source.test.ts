import { describe, it, expect } from 'vitest';
import { resolveExtractedSource } from '../lib/constants';

describe('resolveExtractedSource', () => {
  it('returns hasSource=false and source="" for null, undefined, empty, and whitespace strings', () => {
    const emptyInputs = [null, undefined, '', '   ', '\t\n'];
    for (const input of emptyInputs) {
      const result = resolveExtractedSource(input);
      expect(result).toEqual({ source: '', isOther: false, hasSource: false });
      expect(result.hasSource).toBe(false);
      expect(result.source).toBe('');
      expect(result.isOther).toBe(false);
    }
  });

  it('matches known SOURCE_OPTIONS keywords with isOther=false and hasSource=true', () => {
    const knownCases: Array<{ raw: string; expectedSource: string }> = [
      { raw: 'Found on LinkedIn', expectedSource: 'LinkedIn' },
      { raw: 'Indeed Job Post', expectedSource: 'Indeed' },
      { raw: 'via jobstreet search', expectedSource: 'JobStreet' },
      { raw: 'Shared in a Facebook group', expectedSource: 'Facebook' },
      { raw: 'Company Careers Page', expectedSource: 'Company Website' },
      { raw: 'Referred by a colleague', expectedSource: 'Referral' },
    ];

    for (const { raw, expectedSource } of knownCases) {
      const result = resolveExtractedSource(raw);
      expect(result.hasSource).toBe(true);
      expect(result.isOther).toBe(false);
      expect(result.source).toBe(expectedSource);
    }
  });

  it('handles unmatched natural text with isOther=true and hasSource=true', () => {
    const unmatchedCases = [
      'TechCareers blog newsletter',
      'Handshake virtual career fair',
      'HackerNews Who is Hiring thread',
    ];

    for (const raw of unmatchedCases) {
      const result = resolveExtractedSource(raw);
      expect(result.hasSource).toBe(true);
      expect(result.isOther).toBe(true);
      expect(result.source).toBe(raw);
    }
  });

  it('enforces invariant: hasSource false implies source="" and isOther=false', () => {
    const inputs = [null, undefined, '', '   ', ' \t \r\n '];
    for (const input of inputs) {
      const result = resolveExtractedSource(input);
      if (!result.hasSource) {
        expect(result.source).toBe('');
        expect(result.isOther).toBe(false);
      }
    }
  });

  it('ensures empty extraction never yields a value that could overwrite a source', () => {
    const emptyValues = [null, undefined, '', '    '];
    for (const raw of emptyValues) {
      const result = resolveExtractedSource(raw);
      expect(result.hasSource).toBe(false);
      // Caller logic: result.hasSource ? result.source : prev.source
      const prevSource = 'LinkedIn';
      const nextSource = result.hasSource ? result.source : prevSource;
      expect(nextSource).toBe(prevSource);
    }
  });
});
