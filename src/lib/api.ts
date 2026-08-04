import { ZodSchema } from 'zod';
import { AppError, ErrorHandler, ValidationError, retryAsync } from './errors';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
  retryOptions?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  private getAbortController(timeoutMs: number): AbortController {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Clear timeout when request completes
    return new Proxy(controller, {
      get: (target, prop) => {
        if (prop === 'signal') {
          return target.signal;
        }
        return (target as any)[prop];
      },
    });
  }

  async request<T>(
    endpoint: string,
    schema: ZodSchema,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      timeout = DEFAULT_TIMEOUT,
      retry = true,
      retryOptions = {},
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    const mergedHeaders = { ...this.defaultHeaders, ...headers };

    const makeRequest = async (): Promise<T> => {
      const abortController = this.getAbortController(timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: mergedHeaders,
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = ErrorHandler.mapHttpError(
            response.status,
            errorData.message || response.statusText
          );
          throw error;
        }

        const data = await response.json();

        // Validate response against schema
        try {
          return schema.parse(data);
        } catch (validationError) {
          if (validationError instanceof Error && validationError.name === 'ZodError') {
            throw ValidationError.fromZod(validationError as any);
          }
          throw validationError;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new AppError('Request timeout', 'TIMEOUT_ERROR', 408);
        }

        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          throw new AppError('Network request failed', 'NETWORK_ERROR', 0);
        }

        throw error;
      }
    };

    if (retry) {
      return retryAsync(makeRequest, retryOptions);
    }

    return makeRequest();
  }

  async get<T>(endpoint: string, schema: ZodSchema, config?: RequestConfig): Promise<T> {
    return this.request(endpoint, schema, { ...config, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    schema: ZodSchema,
    body?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request(endpoint, schema, {
      ...config,
      method: 'POST',
      headers: {
        ...config?.headers,
        'Content-Type': 'application/json',
      },
    });
  }

  async put<T>(
    endpoint: string,
    schema: ZodSchema,
    body?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request(endpoint, schema, {
      ...config,
      method: 'PUT',
      headers: {
        ...config?.headers,
        'Content-Type': 'application/json',
      },
    });
  }

  async delete<T>(endpoint: string, schema: ZodSchema, config?: RequestConfig): Promise<T> {
    return this.request(endpoint, schema, { ...config, method: 'DELETE' });
  }

  async patch<T>(
    endpoint: string,
    schema: ZodSchema,
    body?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request(endpoint, schema, {
      ...config,
      method: 'PATCH',
      headers: {
        ...config?.headers,
        'Content-Type': 'application/json',
      },
    });
  }
}

// Singleton instance
let apiClient: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!apiClient) {
    apiClient = new ApiClient();
  }
  return apiClient;
}

export function setApiToken(token: string | null): void {
  getApiClient().setToken(token);
}

// Helper for server-side requests
export async function serverFetch<T>(
  endpoint: string,
  schema: ZodSchema,
  config: RequestConfig = {}
): Promise<[T | null, AppError | null]> {
  const client = getApiClient();
  return ErrorHandler.handleAsync(client.request(endpoint, schema, config), `API: ${endpoint}`);
}
