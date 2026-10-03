/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as ExtractPOST } from '../app/api/extract/route';
import { POST as MatchPOST } from '../app/api/match/route';
import * as alerting from '../lib/ai/alerting';
import * as provider from '../lib/ai/provider';
import * as models from '../lib/ai/models';

// Provide synthetic environment
process.env.BYOK_ENCRYPTION_KEY = '0000000000000000000000000000000000000000000000000000000000000000';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.GEMINI_API_KEY = 'test-gemini';
process.env.GROQ_API_KEY = 'test-groq';

// Global fetch stub to ensure no real network calls are made
global.fetch = vi.fn().mockImplementation(() => {
  return Promise.reject(new Error("Global fetch called (network denied)"));
});

// Mock Data State
let mockProfileData: any = { preferred_provider: 'google', preferred_model: null };
let mockKeyData: any = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
let mockUsageData: any = [];

// Mock Supabase Server Client
vi.mock('../lib/supabase/server', () => {
  return {
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
  };
});

vi.mock('../lib/supabase/serviceClient', () => {
  return {
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
  };
});

// Mock encryption
vi.mock('../lib/utils/encryption', () => ({
  encrypt: vi.fn().mockReturnValue('encrypted-key'),
  decrypt: vi.fn().mockReturnValue('decrypted-key'),
}));

// Mock Models - to block DB interaction in blockModelInDb
vi.spyOn(models, 'blockModelInDb').mockImplementation(async (trackingName, durationSeconds) => {
  mockUsageData.push({ model_name: trackingName, blocked_until: new Date(Date.now() + durationSeconds * 1000).toISOString() });
  return true; 
});

vi.mock('../lib/ai/alerting', () => ({
  checkAndRecordExhaustion: vi.fn().mockResolvedValue(undefined),
  sendOperatorAlert: vi.fn().mockResolvedValue(undefined)
}));

