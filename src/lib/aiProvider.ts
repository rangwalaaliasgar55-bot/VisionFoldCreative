/**
 * VisionFold AI provider — NVIDIA NIM (primary, free tier) + optional Gemini fallback.
 * Server-side only. Never import from browser bundles.
 *
 * NVIDIA: OpenAI-compatible Chat Completions
 *   POST https://integrate.api.nvidia.com/v1/chat/completions
 *   Authorization: Bearer $NVIDIA_API_KEY
 *
 * Env (preferred):
 *   NVIDIA_API_KEY or NVAPI_KEY
 *   NVIDIA_MODEL (default: meta/llama-3.1-8b-instruct)
 *   AI_DAILY_TOKEN_BUDGET (default 250000)
 *
 * Optional fallback if NVIDIA unset:
 *   GEMINI_API_KEY
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
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

type ProviderName = 'nvidia' | 'gemini' | 'none';

function getNvidiaKey(): string | undefined {
  const key =
    process.env.NVIDIA_API_KEY ||
    process.env.NVAPI_KEY ||
    process.env.NVIDIA_NIM_API_KEY;
  return key?.trim() || undefined;
}

function getGeminiKey(): string | undefined {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  return key?.trim() || undefined;
}

export function getActiveProvider(): ProviderName {
  if (getNvidiaKey()) return 'nvidia';
  if (getGeminiKey()) return 'gemini';
  return 'none';
}

export function isAiConfigured(): boolean {
  return getActiveProvider() !== 'none';
}

export function getDefaultModel(): string {
  const provider = getActiveProvider();
  if (provider === 'nvidia') {
    return (
      process.env.NVIDIA_MODEL ||
      process.env.NIM_MODEL ||
      'meta/llama-3.1-8b-instruct'
    );
  }
  if (provider === 'gemini') {
    return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }
  return 'none';
}

function getDailyTokenBudget(): number {
  const n = Number(
    process.env.AI_DAILY_TOKEN_BUDGET ||
      process.env.NVIDIA_DAILY_TOKEN_BUDGET ||
      process.env.GEMINI_DAILY_TOKEN_BUDGET ||
      '250000'
  );
  return Number.isFinite(n) && n > 0 ? n : 250000;
}

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
    provider: getActiveProvider(),
    configured: isAiConfigured(),
  };
}

function assertBudget() {
  rollDay();
  if (tokensUsedToday >= getDailyTokenBudget()) {
    throw new AiProviderError(
      `AI daily token budget exceeded (${tokensUsedToday}/${getDailyTokenBudget()}).`,
      'QUOTA',
      429
    );
  }
}

function recordUsage(totalTokens: number | undefined) {
  rollDay();
  callsToday += 1;
  tokensUsedToday += typeof totalTokens === 'number' && totalTokens > 0 ? totalTokens : 500;
}

function logAiEvent(event: string, data: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      scope: 'visionfold.ai',
      event,
      ts: new Date().toISOString(),
      ...data,
    })
  );
}

async function generateViaNvidia(
  messages: ChatMessage[],
  options: GenerateOptions
): Promise<string> {
  const apiKey = getNvidiaKey();
  if (!apiKey) {
    throw new AiProviderError('NVIDIA_API_KEY is not set', 'NOT_CONFIGURED', 503);
  }

  const model = options.model || getDefaultModel();
  const systemExtra = options.json
    ? ' Respond with valid JSON only. No markdown fences.'
    : '';

  const openaiMessages = messages.map((m) => ({
    role: m.role,
    content: m.role === 'system' ? m.content + systemExtra : m.content,
  }));

  if (options.json && !openaiMessages.some((m) => m.role === 'system')) {
    openaiMessages.unshift({
      role: 'system',
      content: 'Respond with valid JSON only. No markdown fences.',
    });
  }

  const url = 'https://integrate.api.nvidia.com/v1/chat/completions';
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
        stream: false,
      }),
    });
  } catch (err: any) {
    logAiEvent('network_error', { provider: 'nvidia', model, message: err?.message });
    throw new AiProviderError(
      `NVIDIA network error: ${err?.message || 'fetch failed'}`,
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
      data?.detail ||
      `NVIDIA HTTP ${response.status}`;
    const isQuota =
      response.status === 429 || /quota|rate limit|resource/i.test(String(msg));
    logAiEvent('provider_error', {
      provider: 'nvidia',
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

  const text = String(data?.choices?.[0]?.message?.content || '').trim();
  const usage = data?.usage || {};
  const totalTokens =
    usage.total_tokens ??
    (typeof usage.prompt_tokens === 'number' && typeof usage.completion_tokens === 'number'
      ? usage.prompt_tokens + usage.completion_tokens
      : undefined);

  recordUsage(totalTokens);
  logAiEvent('generate_ok', {
    provider: 'nvidia',
    model,
    latencyMs,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens,
    tokensUsedToday,
    callsToday,
  });

  if (!text) {
    throw new AiProviderError('NVIDIA returned an empty response', 'BAD_RESPONSE', 502);
  }
  return text;
}

async function generateViaGemini(
  messages: ChatMessage[],
  options: GenerateOptions
): Promise<string> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new AiProviderError('GEMINI_API_KEY is not set', 'NOT_CONFIGURED', 503);
  }

  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content);
  if (options.json) systemParts.push('Respond with valid JSON only. No markdown fences.');

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    if (m.role === 'system') continue;
    const role = m.role === 'assistant' ? 'model' : 'user';
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts[0].text += '\n\n' + m.content;
    else contents.push({ role, parts: [{ text: m.content }] });
  }
  if (!contents.length) contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  if (contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: '(context)' }] });
  }

  const model = options.model || getDefaultModel();
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 1024,
      ...(options.json ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (systemParts.length) {
    body.systemInstruction = { parts: [{ text: systemParts.join('\n\n') }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const started = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const latencyMs = Date.now() - started;
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = data?.error?.message || `Gemini HTTP ${response.status}`;
    const isQuota = response.status === 429;
    logAiEvent('provider_error', { provider: 'gemini', model, status: response.status, message: msg, latencyMs });
    throw new AiProviderError(msg, isQuota ? 'QUOTA' : 'PROVIDER_ERROR', isQuota ? 429 : 502);
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('').trim() || '';
  const usage = data?.usageMetadata || {};
  recordUsage(usage.totalTokenCount);
  logAiEvent('generate_ok', { provider: 'gemini', model, latencyMs, totalTokens: usage.totalTokenCount });
  if (!text) throw new AiProviderError('Gemini returned an empty response', 'BAD_RESPONSE', 502);
  return text;
}

export async function generateText(
  messages: ChatMessage[],
  options: GenerateOptions = {}
): Promise<string> {
  const provider = getActiveProvider();
  if (provider === 'none') {
    throw new AiProviderError(
      'AI is not configured. Set NVIDIA_API_KEY (recommended free tier) or GEMINI_API_KEY in Vercel.',
      'NOT_CONFIGURED',
      503
    );
  }
  assertBudget();
  if (provider === 'nvidia') return generateViaNvidia(messages, options);
  return generateViaGemini(messages, options);
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

export async function generateJson<T = unknown>(
  prompt: string,
  systemPrompt?: string,
  options: GenerateOptions = {}
): Promise<T> {
  const text = await generateFromPrompt(prompt, systemPrompt, { ...options, json: true });
  try {
    return JSON.parse(text) as T;
  } catch {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new AiProviderError('Model did not return valid JSON', 'BAD_RESPONSE', 502);
    }
  }
}
