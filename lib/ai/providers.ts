export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: 'Google Gemini',
  groq: 'Groq',
};

export const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  google: 'gemini-3.5-flash',
  groq: 'groq:openai/gpt-oss-120b',
};

export function getProviderFromModel(modelName: string): string {
  if (!modelName) return 'google';
  if (modelName.startsWith('groq:')) return 'groq';
  if (modelName.startsWith('gemini') || modelName.includes('gemini')) return 'google';
  return 'google';
}

export function resolveTryFirst(preferred: string | null, held: string[]): string | null {
  if (preferred && held.includes(preferred)) {
    return preferred;
  }
  const order = ['google', 'groq'];
  for (const provider of order) {
    if (held.includes(provider)) {
      return provider;
    }
  }
  return null;
}
