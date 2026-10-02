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
let mockKeyData: any = { encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' };
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
          if (table === 'user_api_keys') return Promise.resolve({ data: mockKeyData, error: null });
          if (table === 'users') return Promise.resolve({ data: { free_ai_uses_remaining: 10, has_accepted_terms: true }, error: null });
          return Promise.resolve({ data: null, error: null });
        });
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
vi.spyOn(models, 'blockModelInDb').mockImplementation(async (trackingName) => { mockUsageData.push({ model_name: trackingName, blocked_until: new Date(Date.now() + 60000).toISOString() }); return true; });

vi.mock('../lib/ai/alerting', () => ({
  checkAndRecordExhaustion: vi.fn().mockResolvedValue(undefined),
  sendOperatorAlert: vi.fn().mockResolvedValue(undefined)
}));

describe('BYOK Chain Provider Scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockProfileData = { preferred_provider: 'google', preferred_model: null, free_ai_uses_remaining: 10 };
    mockKeyData = { encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' };
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
    mockKeyData = { encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' };
    
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
    mockKeyData = { encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' };
    
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
    mockKeyData = null;

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
    mockKeyData = { encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' };
    
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
    mockKeyData = { encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' };
    
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
    mockKeyData = { encrypted_key: 'encrypted', iv: 'iv', auth_tag: 'tag' };
    
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

  it('Case 8: Non-BYOK 5xx on 120b -> does not block shared bucket', async () => {
    // No BYOK key
    mockProfileData = { preferred_provider: null, preferred_model: 'groq:openai/gpt-oss-120b', free_ai_uses_remaining: 10 };
    mockKeyData = null;

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

    expect(res.status).toBe(200);
    expect(data.model_used).toBe('gemini-3.5-flash'); // Next in fallback after 120b is gemini-3.5
    
    // Capture the 4th argument (apiModelName) of every generateStructured call
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'openai/gpt-oss-120b',
      'gemini-3.5-flash'
    ]);
  });

  it('Case 9: Non-BYOK 429 on 120b (shared bucket blocked) -> 20b skipped, exhaustion recorded', async () => {
    // No BYOK key
    mockProfileData = { preferred_provider: null, preferred_model: 'groq:openai/gpt-oss-120b', free_ai_uses_remaining: 10 };
    mockKeyData = null;

    // Mock generateStructured to throw a 429 error for the first model
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
    
    // 120b was tried. Because it threw 429, 'groq:shared-bucket' is added to excluded models.
    // The getAvailableModel function will skip 20b (because it has the same tracking name) 
    // and fall back to Google models. Wait, the order of models is dependent on preferred_model.
    // Let's just assert the exact sequence.
    const calledModels = generateStructuredSpy.mock.calls.map(call => call[3]);
    expect(calledModels).toEqual([
      'openai/gpt-oss-120b',
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview'
    ]);
  });
});
