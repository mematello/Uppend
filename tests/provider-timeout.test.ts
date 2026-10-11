/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseProviderError } from '../lib/ai/models';
import { z } from 'zod';
import { GoogleGeminiProvider, OpenAICompatibleProvider, PROVIDER_TIMEOUT_MS } from '../lib/ai/provider';
import * as provider from '../lib/ai/provider';
import * as models from '../lib/ai/models';
import * as alerting from '../lib/ai/alerting';
import { POST as ExtractPOST } from '../app/api/extract/route';
import { POST as MatchPOST } from '../app/api/match/route';

// Synthetic environment for route tests
process.env.BYOK_ENCRYPTION_KEY = '0000000000000000000000000000000000000000000000000000000000000000';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.GEMINI_API_KEY = 'test-gemini';
process.env.GROQ_API_KEY = 'test-groq';

// Mock Data State for route harness
let mockProfileData: any = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
let mockKeyData: any = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
let mockUsageData: any = [];

vi.mock('../lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation((table) => {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockImplementation(() => {
        if (table === 'profiles') return Promise.resolve({ data: mockProfileData, error: null });
        if (table === 'users') return Promise.resolve({ data: { free_ai_uses_remaining: 10, has_accepted_terms: true }, error: null });
        return Promise.resolve({ data: null, error: null });
      });
      chain.then = (resolve: any) => {
        if (table === 'user_api_keys') return resolve({ data: mockKeyData, error: null });
        return resolve({ data: null, error: null });
      };
      return chain;
    }),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  })
}));

vi.mock('../lib/supabase/serviceClient', () => ({
  createServiceClient: () => ({
    from: vi.fn().mockImplementation((table) => {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockImplementation(() => {
        if (table === 'profiles') return Promise.resolve({ data: mockProfileData, error: null });
        return Promise.resolve({ data: null, error: null });
      });
      chain.then = (resolve: any) => resolve({ data: mockUsageData, error: null });
      return chain;
    }),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  })
}));

vi.mock('../lib/utils/encryption', () => ({
  encrypt: vi.fn().mockReturnValue('encrypted-key'),
  decrypt: vi.fn().mockReturnValue('decrypted-key'),
}));

vi.mock('../lib/ai/alerting', () => ({
  checkAndRecordExhaustion: vi.fn().mockResolvedValue(undefined),
  sendOperatorAlert: vi.fn().mockResolvedValue(undefined)
}));

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

describe('Route Fallback on Timeout (/api/extract and /api/match)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
    mockUsageData = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('/api/extract calls first model exactly once with attempt 1 on timeout and falls back to next model', async () => {
    const timeoutErr = new DOMException('This operation was aborted', 'AbortError');
    const validExtraction = {
      role: 'Full Stack Engineer',
      company: 'TechCorp',
      extraction_confidence: { role: 'high' }
    };

    const generateStructuredSpy = vi.fn()
      .mockRejectedValueOnce(timeoutErr)
      .mockResolvedValueOnce(validExtraction);

    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    } as any));

    const req = new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: 'This is a long enough job description to pass validation requirements'
      })
    });

    const res = await ExtractPOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.model_used).toBe('gemini-3-flash-preview');

    const calls = generateStructuredSpy.mock.calls;
    expect(calls).toHaveLength(2);

    // Assert model 1 (gemini-3.5-flash) was called exactly once
    const model1Calls = calls.filter(call => call[3] === 'gemini-3.5-flash');
    expect(model1Calls).toHaveLength(1);

    // Assert attempt 1 system instruction was used (not attempt 2)
    expect(model1Calls[0][0]).toContain('Extract the job details from the provided job description');

    // Assert attempt 2 was NOT called for model 1
    const attempt2Calls = calls.filter(call => call[0].includes('Extract the following exact fields: company_name'));
    expect(attempt2Calls).toHaveLength(0);

    // Assert call 2 fell back to next model
    expect(calls[1][3]).toBe('gemini-3-flash-preview');
  });

  it('/api/match falls back to the next model upon timeout', async () => {
    const timeoutErr = new DOMException('This operation was aborted', 'AbortError');
    const validMatch = {
      match_score: 88,
      fit_summary: 'Strong fit for the role.'
    };

    const generateStructuredSpy = vi.fn()
      .mockRejectedValueOnce(timeoutErr)
      .mockResolvedValueOnce(validMatch);

    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    } as any));

    const req = new Request('http://localhost/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: 'This is a long enough job description to pass validation requirements',
        resumeText: 'This is a long enough resume text to pass validation requirements'
      })
    });

    const res = await MatchPOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.model_used).toBe('gemini-3-flash-preview');

    const calls = generateStructuredSpy.mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][3]).toBe('gemini-3.5-flash');
    expect(calls[1][3]).toBe('gemini-3-flash-preview');
  });
});
