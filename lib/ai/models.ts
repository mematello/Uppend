import { createServiceClient } from '../supabase/serviceClient';

// NOTE: Google's free-tier model lineup changes frequently in 2026.
// This list should be treated as something to revisit periodically, not a permanent config.
export const AI_MODELS = [
  { name: 'gemini-3.5-flash', dailyLimit: 20, description: 'Default/Most capable, but only 20/day limit' },
  { name: 'gemini-3-flash-preview', dailyLimit: 1500, description: 'Primary fallback, ~1500/day free tier' },
  { name: 'gemini-3.1-flash-lite-preview', dailyLimit: 1500, description: 'Last resort/faster fallback' },
  { name: 'groq:openai/gpt-oss-120b', dailyLimit: 1000, sharedQuotaKey: 'groq:shared-bucket', description: 'Groq fallback 1', userSelectable: false },
  { name: 'groq:openai/gpt-oss-20b', dailyLimit: 1000, sharedQuotaKey: 'groq:shared-bucket', description: 'Groq fallback 2', userSelectable: false }
];

export class AllModelsExhaustedError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super('All models are exhausted or blocked.');
    this.name = 'AllModelsExhaustedError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface ParsedAiError {
  isQuotaError: boolean;
  isUnavailableError: boolean;
  errorClass: 'TEMPORARY_PROVIDER' | 'PERMANENT_PROVIDER' | 'TERMINAL_EXECUTION';
  statusCode: number | null;
  statusText: string | null;
  message: string;
  retryAfterSeconds: number | null;
}

export const parseGeminiError = parseProviderError;

export function parseProviderError(e: unknown): ParsedAiError {
  const rawMessage = e instanceof Error ? e.message : String(e || '');
  const errObj = (e && typeof e === 'object') ? (e as Record<string, unknown>) : {};
  
  let statusCode: number | null = typeof errObj.status === 'number' ? errObj.status : (typeof errObj.code === 'number' ? errObj.code : null);
  let statusText: string | null = typeof errObj.status === 'string' ? errObj.status : null;
  let message = rawMessage;
  const headers = (errObj.headers as unknown) as Headers | null;

  // Safely attempt to parse stringified JSON embedded in error message
  try {
    const firstBrace = rawMessage.indexOf('{');
    const lastBrace = rawMessage.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const parsed = JSON.parse(rawMessage.slice(firstBrace, lastBrace + 1));
      const innerErr = parsed.error || parsed;
      if (innerErr.code) statusCode = Number(innerErr.code);
      if (innerErr.status) statusText = String(innerErr.status);
      if (innerErr.message) message = String(innerErr.message);
    }
  } catch {
    // Non-JSON message; fall back to string matching
  }

  const upperRaw = (rawMessage + ' ' + (statusText || '') + ' ' + (statusCode || '')).toUpperCase();

  const isQuotaError =
    statusCode === 429 ||
    statusText === 'RESOURCE_EXHAUSTED' ||
    upperRaw.includes('429') ||
    upperRaw.includes('RESOURCE_EXHAUSTED') ||
    upperRaw.includes('QUOTA');

  const isUnavailableError =
    statusCode === 503 ||
    statusCode === 500 ||
    statusCode === 504 ||
    statusText === 'UNAVAILABLE' ||
    upperRaw.includes('503') ||
    upperRaw.includes('UNAVAILABLE') ||
    upperRaw.includes('HIGH DEMAND') ||
    upperRaw.includes('TEMPORARILY OVERLOADED');

  let retryAfterSeconds: number | null = null;
  const match = rawMessage.match(/retryDelay.*?([\d\.]+)s/) || rawMessage.match(/retry in ([\d\.]+)s/);
  if (match) {
    retryAfterSeconds = Math.ceil(parseFloat(match[1]));
  } else if (headers && headers.get) {
    const retryAfter = headers.get('retry-after');
    if (retryAfter) {
      retryAfterSeconds = parseInt(retryAfter, 10);
    } else {
      const resetTokens = headers.get('x-ratelimit-reset-tokens');
      const resetRequests = headers.get('x-ratelimit-reset-requests');
      if (resetTokens || resetRequests) {
        // e.g. "5.5s" or "3h"
        const maxResetStr = [resetTokens, resetRequests].find(x => x);
        if (maxResetStr) {
          const num = parseFloat(maxResetStr);
          if (maxResetStr.includes('h')) retryAfterSeconds = Math.ceil(num * 3600);
          else if (maxResetStr.includes('m')) retryAfterSeconds = Math.ceil(num * 60);
          else retryAfterSeconds = Math.ceil(num);
        }
      }
    }
  }

  let errorClass: 'TEMPORARY_PROVIDER' | 'PERMANENT_PROVIDER' | 'TERMINAL_EXECUTION' = 'TERMINAL_EXECUTION';
  
  if (isQuotaError || isUnavailableError) {
    errorClass = 'TEMPORARY_PROVIDER';
  } else if (statusCode === 404) {
    errorClass = 'PERMANENT_PROVIDER';
  } else if (statusCode === 400) {
    if (/(API_KEY_INVALID|API key not valid)/i.test(message)) {
      statusCode = 401; // Treat as key rejection
      errorClass = 'TERMINAL_EXECUTION';
    } else if (/(model|unsupported|deprecated|not found|retired)/i.test(message)) {
      errorClass = 'PERMANENT_PROVIDER';
    } else {
      errorClass = 'TERMINAL_EXECUTION';
    }
  }

  return {
    isQuotaError,
    isUnavailableError,
    errorClass,
    statusCode,
    statusText,
    message,
    retryAfterSeconds,
  };
}

