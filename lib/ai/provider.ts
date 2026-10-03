import { GoogleGenAI } from '@google/genai';
import { parseProviderError } from './models';
import { z } from 'zod';


export interface AiProvider {
  /**
   * Generates a structured JSON object according to a Zod schema.
   */
  generateStructured<T extends z.ZodTypeAny>(
    prompt: string, 
    schema: T, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geminiSchema: any,
    modelName: string, 
    content: string
  ): Promise<z.infer<T>>;

  /**
   * Performs a lightweight request to validate the provided API key.
   * Throws an error for transient failures, or returns false if the key is invalid.
   */
  validateKey(apiKey: string): Promise<boolean>;
}

export function zodToStrictJsonSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(zodToStrictJsonSchema);

  const out = { ...(schema as Record<string, unknown>) } as Record<string, unknown>;

  if (out.type === 'object' || out.type === 'OBJECT') {
    out.additionalProperties = false;
    if (out.properties && typeof out.properties === 'object') {
      out.required = Object.keys(out.properties);
      const props = out.properties as Record<string, unknown>;
      for (const k of Object.keys(props)) {
        props[k] = zodToStrictJsonSchema(props[k]);
      }
    } else {
      out.properties = {};
      out.required = [];
    }
  }

  if (out.nullable === true) {
    delete out.nullable;
    const baseType = (typeof out.type === 'string' ? out.type.toLowerCase() : "string");
    out.type = [baseType, "null"];
  } else if (out.type && typeof out.type === 'string') {
    out.type = out.type.toLowerCase();
  }
  
  if (out.items) {
      out.items = zodToStrictJsonSchema(out.items);
  }

  return out;
}

export class GoogleGeminiProvider implements AiProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateStructured<T extends z.ZodTypeAny>(prompt: string, schema: T, geminiSchema: any, modelName: string, content: string): Promise<z.infer<T>> {
    const response = await this.ai.models.generateContent({
      model: modelName,
      contents: content,
      config: {
        systemInstruction: prompt,
        responseMimeType: 'application/json',
        responseSchema: geminiSchema,
        temperature: 0.1,
      }
    });

    if (!response.text) {
      throw new Error("No response text from AI model");
    }

    return schema.parse(JSON.parse(response.text));
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const tempAi = new GoogleGenAI({ apiKey });
      await tempAi.models.get({ model: 'gemini-3.5-flash' });
      return true;
    } catch (error: unknown) {
      const parsed = parseProviderError(error);
      
      if (parsed.isUnavailableError || parsed.isQuotaError) {
        throw new Error("Provider is currently unavailable or rate-limited. Please try again later.");
      }
      
      if (parsed.statusCode === 400 || parsed.statusCode === 401 || parsed.statusCode === 403) {
        return false;
      }
      
      return false;
    }
  }
}

export class OpenAICompatibleProvider implements AiProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.groq.com/openai/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateStructured<T extends z.ZodTypeAny>(prompt: string, schema: T, geminiSchema: any, modelName: string, content: string): Promise<z.infer<T>> {
    // geminiSchema is already a JSON Schema structure (with uppercase types like 'OBJECT').
    // We pass it directly to our strict converter, bypassing zod-to-json-schema 
    // which fails silently (returning {}) due to the Zod 4.4.3 AST mismatch.
    const strictSchema = zodToStrictJsonSchema(geminiSchema);

    const body = {
      model: modelName,
      temperature: 0.1,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: content }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extraction_schema',
          strict: true,
          schema: strictSchema
        }
      }
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errorData: Record<string, unknown> | undefined;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: { message: await response.text() } };
      }
      
      const errorMsg = typeof errorData?.error === 'object' && errorData.error !== null && 'message' in errorData.error
        ? String(errorData.error.message)
        : response.statusText;
        
      const err = new Error(errorMsg) as Error & { status?: number, headers?: Headers, error?: unknown };
      err.status = response.status;
      err.headers = response.headers;
      err.error = errorData?.error;
      throw err;
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;
    
    if (!resultText) {
      throw new Error("No response text from AI model");
    }

    return schema.parse(JSON.parse(resultText));
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return false;
        throw new Error(`HTTP ${response.status}`);
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Factory to instantiate the correct AiProvider.
 */
export function getProvider(providerName: string, apiKey: string): AiProvider {
  switch (providerName.toLowerCase()) {
    case 'google':
      return new GoogleGeminiProvider(apiKey);
    case 'groq':
      return new OpenAICompatibleProvider(apiKey, 'https://api.groq.com/openai/v1');
    default:
      throw new Error(`Unsupported AI provider: ${providerName}`);
  }
}
