import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('aiProvider NVIDIA primary', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NVIDIA_API_KEY;
    delete process.env.NVAPI_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it('isAiConfigured is false without keys', async () => {
    const { isAiConfigured, getActiveProvider } = await import('../aiProvider');
    expect(isAiConfigured()).toBe(false);
    expect(getActiveProvider()).toBe('none');
  });

  it('prefers NVIDIA over Gemini', async () => {
    process.env.NVIDIA_API_KEY = 'nv-test';
    process.env.GEMINI_API_KEY = 'gem-test';
    vi.resetModules();
    const { getActiveProvider, isAiConfigured } = await import('../aiProvider');
    expect(isAiConfigured()).toBe(true);
    expect(getActiveProvider()).toBe('nvidia');
  });

  it('generateText throws NOT_CONFIGURED without key', async () => {
    const { generateText, AiProviderError } = await import('../aiProvider');
    await expect(generateText([{ role: 'user', content: 'hi' }])).rejects.toMatchObject({
      code: 'NOT_CONFIGURED',
      status: 503,
    });
    await expect(generateText([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      AiProviderError
    );
  });

  it('calls NVIDIA chat completions when NVIDIA_API_KEY is set', async () => {
    process.env.NVIDIA_API_KEY = 'nv-test';
    process.env.NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';
    vi.resetModules();

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          choices: [{ message: { content: 'Hello from NVIDIA' } }],
          usage: { prompt_tokens: 8, completion_tokens: 4, total_tokens: 12 },
        }),
    }) as any;

    const { generateText, getAiUsageSnapshot } = await import('../aiProvider');
    const text = await generateText([{ role: 'user', content: 'hi' }]);
    expect(text).toBe('Hello from NVIDIA');
    const url = (globalThis.fetch as any).mock.calls[0][0] as string;
    expect(url).toContain('integrate.api.nvidia.com');
    const init = (globalThis.fetch as any).mock.calls[0][1];
    expect(init.headers.Authorization).toBe('Bearer nv-test');
    expect(getAiUsageSnapshot().provider).toBe('nvidia');
  });

  it('maps 429 to QUOTA', async () => {
    process.env.NVIDIA_API_KEY = 'nv-test';
    vi.resetModules();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { message: 'rate limit' } }),
    }) as any;

    const { generateText } = await import('../aiProvider');
    await expect(generateText([{ role: 'user', content: 'hi' }])).rejects.toMatchObject({
      code: 'QUOTA',
      status: 429,
    });
  });
});
