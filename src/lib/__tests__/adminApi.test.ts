import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, adminApi } from '../adminApi';

describe('ApiError', () => {
  it('should create an error with message and status', () => {
    const error = new ApiError('Not Found', 404);
    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new ApiError('Test error', 500);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it('should allow accessing status property', () => {
    const error = new ApiError('Server Error', 500);
    expect(error.status).toBe(500);
  });
});

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should make a GET request and return parsed JSON', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockResponse = {
        ok: true,
        status: 200,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue(mockData),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await adminApi.get<typeof mockData>('/api/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should throw ApiError on non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue({ error: 'Resource not found' }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(adminApi.get('/api/test')).rejects.toThrow('Resource not found');
    });

    it('should throw ApiError with generic message when response has no error field', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue({}),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(adminApi.get('/api/test')).rejects.toThrow('Request failed (500)');
    });
  });

  describe('post', () => {
    it('should make a POST request with JSON body', async () => {
      const mockData = { id: 1, name: 'Created' };
      const body = { name: 'New Item' };
      const mockResponse = {
        ok: true,
        status: 201,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue(mockData),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await adminApi.post<typeof mockData>('/api/test', body);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    });

    it('should make a POST request without body', async () => {
      const mockData = { success: true };
      const mockResponse = {
        ok: true,
        status: 200,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue(mockData),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await adminApi.post<typeof mockData>('/api/test');

      expect(result).toEqual(mockData);
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1].method).toBe('POST');
      expect(call[1].body).toBeUndefined();
    });

    it('should throw ApiError on failed POST request', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue({ error: 'Invalid data' }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(adminApi.post('/api/test', {})).rejects.toThrow('Invalid data');
    });
  });

  describe('put', () => {
    it('should make a PUT request with JSON body', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const body = { name: 'Updated Item' };
      const mockResponse = {
        ok: true,
        status: 200,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue(mockData),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await adminApi.put<typeof mockData>('/api/test/1', body);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    });
  });

  describe('patch', () => {
    it('should make a PATCH request with JSON body', async () => {
      const mockData = { id: 1, name: 'Patched' };
      const body = { name: 'Patched Item' };
      const mockResponse = {
        ok: true,
        status: 200,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue(mockData),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await adminApi.patch<typeof mockData>('/api/test/1', body);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    });
  });

  describe('delete', () => {
    it('should make a DELETE request', async () => {
      const mockData = { deleted: true };
      const mockResponse = {
        ok: true,
        status: 200,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue(mockData),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await adminApi.delete<typeof mockData>('/api/test/1');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should throw ApiError on failed DELETE request', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        json: vi.fn().mockResolvedValue({ error: 'Forbidden' }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(adminApi.delete('/api/test/1')).rejects.toThrow('Forbidden');
    });
  });
});
