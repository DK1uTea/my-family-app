import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const { authenticateAccessToken } = vi.hoisted(() => ({ authenticateAccessToken: vi.fn() }));
vi.mock('@/server/modules/auth', () => ({ authService: { authenticateAccessToken } }));

import { requireAuthenticated } from '@/app/api/_shared/require-authenticated';

describe('requireAuthenticated', () => {
  it('returns a translation key when the access token cannot authenticate', async () => {
    authenticateAccessToken.mockResolvedValue(null);

    const response = await requireAuthenticated(new NextRequest('http://localhost/api/users/me'));

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) throw new Error('Expected an HTTP response');
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      status: 401, message: 'AUTH_SESSION_INVALID', error_code: 'AUTH_SESSION_INVALID',
    });
  });
});