export async function blockModelInDb(modelName: string, durationSeconds: number): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const blockUntil = new Date();
    blockUntil.setSeconds(blockUntil.getSeconds() + durationSeconds);
    const { data, error } = await supabase.rpc('block_model', {
      p_model_name: modelName,
      p_blocked_until: blockUntil.toISOString()
    });
    if (error) throw error;
    return data === true;
  } catch (err) {
    console.error(`[AI Models] Failed to block model ${modelName}:`, err);
    return false;
  }
}

export function getProviderPrefix(modelName: string): string {
  return modelName.includes(':') ? modelName.split(':')[0] : 'google';
}

export async function getAvailableModel(
  userId: string, 
  excludeModels: string[] = [], 
  requestedModel?: string,
  byokProviders?: string[]
) {
  const supabase = createServiceClient();

  // 1. Fetch user's preferred model
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_model')
    .eq('id', userId)
    .single();

  const preferredModelName = profile?.preferred_model || AI_MODELS[0].name;

  // 2. Reorder candidate models: preferred model first, then remaining
  let candidateModels = AI_MODELS.filter(m => !excludeModels.includes(m.name));

  let orderedModels: typeof AI_MODELS = [];
  if (byokProviders && byokProviders.length > 0) {
    candidateModels = candidateModels.filter(m => byokProviders.includes(getProviderPrefix(m.name)));
    for (const provider of byokProviders) {
      const providerModels = candidateModels.filter(m => getProviderPrefix(m.name) === provider);
      const prefModel = providerModels.find(m => m.name === preferredModelName);
      if (prefModel) {
        orderedModels.push(prefModel);
      }
      for (const m of providerModels) {
        if (m.name !== preferredModelName) {
          orderedModels.push(m);
        }
      }
    }
  } else {
    orderedModels = [
      ...candidateModels.filter(m => m.name === preferredModelName),
      ...candidateModels.filter(m => m.name !== preferredModelName)
    ];
  }

  if (orderedModels.length === 0) {
    throw new AllModelsExhaustedError(60);
  }

  // 3. Custom Key Path: Bypass global ai_model_usage tracking completely.
  if (byokProviders && byokProviders.length > 0) {
    if (requestedModel && !excludeModels.includes(requestedModel)) {
      const requestedProvider = getProviderPrefix(requestedModel);
      if (byokProviders.includes(requestedProvider)) {
        const modelConfig = candidateModels.find(m => m.name === requestedModel);
        if (modelConfig) {
          return { name: requestedModel, trackingName: modelConfig.sharedQuotaKey || requestedModel };
        }
      }
    }
    const modelConfig = orderedModels[0];
    return { name: modelConfig.name, trackingName: modelConfig.sharedQuotaKey || modelConfig.name };
  }

  // 4. Server Key Path: Enforce global rate limits via ai_model_usage table.
  const today = new Date().toISOString().split('T')[0];
  const { data: usageData } = await supabase
    .from('ai_model_usage')
    .select('*')
    .eq('date', today);

  const usageMap = new Map();
  if (usageData) {
    for (const row of usageData) {
      usageMap.set(row.model_name, row);
    }
  }

  if (requestedModel && !excludeModels.includes(requestedModel)) {
    const modelConfig = AI_MODELS.find(m => m.name === requestedModel);
    const trackingName = modelConfig?.sharedQuotaKey || requestedModel;
    const usage = usageMap.get(trackingName);
    const isBlocked = usage?.blocked_until && new Date(usage.blocked_until) > new Date();
    const limit = modelConfig?.dailyLimit ?? 1500;
    const isExhausted = usage && usage.request_count >= limit;

    if (!isBlocked && !isExhausted) {
      return { name: requestedModel, trackingName };
    }
  }

  let earliestReset = new Date();
  earliestReset.setHours(24, 0, 0, 0);

  for (const model of orderedModels) {
    const trackingName = model.sharedQuotaKey || model.name;
    const usage = usageMap.get(trackingName);
    if (!usage) return { name: model.name, trackingName };

    const isBlocked = usage.blocked_until && new Date(usage.blocked_until) > new Date();
    const isExhausted = usage.request_count >= model.dailyLimit;

    if (!isBlocked && !isExhausted) {
      return { name: model.name, trackingName };
    }

    if (isBlocked) {
      const resetTime = new Date(usage.blocked_until);
      if (resetTime < earliestReset) earliestReset = resetTime;
    }
  }

  const secondsUntilReset = Math.max(1, Math.ceil((earliestReset.getTime() - Date.now()) / 1000));
  throw new AllModelsExhaustedError(secondsUntilReset);
}
