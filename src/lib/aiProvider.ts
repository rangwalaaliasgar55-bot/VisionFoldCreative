/**
 * VisionFold AI provider layer (Phase A).
 *
 * OpenRouter has been removed. Phase D will wire Google Gemini (free tier).
 * Until then, generateText / generateFromPrompt throw AiProviderError with a
 * stable code so API routes can return structured, non-silent failures.
 *
 * Server-side only — never import from browser bundles.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AiProviderError extends Error {
  code: 'NOT_CONFIGURED' | 'PROVIDER_ERROR' | 'QUOTA' | 'BAD_RESPONSE';
  status: number;

  constructor(
    message: string,
    code: AiProviderError['code'] = 'NOT_CONFIGURED',
    status = 503
  ) {
    super(message);
    this.name = 'AiProviderError';
    this.code = code;
    this.status = status;
  }
}

/** True when a live LLM provider env is present (Phase D: GEMINI_API_KEY). */
export function isAiConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}

/**
 * Chat-style generation. Phase A: always not configured.
 * Phase D will call Gemini when isAiConfigured() is true.
 */
export async function generateText(
  _messages: ChatMessage[],
  _options: GenerateOptions = {}
): Promise<string> {
  if (!isAiConfigured()) {
    throw new AiProviderError(
      'AI provider is not configured. Set GEMINI_API_KEY in Vercel (Phase D). OpenRouter has been removed.',
      'NOT_CONFIGURED',
      503
    );
  }

  // Phase D: implement Gemini call here. Intentionally not a stub that fakes success.
  throw new AiProviderError(
    'AI provider key is set but the Gemini adapter is not implemented yet (Phase D).',
    'PROVIDER_ERROR',
    501
  );
}

/** Single-prompt helper. */
export async function generateFromPrompt(
  prompt: string,
  systemPrompt?: string,
  options: GenerateOptions = {}
): Promise<string> {
  const messages: ChatMessage[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  return generateText(messages, options);
}
