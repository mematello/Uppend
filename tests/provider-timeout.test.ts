import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseProviderError } from '../lib/ai/models';
import { z } from 'zod';
import { GoogleGeminiProvider, OpenAICompatibleProvider, PROVIDER_TIMEOUT_MS } from '../lib/ai/provider';

describe('parseProviderError timeout & network error detection', () => {
  describe('Timeout and Network Error Shapes', () => {
    it('classifies AbortError (DOMException / Error) as TEMPORARY_PROVIDER with retryAfterSeconds 30', () => {
      const err = new DOMException('This operation was aborted', 'AbortError');
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
      expect(parsed.statusCode).toBeNull();
    });

    it('classifies plain object or Error with name AbortError', () => {
      const err = new Error('This operation was aborted');
      err.name = 'AbortError';
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
    });

    it('classifies TimeoutError as TEMPORARY_PROVIDER with retryAfterSeconds 30', () => {
      const err = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
      expect(parsed.statusCode).toBeNull();
    });

    it('classifies TypeError "fetch failed" as TEMPORARY_PROVIDER with retryAfterSeconds 30', () => {
      const err = new TypeError('fetch failed');
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
      expect(parsed.statusCode).toBeNull();
    });

    it.each([
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'UND_ERR_CONNECT_TIMEOUT',
    ])('classifies cause code %s as TEMPORARY_PROVIDER with retryAfterSeconds 30', (code) => {
      const err = new Error('network error', { cause: { code } });
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
      expect(parsed.statusCode).toBeNull();
    });

    it('does not classify bare message containing "aborted" without matching name/cause/status', () => {
      const err = new Error('user aborted something manually');
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TERMINAL_EXECUTION');
      expect(parsed.isUnavailableError).toBe(false);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBeNull();
    });
  });

  describe('HTTP Status Precedence & Regressions', () => {
    it('classifies HTTP 429 as TEMPORARY_PROVIDER with isQuotaError=true', () => {
      const parsed = parseProviderError({ status: 429, message: 'Too Many Requests' });

      expect(parsed.statusCode).toBe(429);
      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isQuotaError).toBe(true);
      expect(parsed.isUnavailableError).toBe(false);
    });

    it('classifies HTTP 503 as TEMPORARY_PROVIDER with isUnavailableError=true', () => {
      const parsed = parseProviderError({ status: 503, message: 'Service Unavailable' });

      expect(parsed.statusCode).toBe(503);
      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('classifies HTTP 500 as TEMPORARY_PROVIDER with isUnavailableError=true', () => {
      const parsed = parseProviderError({ status: 500, message: 'Internal Server Error' });

      expect(parsed.statusCode).toBe(500);
      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('classifies HTTP 404 as PERMANENT_PROVIDER', () => {
      const parsed = parseProviderError({ status: 404, message: 'Model Not Found' });

      expect(parsed.statusCode).toBe(404);
      expect(parsed.errorClass).toBe('PERMANENT_PROVIDER');
      expect(parsed.isUnavailableError).toBe(false);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('classifies HTTP 400 model deprecation as PERMANENT_PROVIDER', () => {
      const parsed = parseProviderError({ status: 400, message: 'The model `gemini-old` is deprecated and retired.' });

      expect(parsed.statusCode).toBe(400);
      expect(parsed.errorClass).toBe('PERMANENT_PROVIDER');
      expect(parsed.isUnavailableError).toBe(false);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('classifies HTTP 400 invalid request body as TERMINAL_EXECUTION', () => {
      const parsed = parseProviderError({ status: 400, message: 'Invalid JSON request payload.' });

      expect(parsed.statusCode).toBe(400);
      expect(parsed.errorClass).toBe('TERMINAL_EXECUTION');
      expect(parsed.isUnavailableError).toBe(false);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('preserves HTTP status classification even if name is AbortError', () => {
      const err = { status: 400, name: 'AbortError', message: 'Invalid parameter format' };
      const parsed = parseProviderError(err);

      expect(parsed.statusCode).toBe(400);
      expect(parsed.errorClass).toBe('TERMINAL_EXECUTION');
      expect(parsed.isUnavailableError).toBe(false);
    });
  });
});

describe('Provider generateStructured Timeout Helper', () => {
  const TestSchema = z.object({ role: z.string() });
  const dummyGeminiSchema = { type: 'OBJECT', properties: { role: { type: 'STRING' } } };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('GoogleGeminiProvider', () => {
    it('aborts generateContent via config.abortSignal and rejects with AbortError when timeout expires', async () => {
      const google = new GoogleGeminiProvider('dummy-key');
      (google as any).ai = {
        models: {
          generateContent: vi.fn(({ config }) => {
            return new Promise((_, reject) => {
              if (config?.abortSignal) {
                config.abortSignal.addEventListener('abort', () => {
                  reject(new DOMException('This operation was aborted', 'AbortError'));
                });
              }
            });
          })
        }
      };

      const promise = google.generateStructured('prompt', TestSchema, dummyGeminiSchema, 'gemini-3.5-flash', 'content');
      expect(vi.getTimerCount()).toBe(1);

      const assertion = expect(promise).rejects.toThrow('This operation was aborted');
      await vi.advanceTimersByTimeAsync(PROVIDER_TIMEOUT_MS);
      await assertion;

      expect(vi.getTimerCount()).toBe(0);
    });

    it('clears timeout on successful completion (timer count is 0)', async () => {
      const google = new GoogleGeminiProvider('dummy-key');
      (google as any).ai = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({ role: 'Engineer' })
          })
        }
      };

      const result = await google.generateStructured('prompt', TestSchema, dummyGeminiSchema, 'gemini-3.5-flash', 'content');
      expect(result).toEqual({ role: 'Engineer' });
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('OpenAICompatibleProvider (Groq)', () => {
    it('aborts fetch via signal and rejects with AbortError when timeout expires', async () => {
      const groq = new OpenAICompatibleProvider('dummy-key');
      const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_, reject) => {
          if (init?.signal) {
            init.signal.addEventListener('abort', () => {
              reject(new DOMException('This operation was aborted', 'AbortError'));
            });
          }
        });
      });
      global.fetch = fetchMock as any;

      const promise = groq.generateStructured('prompt', TestSchema, dummyGeminiSchema, 'groq:openai/gpt-oss-120b', 'content');
      expect(vi.getTimerCount()).toBe(1);

      const assertion = expect(promise).rejects.toThrow('This operation was aborted');
      await vi.advanceTimersByTimeAsync(PROVIDER_TIMEOUT_MS);
      await assertion;

      expect(vi.getTimerCount()).toBe(0);
    });

    it('clears timeout on successful completion (timer count is 0)', async () => {
      const groq = new OpenAICompatibleProvider('dummy-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ role: 'Engineer' }) } }]
        })
      }) as any;

      const result = await groq.generateStructured('prompt', TestSchema, dummyGeminiSchema, 'groq:openai/gpt-oss-120b', 'content');
      expect(result).toEqual({ role: 'Engineer' });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('aborts hanging body read after fetch response headers arrive and clears timer in finally', async () => {
      const groq = new OpenAICompatibleProvider('dummy-key');
      global.fetch = vi.fn((_url: string, init?: RequestInit) => {
        return Promise.resolve({
          ok: true,
          json: () => new Promise((_, reject) => {
            if (init?.signal) {
              init.signal.addEventListener('abort', () => {
                reject(new DOMException('This operation was aborted', 'AbortError'));
              });
            }
          })
        });
      }) as any;

      const promise = groq.generateStructured('prompt', TestSchema, dummyGeminiSchema, 'groq:openai/gpt-oss-120b', 'content');
      expect(vi.getTimerCount()).toBe(1);

      const assertion = expect(promise).rejects.toThrow('This operation was aborted');
      await vi.advanceTimersByTimeAsync(PROVIDER_TIMEOUT_MS);
      await assertion;

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
