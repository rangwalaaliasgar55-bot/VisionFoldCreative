/**
 * VisionFold AI provider — Phase D (Google Gemini).
 * Server-side only. Never import from browser bundles that ship to clients.
 *
 * Uses the Generative Language REST API (no SDK required).
 * Docs: https://ai.google.dev/api/generate-content
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** When true, instruct model toward JSON-only output. */
  json?: boolean;
}

export interface GenerateResultMeta {
  model: string;
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
  latencyMs: number;
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

function getApiKey(): string | undefined {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  return key?.trim() || undefined;
}

export function isAiConfigured(): boolean {
  return Boolean(getApiKey());
}

export function getDefaultModel(): string {
  return (
    process.env.GEMINI_MODEL ||
    process.env.GOOGLE_GEMINI_MODEL ||
    'gemini-2.0-flash'
  );
}

/** Soft daily token budget (per serverless instance — not a global ledger). */
function getDailyTokenBudget(): number {
  const n = Number(process.env.GEMINI_DAILY_TOKEN_BUDGET || '250000');
  return Number.isFinite(n) && n > 0 ? n : 250000;
}

// In-memory counters (reset on cold start — still useful for runaway loops)
let dayKey = new Date().toISOString().slice(0, 10);
let tokensUsedToday = 0;
let callsToday = 0;

function rollDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dayKey) {
    dayKey = today;
    tokensUsedToday = 0;
    callsToday = 0;
  }
}

export function getAiUsageSnapshot() {
  rollDay();
  return {
    day: dayKey,
    tokensUsed: tokensUsedToday,
    calls: callsToday,
    budget: getDailyTokenBudget(),
    model: getDefaultModel(),
    configured: isAiConfigured(),
  };
}

function assertBudget() {
  rollDay();
  if (tokensUsedToday >= getDailyTokenBudget()) {
    throw new AiProviderError(
      `AI daily token budget exceeded (${tokensUsedToday}/${getDailyTokenBudget()}). Raise GEMINI_DAILY_TOKEN_BUDGET or wait until UTC midnight.`,
      'QUOTA',
      429
    );
  }
}

function recordUsage(totalTokens: number | undefined) {
  rollDay();
  callsToday += 1;
  if (typeof totalTokens === 'number' && totalTokens > 0) {
    tokensUsedToday += totalTokens;
  } else {
    // Rough floor so budget still moves if API omits usageMetadata
    tokensUsedToday += 500;
  }
}

function logAiEvent(
  event: string,
  data: Record<string, unknown>
) {
  // Structured log — visible in Vercel function logs
  console.log(
    JSON.stringify({
      scope: 'visionfold.ai',
      event,
      ts: new Date().toISOString(),
      ...data,
    })
  );
}

/** Map chat messages to Gemini contents + systemInstruction. */
function toGeminiPayload(messages: ChatMessage[], options: GenerateOptions) {
  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .filter(Boolean);
  if (options.json) {
    systemParts.push('Respond with valid JSON only. No markdown fences.');
  }

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    if (m.role === 'system') continue;
    const role = m.role === 'assistant' ? 'model' : 'user';
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += '\n\n' + m.content;
    } else {
      contents.push({ role, parts: [{ text: m.content }] });
    }
  }

  if (!contents.length) {
    contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  // Gemini requires alternating user/model starting with user
  if (contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: '(context)' }] });
  }

  const model = options.model || getDefaultModel();
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 1024,
    },
  };
  if (systemParts.length) {
    body.systemInstruction = { parts: [{ text: systemParts.join('\n\n') }] };
  }
  if (options.json) {
    (body.generationConfig as any).responseMimeType = 'application/json';
  }
  return { model, body };
}

export async function generateText(
  messages: ChatMessage[],
  options: GenerateOptions = {}
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AiProviderError(
      'AI provider is not configured. Set GEMINI_API_KEY in Vercel environment variables.',
      'NOT_CONFIGURED',
      503
    );
  }

  assertBudget();

  const { model, body } = toGeminiPayload(messages, options);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    logAiEvent('network_error', { model, message: err?.message });
    throw new AiProviderError(
      `Gemini network error: ${err?.message || 'fetch failed'}`,
      'PROVIDER_ERROR',
      502
    );
  }

  const latencyMs = Date.now() - started;
  const raw = await response.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }

  if (!response.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `Gemini HTTP ${response.status}`;
    const isQuota =
      response.status === 429 ||
      /quota|rate limit|resource exhausted/i.test(String(msg));
    logAiEvent('provider_error', {
      model,
      status: response.status,
      message: msg,
      latencyMs,
    });
    throw new AiProviderError(
      msg,
      isQuota ? 'QUOTA' : 'PROVIDER_ERROR',
      isQuota ? 429 : response.status >= 400 && response.status < 600 ? response.status : 502
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text || '')
      .join('')
      .trim() || '';

  const usage = data?.usageMetadata || {};
  const totalTokens =
    usage.totalTokenCount ??
    (typeof usage.promptTokenCount === 'number' && typeof usage.candidatesTokenCount === 'number'
      ? usage.promptTokenCount + usage.candidatesTokenCount
      : undefined);

  recordUsage(totalTokens);
  logAiEvent('generate_ok', {
    model,
    latencyMs,
    promptTokens: usage.promptTokenCount,
    candidatesTokens: usage.candidatesTokenCount,
    totalTokens,
    tokensUsedToday,
    callsToday,
  });

  if (!text) {
    throw new AiProviderError(
      'Gemini returned an empty response',
      'BAD_RESPONSE',
      502
    );
  }

  return text;
}

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

/** Generate and parse JSON; falls back to throwing BAD_RESPONSE. */
export async function generateJson<T = unknown>(
  prompt: string,
  systemPrompt?: string,
  options: GenerateOptions = {}
): Promise<T> {
  const text = await generateFromPrompt(prompt, systemPrompt, {
    ...options,
    json: true,
  });
  try {
    return JSON.parse(text) as T;
  } catch {
    // Strip accidental markdown fences
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new AiProviderError('Model did not return valid JSON', 'BAD_RESPONSE', 502);
    }
  }
}
