import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('aiProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
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

  it('with key set but no Gemini adapter yet, throws PROVIDER_ERROR 501', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    vi.resetModules();
    const { generateText } = await import('../aiProvider');
    await expect(generateText([{ role: 'user', content: 'hi' }])).rejects.toMatchObject({
      code: 'PROVIDER_ERROR',
      status: 501,
    });
  });
});
