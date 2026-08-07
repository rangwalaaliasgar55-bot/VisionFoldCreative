import { describe, it, expect } from 'vitest';
import { toSafeUser, assertClientOwns } from '../../server/security';
import type { AuthenticatedRequest } from '../../server/security';

describe('toSafeUser', () => {
  it('strips passwordHash and normalizes role', () => {
    const safe = toSafeUser({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      role: 'admin',
      passwordHash: 'secret',
      company: 'X',
      phone: '1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(safe).toMatchObject({ id: 'u1', email: 'a@b.com', role: 'admin' });
    expect((safe as any).passwordHash).toBeUndefined();
  });

  it('maps non-admin roles to client for public schema', () => {
    const safe = toSafeUser({
      id: 'u2',
      email: 'c@b.com',
      name: 'C',
      role: 'client',
    });
    expect(safe.role).toBe('client');
  });
});

describe('assertClientOwns', () => {
  it('allows admin any clientId', () => {
    const req = { user: { id: 'admin1', role: 'admin' } } as AuthenticatedRequest;
    expect(assertClientOwns(req, 'someone-else')).toBe(true);
  });

  it('allows client only own id', () => {
    const req = { user: { id: 'c1', role: 'client' } } as AuthenticatedRequest;
    expect(assertClientOwns(req, 'c1')).toBe(true);
    expect(assertClientOwns(req, 'c2')).toBe(false);
    expect(assertClientOwns(req, null)).toBe(false);
  });

  it('rejects missing user', () => {
    const req = {} as AuthenticatedRequest;
    expect(assertClientOwns(req, 'c1')).toBe(false);
  });
});