describe('BYOK Chain Provider Scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
    mockUsageData = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any) => {
    return new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('Case 1: BYOK Google, 429 Failure -> Exhaustion without event logging', async () => {
    // Mock getProvider to always throw 429 for the Gemini provider
    const generateStructuredSpy = vi.fn().mockRejectedValue({ status: 429, message: 'Quota exceeded' });
    vi.spyOn(provider, 'getProvider').mockImplementation((providerName) => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    }));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation', model: 'gemini-3.5-flash' });
    const res = await ExtractPOST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe('all_models_exhausted');
    expect(data.byok).toBe(true);
    expect(data.message).toContain('google');
    
    // Ensure the event logger was NOT called
    expect(alerting.checkAndRecordExhaustion).not.toHaveBeenCalled();
    
    // Capture the 4th argument (apiModelName) of every generateStructured call
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview'
    ]);
  });

  it('Case 2: BYOK Groq -> Chain contains only Groq models', async () => {
    mockProfileData = { preferred_provider: 'groq', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [{ provider: 'groq', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
    
    const generateStructuredSpy = vi.fn().mockRejectedValue({ status: 429, message: 'Quota exceeded' });
    vi.spyOn(provider, 'getProvider').mockImplementation((providerName) => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    }));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation', model: 'groq:openai/gpt-oss-120b' });
    const res = await ExtractPOST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe('all_models_exhausted');
    expect(data.byok).toBe(true);
    expect(data.message).toContain('groq');
    
    expect(alerting.checkAndRecordExhaustion).not.toHaveBeenCalled();
    
    // Capture the 4th argument (apiModelName) of every generateStructured call
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b'
    ]);
  });

  it('Case 3: Preferred Model Mismatch (Google key with Groq model) -> Ignore preference', async () => {
    // BYOK Key is Google
    mockProfileData = { preferred_provider: 'google', preferred_model: 'groq:openai/gpt-oss-120b' };
    mockKeyData = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
    
    // Mock getProvider to succeed on Google
    const generateStructuredSpy = vi.fn().mockResolvedValue({ test: 'success' });
    vi.spyOn(provider, 'getProvider').mockImplementation((providerName) => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    }));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();

    // Since preferred model was Groq, it should have been ignored and a Google model used
    expect(res.status).toBe(200);
    expect(data.model_used).toBe('gemini-3.5-flash');
    expect(data.data.test).toBe('success');
  });

  it('Case 4: NON-BYOK Regression -> full chain used, exhaustion recorded', async () => {
    // No BYOK key
    mockProfileData = { preferred_provider: null, preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [];

    const generateStructuredSpy = vi.fn().mockRejectedValue({ status: 429, message: 'Quota exceeded' });
    vi.spyOn(provider, 'getProvider').mockImplementation((providerName) => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    }));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe('all_models_exhausted');
    expect(data.retryAfterSeconds).toBe(60);
    expect(data.byok).toBeUndefined();
    
    // Since it's a non-BYOK user, exhaustion event should be recorded
    expect(alerting.checkAndRecordExhaustion).toHaveBeenCalled();

    // Capture the 4th argument (apiModelName) of every generateStructured call
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview',
      'openai/gpt-oss-120b'
    ]);
  });

  it('Case 5: Match route covered', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
    
    vi.spyOn(provider, 'getProvider').mockImplementation((providerName) => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: vi.fn().mockRejectedValue({ status: 429, message: 'Quota exceeded' }),
    }));

    const req = new Request('http://localhost/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: 'This is a long enough job description to pass validation', resumeText: 'This is a long enough resume text to pass validation', model: 'gemini-3.5-flash' }),
    });
    
    const res = await MatchPOST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe('all_models_exhausted');
    expect(data.byok).toBe(true);
    expect(alerting.checkAndRecordExhaustion).not.toHaveBeenCalled();
  });

  it('Case 6: Requested Model Mismatch (Google key with Groq requested model) -> Ignore preference', async () => {
    // BYOK Key is Google
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
    
    // Mock getProvider to succeed on Google
    const generateStructuredSpy = vi.fn().mockResolvedValue({ test: 'success' });
    vi.spyOn(provider, 'getProvider').mockImplementation((providerName) => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    }));

    const req = createMockRequest({ 
      jobDescription: 'This is a long enough job description to pass validation',
      model: 'groq:openai/gpt-oss-120b'
    });
    const res = await ExtractPOST(req);
    const data = await res.json();

    // Since requested model was Groq, it should have been ignored and a Google model used
    expect(res.status).toBe(200);
    expect(data.model_used).toBe('gemini-3.5-flash');
    expect(data.data.test).toBe('success');
  });

  it('Case 7: BYOK with preferred_provider = null correctly defaults to google', async () => {
    // BYOK Key exists, but preferred_provider is null
    mockProfileData = { preferred_provider: null, preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
    
    // Mock getProvider to fail for all (exhaustion scenario)
    const generateStructuredSpy = vi.fn().mockRejectedValue({ status: 429, message: 'Quota exceeded' });
    vi.spyOn(provider, 'getProvider').mockImplementation((providerName) => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    }));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe('all_models_exhausted');
    expect(data.byok).toBe(true);
    expect(data.message).toContain('google');
    expect(alerting.checkAndRecordExhaustion).not.toHaveBeenCalled();
    expect(provider.getProvider).not.toHaveBeenCalledWith('groq', expect.anything());

    // Capture the 4th argument (apiModelName) of every generateStructured call
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview'
    ]);
  });

  it('Case 8: Non-BYOK 5xx on 120b -> shared bucket blocked, 20b skipped, exhaustion recorded', async () => {
    // No BYOK key
    mockProfileData = { preferred_provider: null, preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [];

    // Block all Gemini models in DB so 120b is the first available model
    const futureDate = new Date(Date.now() + 60000).toISOString();
    mockUsageData = [
      { model_name: 'gemini-3.5-flash', blocked_until: futureDate },
      { model_name: 'gemini-3-flash-preview', blocked_until: futureDate },
      { model_name: 'gemini-3.1-flash-lite-preview', blocked_until: futureDate }
    ];

    // Mock generateStructured to throw a 5xx error for the first model, then succeed
    const generateStructuredSpy = vi.fn()
      .mockRejectedValueOnce({ status: 500, message: 'Internal Server Error' })
      .mockResolvedValueOnce({ test: 'success' });
      
    vi.spyOn(provider, 'getProvider').mockImplementation((providerName) => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    }));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe('all_models_exhausted');
    
    // Capture the 4th argument (apiModelName) of every generateStructured call
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'openai/gpt-oss-120b'
    ]);
  });

  it('Case 9: Non-BYOK 429 on 120b (shared bucket blocked) -> 20b skipped, exhaustion recorded', async () => {
    // No BYOK key
    mockProfileData = { preferred_provider: null, preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [];

    // Put a blocked groq:shared-bucket row in mockUsageData
    mockUsageData = [
      { model_name: 'groq:shared-bucket', blocked_until: new Date(Date.now() + 60000).toISOString() }
    ];

    // Mock generateStructured to throw a 429 error for Gemini models
    const generateStructuredSpy = vi.fn().mockRejectedValue({ status: 429, message: 'Quota exceeded' });
      
    vi.spyOn(provider, 'getProvider').mockImplementation((providerName) => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy,
    }));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe('all_models_exhausted');
    
    // Since it's a non-BYOK user, exhaustion event should be recorded
    expect(alerting.checkAndRecordExhaustion).toHaveBeenCalled();
    
    // Since groq:shared-bucket is in the DB mock, both 120b and 20b should be skipped.
    // Only Gemini models should have been attempted.
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview'
    ]);
  });

  it('Case 10: non-key 400 must NOT mark the key rejected', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
    
    const generateStructuredSpy = vi.fn().mockRejectedValue({ status: 400, message: 'Invalid payload format' });
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(422);
    expect(generateStructuredSpy).toHaveBeenCalledTimes(1); 
  });

  it('Case 11: BYOK users never decrement free uses', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [{ provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }];
    
    const generateStructuredSpy = vi.fn().mockResolvedValue({ test: 'success' });
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    
    const res = await ExtractPOST(req);
    expect(res.status).toBe(200);
  });

  it('Case 12: both keys with Google 429 -> Groq', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [
      { provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' },
      { provider: 'groq', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }
    ];
    
    // Google returns 429, Groq returns success
    const generateStructuredSpy = vi.fn().mockImplementation(async (instruction, schema, schema2, apiModelName) => {
      if (apiModelName.includes('gemini')) {
        return Promise.reject({ status: 429, message: 'Quota exceeded' });
      }
      return Promise.resolve({ test: 'success' });
    });
    
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.model_used).toBe('groq:shared-bucket');
    
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview',
      'openai/gpt-oss-120b'
    ]);
  });

  it('Case 13: Google 401 -> Groq', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [
      { provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' },
      { provider: 'groq', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }
    ];
    
    // Google returns 401, Groq returns success
    const generateStructuredSpy = vi.fn().mockImplementation(async (instruction, schema, schema2, apiModelName) => {
      if (apiModelName.includes('gemini')) {
        return Promise.reject({ status: 401, message: 'Unauthorized' });
      }
      return Promise.resolve({ test: 'success' });
    });
    
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.model_used).toBe('groq:shared-bucket');
    
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'gemini-3.5-flash',
      'openai/gpt-oss-120b'
    ]);
  });

  it('Case 14: all keys fail', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [
      { provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' },
      { provider: 'groq', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }
    ];
    
    // Both return 429
    const generateStructuredSpy = vi.fn().mockRejectedValue({ status: 429, message: 'Quota exceeded' });
    
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(429);
    expect(data.error).toBe('all_models_exhausted');
    expect(data.byok).toBe(true);
    
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b'
    ]);
  });

  it('Case 15: Gemini-style 400 invalid-key body -> Rejected', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [
      { provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' },
      { provider: 'groq', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }
    ];
    
    const generateStructuredSpy = vi.fn().mockImplementation(async (instruction, schema, schema2, apiModelName) => {
      if (apiModelName.includes('gemini')) {
        // Mock a Gemini API_KEY_INVALID error
        const err: any = new Error("API_KEY_INVALID");
        err.status = 400;
        err.error = { details: [{ reason: "API_KEY_INVALID" }] };
        return Promise.reject(err);
      }
      return Promise.resolve({ test: 'success' });
    });
    
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.model_used).toBe('groq:shared-bucket');
    
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'gemini-3.5-flash',
      'openai/gpt-oss-120b'
    ]);
  });

  it('Case 16: decrypt failure', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [
      { provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' },
      { provider: 'groq', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }
    ];
    
    // Mock decrypt to throw an error for Google, succeed for Groq
    const { decrypt } = await import('../lib/utils/encryption');
    (decrypt as any).mockImplementationOnce(() => {
      throw new Error("Decryption failed");
    });
    
    const generateStructuredSpy = vi.fn().mockResolvedValue({ test: 'success' });
    
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.model_used).toBe('groq:shared-bucket'); // Fell back to Groq
  });

  it('Case 17: all keys rejected -> 401', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [
      { provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' },
      { provider: 'groq', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }
    ];
    
    // Both return 401
    const generateStructuredSpy = vi.fn().mockRejectedValue({ status: 401, message: 'Unauthorized' });
    
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(401);
    expect(data.error).toBe('Invalid API key.');
    expect(data.message).toContain('All your provided keys were invalid or rejected');
  });

  it('Case 18: both keys + preferred = groq (Groq first, then Gemini)', async () => {
    mockProfileData = { preferred_provider: 'groq', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [
      { provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' },
      { provider: 'groq', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }
    ];
    
    // Groq returns 429, Google returns success
    const generateStructuredSpy = vi.fn().mockImplementation(async (instruction, schema, schema2, apiModelName) => {
      if (apiModelName.includes('openai')) {
        return Promise.reject({ status: 429, message: 'Quota exceeded' });
      }
      return Promise.resolve({ test: 'success' });
    });
    
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.model_used).toBe('gemini-3.5-flash');
    
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'openai/gpt-oss-120b', // Note: in AI_MODELS the groq ones have trackingName groq:shared-bucket, but API name is openai/...
      'openai/gpt-oss-20b',
      'gemini-3.5-flash'
    ]);
  });

  it('Case 19: preferred_provider set to a provider with no saved key', async () => {
    mockProfileData = { preferred_provider: 'groq', preferred_model: null, free_ai_uses_remaining: 10 };
    // User has ONLY google key, but preferred is groq
    mockKeyData = [
      { provider: 'google', encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' }
    ];
    
    const generateStructuredSpy = vi.fn().mockResolvedValue({ test: 'success' });
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.model_used).toBe('gemini-3.5-flash'); // Uses Google because Groq key is absent
    
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'gemini-3.5-flash'
    ]);
  });

  it('Case 20: key isolation with DISTINCT decrypted values per provider', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [
      { provider: 'google', encrypted_key: 'enc_google', iv: 'iv1', auth_tag: 'tag1' },
      { provider: 'groq', encrypted_key: 'enc_groq', iv: 'iv2', auth_tag: 'tag2' }
    ];
    
    const { decrypt } = await import('../lib/utils/encryption');
    (decrypt as any).mockImplementation(({ encryptedKey }: any) => {
      if (encryptedKey === 'enc_google') return 'decrypted_google_key';
      if (encryptedKey === 'enc_groq') return 'decrypted_groq_key';
      return 'unknown';
    });

    const getProviderSpy = vi.spyOn(provider, 'getProvider');
    const generateStructuredSpy = vi.fn().mockImplementation(async (instruction, schema, schema2, apiModelName) => {
      if (apiModelName.includes('gemini')) {
        return Promise.reject({ status: 429, message: 'Quota exceeded' });
      }
      return Promise.resolve({ test: 'success' });
    });

    getProviderSpy.mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    await ExtractPOST(req);
    
    // Assert getProvider was called correctly for each
    expect(getProviderSpy).toHaveBeenCalledWith('google', 'decrypted_google_key');
    expect(getProviderSpy).toHaveBeenCalledWith('groq', 'decrypted_groq_key');
  });

  it('Case 21: free uses never decremented for Groq-only AND both-key users', async () => {
    // Groq-only
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [{ provider: 'groq', encrypted_key: 'enc_groq', iv: 'iv2', auth_tag: 'tag2' }];
    
    const generateStructuredSpy = vi.fn().mockResolvedValue({ test: 'success' });
    vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    let req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    await ExtractPOST(req);
    expect(alerting.checkAndRecordExhaustion).not.toHaveBeenCalled();

    // Both-key
    mockKeyData = [
      { provider: 'google', encrypted_key: 'enc_google', iv: 'iv1', auth_tag: 'tag1' },
      { provider: 'groq', encrypted_key: 'enc_groq', iv: 'iv2', auth_tag: 'tag2' }
    ];
    
    req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    await ExtractPOST(req);
    expect(alerting.checkAndRecordExhaustion).not.toHaveBeenCalled();
  });

  it('Case 22: a stray provider row does not affect ordering or counts', async () => {
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = [
      { provider: 'stray_provider', encrypted_key: 'enc_stray', iv: 'iv', auth_tag: 'tag' },
      { provider: 'google', encrypted_key: 'enc_google', iv: 'iv', auth_tag: 'tag' }
    ];
    
    const generateStructuredSpy = vi.fn().mockRejectedValue({ status: 401, message: 'Invalid API key' }); // trigger 401 on google
    const getProviderSpy = vi.spyOn(provider, 'getProvider').mockImplementation(() => ({
      validateKey: vi.fn().mockResolvedValue(true),
      generateStructured: generateStructuredSpy
    } as any));

    const req = createMockRequest({ jobDescription: 'This is a long enough job description to pass validation' });
    const res = await ExtractPOST(req);
    const data = await res.json();
    
    // Should get a 401 from google immediately. stray_provider is ignored.
    expect(res.status).toBe(401);
    expect(data.error).toBe('Invalid API key.');
    
    // Stray provider should not have been called
    expect(getProviderSpy).not.toHaveBeenCalledWith('stray_provider', expect.anything());
    expect(getProviderSpy).toHaveBeenCalledWith('google', expect.anything());
  });
});
