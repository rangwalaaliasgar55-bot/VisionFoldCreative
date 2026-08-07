import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('aiProvider Phase D', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GEMINI_DAILY_TOKEN_BUDGET;
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it('isAiConfigured is false without Gemini keys', async () => {
    const { isAiConfigured } = await import('../aiProvider');
    expect(isAiConfigured()).toBe(false);
  });

  it('isAiConfigured is true when GEMINI_API_KEY is set', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    vi.resetModules();
    const { isAiConfigured } = await import('../aiProvider');
    expect(isAiConfigured()).toBe(true);
  });

  it('generateText throws NOT_CONFIGURED without key', async () => {
    const { generateText, AiProviderError } = await import('../aiProvider');
    await expect(generateText([{ role: 'user', content: 'hi' }])).rejects.toMatchObject({
      name: 'AiProviderError',
      code: 'NOT_CONFIGURED',
      status: 503,
    });
    await expect(generateText([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(
      AiProviderError
    );
  });

  it('generateFromPrompt throws NOT_CONFIGURED without key', async () => {
    const { generateFromPrompt } = await import('../aiProvider');
    await expect(generateFromPrompt('hello', 'system')).rejects.toThrow(/not configured/i);
  });

  it('calls Gemini generateContent when key is set', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    vi.resetModules();

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
          },
        }),
    }) as any;

    const { generateText, getAiUsageSnapshot } = await import('../aiProvider');
    const text = await generateText([{ role: 'user', content: 'hi' }]);
    expect(text).toBe('Hello from Gemini');
    expect(globalThis.fetch).toHaveBeenCalled();
    const url = (globalThis.fetch as any).mock.calls[0][0] as string;
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain('gemini-2.0-flash');
    expect(getAiUsageSnapshot().tokensUsed).toBeGreaterThan(0);
  });

  it('maps provider 429 to QUOTA', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    vi.resetModules();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { message: 'Resource exhausted' } }),
    }) as any;

    const { generateText } = await import('../aiProvider');
    await expect(generateText([{ role: 'user', content: 'hi' }])).rejects.toMatchObject({
      code: 'QUOTA',
      status: 429,
    });
  });
});
