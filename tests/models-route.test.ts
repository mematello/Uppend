import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../app/api/models/route';
import { NextResponse } from 'next/server';

vi.mock('../lib/supabase/server', () => {
  return {
    createClient: () => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table) => {
        const chain: any = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: any) => {
          if (table === 'user_api_keys') {
            return resolve({ data: globalThis.__mockKeysData || [], error: null });
          }
          return resolve({ data: null, error: null });
        };
        return chain;
      }),
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
          if (table === 'profiles') return Promise.resolve({ data: globalThis.__mockProfileData || {}, error: null });
          return Promise.resolve({ data: null, error: null });
        });
        chain.then = (resolve: any) => resolve({ data: [], error: null });
        return chain;
      }),
    })
  };
});

declare global {
  var __mockKeysData: any[];
  var __mockProfileData: any;
}

describe('Models Route GET', () => {
  beforeEach(() => {
    globalThis.__mockKeysData = [];
    globalThis.__mockProfileData = {};
  });

  it('No-key user: byokProviders empty, no Groq models, keeps preferredModel', async () => {
    globalThis.__mockKeysData = [];
    globalThis.__mockProfileData = { preferred_model: 'gemini-3-flash-preview' };

    const res = await GET() as NextResponse;
    const json = await res.json();

    expect(json.byokProviders).toEqual([]);
    expect(json.preferredModel).toBe('gemini-3-flash-preview');
    expect(json.data.length).toBeGreaterThan(0);
    // Should not contain any groq models because they have userSelectable: false
    const groqModels = json.data.filter((m: any) => m.name.startsWith('groq:'));
    expect(groqModels.length).toBe(0);
  });

  it('Google-only BYOK: byokProviders=[google], sees only google models', async () => {
    globalThis.__mockKeysData = [{ provider: 'google' }];
    globalThis.__mockProfileData = { preferred_model: 'gemini-3.5-flash' };

    const res = await GET() as NextResponse;
    const json = await res.json();

    expect(json.byokProviders).toEqual(['google']);
    expect(json.preferredModel).toBe('gemini-3.5-flash');
    expect(json.data.every((m: any) => !m.name.startsWith('groq:'))).toBe(true);
  });

  it('Groq-only BYOK: byokProviders=[groq], sees Groq models (even userSelectable:false)', async () => {
    globalThis.__mockKeysData = [{ provider: 'groq' }];
    globalThis.__mockProfileData = { preferred_model: 'groq:openai/gpt-oss-120b' };

    const res = await GET() as NextResponse;
    const json = await res.json();

    expect(json.byokProviders).toEqual(['groq']);
    expect(json.preferredModel).toBe('groq:openai/gpt-oss-120b');
    // Ensure groq models are present despite being userSelectable: false normally
    expect(json.data.some((m: any) => m.name.startsWith('groq:'))).toBe(true);
    // Ensure NO google models are present
    expect(json.data.every((m: any) => m.name.startsWith('groq:'))).toBe(true);
  });

  it('Both-key BYOK: byokProviders=[google, groq], sees both providers', async () => {
    globalThis.__mockKeysData = [{ provider: 'google' }, { provider: 'groq' }];
    globalThis.__mockProfileData = { preferred_model: 'groq:openai/gpt-oss-20b' };

    const res = await GET() as NextResponse;
    const json = await res.json();

    expect(json.byokProviders).toContain('google');
    expect(json.byokProviders).toContain('groq');
    expect(json.data.some((m: any) => m.name.startsWith('groq:'))).toBe(true);
    expect(json.data.some((m: any) => m.name.includes('gemini'))).toBe(true);
  });

  it('Stray provider row is ignored', async () => {
    globalThis.__mockKeysData = [{ provider: 'google' }, { provider: 'stray_provider' }];
    globalThis.__mockProfileData = { preferred_model: 'gemini-3.5-flash' };

    const res = await GET() as NextResponse;
    const json = await res.json();

    expect(json.byokProviders).toEqual(['google']);
    expect(json.data.every((m: any) => !m.name.startsWith('groq:'))).toBe(true);
  });

  it('Fallback preferredModel when stored model is not allowed', async () => {
    // User has only google key, but their stored preferred_model is groq
    globalThis.__mockKeysData = [{ provider: 'google' }];
    globalThis.__mockProfileData = { preferred_model: 'groq:openai/gpt-oss-120b' };

    const res = await GET() as NextResponse;
    const json = await res.json();

    expect(json.byokProviders).toEqual(['google']);
    // Should fallback to the first allowed model (which will be a google model)
    expect(json.preferredModel).not.toBe('groq:openai/gpt-oss-120b');
    expect(json.preferredModel).toBe(json.data[0].name);
  });
});
