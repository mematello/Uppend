import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveApiKey, deleteApiKey, updatePreferredProvider } from '../app/(protected)/settings/actions';
import { getProvider, ProviderUnavailableError, ProviderConfigError } from '../lib/ai/provider';
import * as serverDb from '../lib/supabase/server';
import { encrypt } from '../lib/utils/encryption';
import { revalidatePath } from 'next/cache';

vi.mock('../lib/supabase/server');
vi.mock('../lib/ai/provider');
vi.mock('../lib/utils/encryption');
vi.mock('next/cache');

describe('Settings Actions', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user123' } }, error: null }) },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    
    (serverDb.createClient as any).mockResolvedValue(mockSupabase);
    (encrypt as any).mockReturnValue({ encryptedKey: 'enc', iv: 'iv', authTag: 'tag' });
  });

  describe('updatePreferredProvider', () => {
    it('returns error on invalid provider', async () => {
      const result = await updatePreferredProvider('invalid_provider');
      expect(result.error).toBe('Invalid input.');
    });

    it('returns error if user has no key for provider', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null }); // no key
      const result = await updatePreferredProvider('google');
      expect(result.error).toBe('You must save an API key for this provider first.');
    });

    it('updates preferred_model if prefix does not match new provider', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: { provider: 'groq' } }) // key exists
        .mockResolvedValueOnce({ data: { preferred_model: 'gemini-3.5-flash' } }); // current profile

      mockSupabase.update.mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ error: null }) });

      const result = await updatePreferredProvider('groq');
      
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        preferred_provider: 'groq',
        preferred_model: 'groq:openai/gpt-oss-120b'
      }));
    });
  });

  describe('saveApiKey', () => {
    it('returns error on invalid input', async () => {
      expect((await saveApiKey('invalid', 'key')).error).toBe('Invalid input.');
      expect((await saveApiKey('google', '   ')).error).toBe('Invalid input.');
    });

    it('returns fixed string on ProviderUnavailableError', async () => {
      const mockProviderInstance = {
        validateKey: vi.fn().mockRejectedValue(new ProviderUnavailableError())
      };
      (getProvider as any).mockReturnValue(mockProviderInstance);

      const result = await saveApiKey('google', 'valid-key');
      expect(result.error).toBe('Provider is currently unavailable or rate-limited. Please try again later.');
    });

    it('returns fixed string on ProviderConfigError', async () => {
      const mockProviderInstance = {
        validateKey: vi.fn().mockRejectedValue(new ProviderConfigError())
      };
      (getProvider as any).mockReturnValue(mockProviderInstance);

      const result = await saveApiKey('google', 'valid-key');
      expect(result.error).toBe('Provider rejected the request configuration.');
    });

    it('saves key on successful validation', async () => {
      const mockProviderInstance = {
        validateKey: vi.fn().mockResolvedValue(true)
      };
      (getProvider as any).mockReturnValue(mockProviderInstance);
      mockSupabase.upsert.mockResolvedValue({ error: null });

      const result = await saveApiKey('google', 'valid-key');
      expect(result.success).toBe(true);
      expect(mockSupabase.upsert).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/settings');
    });
  });

  describe('deleteApiKey', () => {
    it('returns error on invalid provider', async () => {
      const result = await deleteApiKey('invalid');
      expect(result.error).toBe('Invalid input.');
    });

    it('returns error if profile read fails', async () => {
      mockSupabase.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'some-error', message: 'Read failed' } 
      });
      const result = await deleteApiKey('groq');
      expect(result.error).toBe('Failed to read profile data');
      expect(mockSupabase.update).not.toHaveBeenCalled();
      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });

    it('resets profile if provider matches preferred_provider and preferred_model', async () => {
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { preferred_provider: 'groq', preferred_model: 'groq:openai/gpt-oss-120b' } 
      });
      mockSupabase.update.mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ error: null }) });
      mockSupabase.delete.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) });

      const result = await deleteApiKey('groq');
      
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        preferred_provider: null,
        preferred_model: null
      }));
      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });
});
