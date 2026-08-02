/**
 * OpenRouter service — server-side only. Never import this from a
 * component that runs in the browser; the API key must stay server-side.
 *
 * Reads OPENROUTER_API_KEY from process.env — set it in Vercel:
 * Project -> Settings -> Environment Variables, then redeploy.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const APP_URL = process.env.APP_URL || 'https://vision-fold-creative.vercel.app';
const APP_TITLE = 'VisionFold Creative Studio';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

class OpenRouterError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'OpenRouterError';
    this.status = status;
  }
}

/** Send a chat-style request to OpenRouter and return the assistant's text reply. */
export async function generateText(
  messages: ChatMessage[],
  options: GenerateOptions = {}
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new OpenRouterError(
      'OPENROUTER_API_KEY is not set. Add it in Vercel -> Project -> Settings -> Environment Variables, then redeploy.'
    );
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': APP_URL,
      'X-Title': APP_TITLE,
    },
    body: JSON.stringify({
      model: options.model || OPENROUTER_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new OpenRouterError(
      `OpenRouter request failed (${response.status}): ${body}`,
      response.status
    );
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (typeof text !== 'string') {
    throw new OpenRouterError('OpenRouter returned an unexpected response shape.');
  }

  return text;
}

/** Convenience helper for a single-prompt call (no chat history). */
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
