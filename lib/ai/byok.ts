import { SupabaseClient } from '@supabase/supabase-js';

export interface EncryptedKey {
  encrypted_key: string;
  iv: string;
  auth_tag: string;
}

export interface ByokState {
  hasCustomKey: boolean;
  keysByProvider: Record<string, EncryptedKey>;
  orderedProviders: string[];
  freeAiUses: number;
}

export async function resolveByokState(supabase: SupabaseClient, userId: string): Promise<ByokState> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_provider, free_ai_uses_remaining')
    .eq('id', userId)
    .single();

  const preferredProvider = profile?.preferred_provider || null;
  const freeAiUses = profile?.free_ai_uses_remaining ?? 0;

  const { data: keysData } = await supabase
    .from('user_api_keys')
    .select('provider, encrypted_key, iv, auth_tag')
    .eq('user_id', userId);

  const keysByProvider: Record<string, EncryptedKey> = {};
  if (keysData) {
    for (const row of keysData) {
      keysByProvider[row.provider] = {
        encrypted_key: row.encrypted_key,
        iv: row.iv,
        auth_tag: row.auth_tag
      };
    }
  }

  const hasCustomKey = Object.keys(keysByProvider).length > 0;
  
  const orderedProviders: string[] = [];
  if (hasCustomKey) {
    const availableProviders = Object.keys(keysByProvider);
    if (preferredProvider && availableProviders.includes(preferredProvider)) {
      orderedProviders.push(preferredProvider);
    } else if (!preferredProvider && availableProviders.includes('google')) {
      orderedProviders.push('google');
    }
    
    for (const provider of availableProviders) {
      if (!orderedProviders.includes(provider)) {
        orderedProviders.push(provider);
      }
    }
  }

  return {
    hasCustomKey,
    keysByProvider,
    orderedProviders,
    freeAiUses
  };
}
