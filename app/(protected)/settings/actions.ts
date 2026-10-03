"use server";

import { createClient } from '../../../lib/supabase/server';
import { getProvider, ProviderUnavailableError, ProviderConfigError } from '../../../lib/ai/provider';
import { encrypt } from '../../../lib/utils/encryption';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PROVIDER_DEFAULT_MODELS, getProviderFromModel } from '../../../lib/ai/providers';

const ProviderSchema = z.enum(['google', 'groq']);
const KeySchema = z.string().trim().min(1).max(255);

export async function updatePreferredProvider(provider: string) {
  const parsedProvider = ProviderSchema.safeParse(provider);
  if (!parsedProvider.success) {
    return { error: 'Invalid input.' };
  }
  const cleanProvider = parsedProvider.data;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { error: 'Unauthorized' };
  }

  const { data: keyData } = await supabase
    .from('user_api_keys')
    .select('provider')
    .eq('user_id', user.id)
    .eq('provider', cleanProvider)
    .single();

  if (!keyData) {
    return { error: 'You must save an API key for this provider first.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_model')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = { preferred_provider: cleanProvider };
  if (profile && getProviderFromModel(profile.preferred_model || '') !== cleanProvider) {
    updates.preferred_model = PROVIDER_DEFAULT_MODELS[cleanProvider];
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error("Error updating preferred provider:", error);
    return { error: 'Failed to update preferred provider' };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function saveApiKey(provider: string, rawKey: string) {
  const parsedProvider = ProviderSchema.safeParse(provider);
  const parsedKey = KeySchema.safeParse(rawKey);

  if (!parsedProvider.success || !parsedKey.success) {
    return { error: 'Invalid input.' };
  }

  const cleanProvider = parsedProvider.data;
  const cleanKey = parsedKey.data;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { error: 'Unauthorized' };
  }

  const providerInstance = getProvider(cleanProvider, cleanKey);

  let isValid = false;
  try {
    isValid = await providerInstance.validateKey(cleanKey);
  } catch (err: unknown) {
    if (err instanceof ProviderConfigError) {
      return { error: 'Provider rejected the request configuration.' };
    }
    if (err instanceof ProviderUnavailableError) {
      return { error: 'Provider is currently unavailable or rate-limited. Please try again later.' };
    }
    return { error: 'Provider is currently unavailable or rate-limited. Please try again later.' };
  }

  if (!isValid) {
    return { error: 'Invalid API key.' };
  }

  let encryptedData;
  try {
    encryptedData = encrypt(cleanKey);
  } catch (encErr) {
    console.error("Encryption failed:", encErr);
    return { error: 'Failed to encrypt API key securely.' };
  }

  const { error: upsertError } = await supabase
    .from('user_api_keys')
    .upsert(
      {
        user_id: user.id,
        provider: cleanProvider,
        encrypted_key: encryptedData.encryptedKey,
        iv: encryptedData.iv,
        auth_tag: encryptedData.authTag
      },
      { onConflict: 'user_id, provider' }
    );

  if (upsertError) {
    console.error("Error saving API key:", upsertError);
    return { error: 'Failed to save API key' };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function deleteApiKey(provider: string) {
  const parsedProvider = ProviderSchema.safeParse(provider);
  if (!parsedProvider.success) {
    return { error: 'Invalid input.' };
  }
  const cleanProvider = parsedProvider.data;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_provider, preferred_model')
    .eq('id', user.id)
    .single();

  if (profile) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};
    if (profile.preferred_provider === cleanProvider) {
      updates.preferred_provider = null;
    }
    if (getProviderFromModel(profile.preferred_model || '') === cleanProvider) {
      updates.preferred_model = null;
    }

    if (Object.keys(updates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (profileError) {
        console.error("Error resetting profile provider state:", profileError);
        return { error: 'Failed to reset profile provider state' };
      }
    }
  }

  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', cleanProvider);

  if (error) {
    console.error("Error deleting API key:", error);
    return { error: 'Failed to delete API key' };
  }

  revalidatePath('/settings');
  return { success: true };
}
