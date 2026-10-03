import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    const allowlist = ['google', 'groq'];
    const activeProviders = allowlist.filter(p => !!keysByProvider[p]);
    
    if (preferredProvider && activeProviders.includes(preferredProvider)) {
      orderedProviders.push(preferredProvider);
    }
    
    for (const provider of activeProviders) {
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

export function buildExhaustionResponse(
  hasCustomKey: boolean,
  byokState: ByokState | null,
  providerFailures: Record<string, string>,
  retryAfterSeconds: number | undefined,
  isUnavailableError: boolean = false
) {
  if (hasCustomKey && byokState) {
    let allRejected = true;
    const details: string[] = [];
    
    for (const p of byokState.orderedProviders) {
      const status = providerFailures[p] || 'not tried';
      details.push(`${p} (${status})`);
      if (status !== 'rejected') {
        allRejected = false;
      }
    }

    if (allRejected && byokState.orderedProviders.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid API key.', 
        message: `All your provided keys were invalid or rejected. ${details.join(', ')}`, 
        byok: true 
      }, { status: 401 });
    }

    return NextResponse.json({
      error: 'all_models_exhausted',
      byok: true,
      message: `Your models are exhausted or blocked: ${details.join(', ')}`,
      partialData: null
    }, { status: 429 });
  }

  if (isUnavailableError) {
    return NextResponse.json({
      error: 'service_unavailable',
      retryAfterSeconds: retryAfterSeconds || 60,
      message: 'The AI service is temporarily unavailable. Please try again later.'
    }, { status: 503 });
  }

  return NextResponse.json({
    error: 'all_models_exhausted',
    retryAfterSeconds: retryAfterSeconds || 60
  }, { status: 429 });
}
