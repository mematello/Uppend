import { describe, it, expect } from 'vitest';
import { resolveTryFirst, getProviderFromModel, BYOK_PROVIDERS } from '../lib/ai/providers';
import { BYOK_PROVIDERS as BYOK_PROVIDERS_FROM_BYOK } from '../lib/ai/byok';
import { AI_MODELS } from '../lib/ai/models';

describe('Providers Helpers', () => {
  describe('resolveTryFirst', () => {
    it('returns preferred if held', () => {
      expect(resolveTryFirst('groq', ['google', 'groq'])).toBe('groq');
      expect(resolveTryFirst('google', ['google'])).toBe('google');
    });

    it('returns first held in order (google before groq) if preferred is not held or null', () => {
      expect(resolveTryFirst('groq', ['google'])).toBe('google');
      expect(resolveTryFirst(null, ['groq', 'google'])).toBe('google');
      expect(resolveTryFirst(null, ['groq'])).toBe('groq');
    });

    it('returns null if none held', () => {
      expect(resolveTryFirst('google', [])).toBe(null);
      expect(resolveTryFirst(null, [])).toBe(null);
    });
  });

  describe('getProviderFromModel', () => {
    it('agrees with getProviderPrefix for every AI_MODELS name', () => {
      // Re-implement the getProviderPrefix logic from byok.ts to test against
      const getProviderPrefix = (name: string) => {
        if (!name) return 'google';
        if (name.startsWith('groq:')) return 'groq';
        if (name.startsWith('gemini') || name.includes('gemini')) return 'google';
        return 'google';
      };

      for (const model of AI_MODELS) {
        expect(getProviderFromModel(model.name)).toBe(getProviderPrefix(model.name));
      }
    });
  });

  describe('BYOK_PROVIDERS allowlist', () => {
    it('matches the allowlist in lib/ai/byok.ts', () => {
      expect(BYOK_PROVIDERS).toEqual(BYOK_PROVIDERS_FROM_BYOK);
    });
  });
});
