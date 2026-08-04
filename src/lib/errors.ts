import { ZodError } from 'zod';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiErrorResponse {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export class AppError extends Error {
  code: ErrorCode;
  details?: Record<string, any>;
  statusCode: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }

  toResponse(): ApiErrorResponse {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }

  static fromZod(error: ZodError): ValidationError {
    const details = error.errors.reduce(
      (acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      },
      {} as Record<string, string>
    );
    return new ValidationError('Validation failed', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, ErrorCode.UNAUTHORIZED, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, ErrorCode.FORBIDDEN, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.CONFLICT, 409, details);
    this.name = 'ConflictError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, ErrorCode.NETWORK_ERROR, 0);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout') {
    super(message, ErrorCode.TIMEOUT_ERROR, 0);
    this.name = 'TimeoutError';
  }
}

// Error mapping and logging utilities
export class ErrorHandler {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static log(error: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';

    if (error instanceof AppError) {
      console.error(`[ERROR]${contextStr} ${timestamp}:`, {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        stack: this.isDevelopment ? error.stack : undefined,
      });
    } else if (error instanceof ZodError) {
      console.error(`[VALIDATION ERROR]${contextStr} ${timestamp}:`, error.errors);
    } else {
      console.error(`[ERROR]${contextStr} ${timestamp}:`, error);
    }
  }

  static getUserFriendlyMessage(error: any): string {
    if (error instanceof AppError) {
      switch (error.code) {
        case ErrorCode.VALIDATION_ERROR:
          return 'Please check your input and try again.';
        case ErrorCode.UNAUTHORIZED:
          return 'You need to log in to continue.';
        case ErrorCode.FORBIDDEN:
          return 'You do not have permission to perform this action.';
        case ErrorCode.NOT_FOUND:
          return 'The requested item was not found.';
        case ErrorCode.CONFLICT:
          return 'This item already exists.';
        case ErrorCode.NETWORK_ERROR:
          return 'Network connection failed. Please check your internet.';
        case ErrorCode.TIMEOUT_ERROR:
          return 'The request took too long. Please try again.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }

    if (error instanceof ZodError) {
      return 'Please check your input and try again.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  static async handleAsync<T>(
    promise: Promise<T>,
    context?: string
  ): Promise<[T | null, AppError | null]> {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      this.log(error, context);
      if (error instanceof AppError) {
        return [null, error];
      }
      return [null, new AppError('An unexpected error occurred', ErrorCode.UNKNOWN_ERROR, 500)];
    }
  }

  static mapHttpError(statusCode: number, message: string): AppError {
    switch (statusCode) {
      case 400:
        return new ValidationError(message);
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message);
      case 404:
        return new NotFoundError('Resource');
      case 409:
        return new ConflictError(message);
      case 408:
      case 504:
        return new TimeoutError(message);
      case 500:
      case 502:
      case 503:
        return new AppError(message, ErrorCode.SERVER_ERROR, statusCode);
      default:
        return new AppError(message, ErrorCode.UNKNOWN_ERROR, statusCode);
    }
  }
}

// Retry utility with exponential backoff
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError || new Error('Unknown error');
}
