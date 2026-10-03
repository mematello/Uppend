import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleGeminiProvider, OpenAICompatibleProvider, ProviderConfigError, ProviderUnavailableError } from '../lib/ai/provider';

describe('validateKey (Google and Groq)', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('GoogleGeminiProvider', () => {
    const google = new GoogleGeminiProvider('dummy-key'); // Key doesn't matter for mock
    
    it('returns true on 200 OK', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });
      const result = await google.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('returns false on 401 and 403', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
      expect(await google.validateKey('test-key')).toBe(false);
      
      fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
      expect(await google.validateKey('test-key')).toBe(false);
    });

    it('returns false on 400 with API_KEY_INVALID', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('{"error": {"details": [{"reason": "API_KEY_INVALID"}]}}')
      });
      expect(await google.validateKey('test-key')).toBe(false);
    });

    it('throws ProviderConfigError on 400 without API_KEY_INVALID, and 404', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('{"error": "Some other error"}')
      });
      await expect(google.validateKey('test-key')).rejects.toThrow(ProviderConfigError);

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      await expect(google.validateKey('test-key')).rejects.toThrow(ProviderConfigError);
    });

    it('throws ProviderUnavailableError on 429 and 500', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 429 });
      await expect(google.validateKey('test-key')).rejects.toThrow(ProviderUnavailableError);

      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(google.validateKey('test-key')).rejects.toThrow(ProviderUnavailableError);
    });

    it('throws ProviderUnavailableError on AbortError/Network error', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      fetchMock.mockRejectedValueOnce(abortError);
      
      const promise = google.validateKey('test-key');
      vi.advanceTimersByTime(5000);
      await expect(promise).rejects.toThrow(ProviderUnavailableError);
    });
  });

  describe('OpenAICompatibleProvider (Groq)', () => {
    const groq = new OpenAICompatibleProvider('test-key');
    
    it('returns true on 200 OK', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });
      const result = await groq.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('returns false on 401 and 403', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
      expect(await groq.validateKey('test-key')).toBe(false);
      
      fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
      expect(await groq.validateKey('test-key')).toBe(false);
    });

    it('throws ProviderConfigError on 400 and 404', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(groq.validateKey('test-key')).rejects.toThrow(ProviderConfigError);

      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(groq.validateKey('test-key')).rejects.toThrow(ProviderConfigError);
    });

    it('throws ProviderUnavailableError on 429 and 500', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 429 });
      await expect(groq.validateKey('test-key')).rejects.toThrow(ProviderUnavailableError);

      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(groq.validateKey('test-key')).rejects.toThrow(ProviderUnavailableError);
    });

    it('throws ProviderUnavailableError on AbortError/Network error', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      fetchMock.mockRejectedValueOnce(abortError);
      
      const promise = groq.validateKey('test-key');
      vi.advanceTimersByTime(5000);
      await expect(promise).rejects.toThrow(ProviderUnavailableError);
    });
  });
});
