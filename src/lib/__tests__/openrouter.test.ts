import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Define the error class for testing
class OpenRouterError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'OpenRouterError';
    this.status = status;
  }
}

describe('OpenRouterError', () => {
  it('should create an error with a message', () => {
    const error = new OpenRouterError('Test error message');
    expect(error.message).toBe('Test error message');
    expect(error.name).toBe('OpenRouterError');
    expect(error.status).toBeUndefined();
  });

  it('should create an error with message and status', () => {
    const error = new OpenRouterError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error.name).toBe('OpenRouterError');
  });

  it('should be an instance of Error', () => {
    const error = new OpenRouterError('Test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(OpenRouterError);
  });
});

describe('generateText', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'test-api-key',
      OPENROUTER_MODEL: '',
    };
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should throw error when OPENROUTER_API_KEY is not set', async () => {
    // Must reset modules before changing env
    vi.resetModules();
    process.env = { ...originalEnv, OPENROUTER_API_KEY: '' };
    
    const { generateText } = await import('../openrouter');
    const messages = [{ role: 'user' as const, content: 'Hello' }];
    
    await expect(generateText(messages)).rejects.toThrow('OPENROUTER_API_KEY is not set');
  });

  it('should throw error when API returns non-ok response', async () => {
    const { generateText } = await import('../openrouter');
    
    const mockResponse = {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Internal Server Error'),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const messages = [{ role: 'user' as const, content: 'Hello' }];
    
    await expect(generateText(messages)).rejects.toThrow('OpenRouter request failed (500)');
  });

  it('should throw error when response shape is unexpected', async () => {
    const { generateText } = await import('../openrouter');
    
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ choices: [{ message: { content: 123 as any } }] }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const messages = [{ role: 'user' as const, content: 'Hello' }];
    
    await expect(generateText(messages)).rejects.toThrow('unexpected response shape');
  });

  it('should return text content when API call is successful', async () => {
    const { generateText } = await import('../openrouter');
    
    const expectedText = 'Hello, how can I help you?';
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ 
        choices: [{ message: { content: expectedText } }] 
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const messages = [{ role: 'user' as const, content: 'Hello' }];
    const result = await generateText(messages);
    
    expect(result).toBe(expectedText);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(fetchCall[1].method).toBe('POST');
    expect(fetchCall[1].headers.Authorization).toBe('Bearer test-api-key');
  });

  it('should use custom model when provided in options', async () => {
    const { generateText } = await import('../openrouter');
    
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ 
        choices: [{ message: { content: 'test' } }] 
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const messages = [{ role: 'user' as const, content: 'Hello' }];
    await generateText(messages, { model: 'anthropic/claude-3' });
    
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[1].body).toContain('anthropic/claude-3');
  });

  it('should use custom temperature when provided', async () => {
    const { generateText } = await import('../openrouter');
    
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ 
        choices: [{ message: { content: 'test' } }] 
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const messages = [{ role: 'user' as const, content: 'Hello' }];
    await generateText(messages, { temperature: 0.5 });
    
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[1].body).toContain('"temperature":0.5');
  });

  it('should use custom maxTokens when provided', async () => {
    const { generateText } = await import('../openrouter');
    
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ 
        choices: [{ message: { content: 'test' } }] 
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const messages = [{ role: 'user' as const, content: 'Hello' }];
    await generateText(messages, { maxTokens: 500 });
    
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[1].body).toContain('"max_tokens":500');
  });
});

describe('generateFromPrompt', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'test-api-key',
      OPENROUTER_MODEL: '',
    };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should create user message only when no system prompt', async () => {
    const { generateFromPrompt } = await import('../openrouter');
    
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ 
        choices: [{ message: { content: 'Response' } }] 
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await generateFromPrompt('Hello world');
    
    expect(result).toBe('Response');
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.messages).toEqual([{ role: 'user', content: 'Hello world' }]);
  });

  it('should create system and user messages when system prompt provided', async () => {
    const { generateFromPrompt } = await import('../openrouter');
    
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ 
        choices: [{ message: { content: 'Response' } }] 
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await generateFromPrompt('Hello world', 'You are a helpful assistant');
    
    expect(result).toBe('Response');
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.messages).toEqual([
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello world' }
    ]);
  });

  it('should pass options to generateText', async () => {
    const { generateFromPrompt } = await import('../openrouter');
    
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ 
        choices: [{ message: { content: 'Response' } }] 
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await generateFromPrompt('Hello', 'You are helpful', { temperature: 0.3 });
    
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.temperature).toBe(0.3);
  });
});
