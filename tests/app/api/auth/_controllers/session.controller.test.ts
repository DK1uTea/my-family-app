import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookies, logout, refresh, cookieStore } = vi.hoisted(() => {
  const cookieStore = { get: vi.fn() };
  return {
    cookies: vi.fn(async () => cookieStore),
    logout: vi.fn(),
    refresh: vi.fn(),
    cookieStore,
  };
});

vi.mock('next/headers', () => ({ cookies }));
vi.mock('@/server/modules/auth', () => ({ authService: { logout, refresh } }));

import { handleLogout } from '@/app/api/auth/_controllers/logout.controller';
import { handleRefreshToken } from '@/app/api/auth/_controllers/refresh-token.controller';

describe('auth session controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.get.mockReturnValue(undefined);
  });

  it('clears session cookies and returns 401 when refresh token is missing', async () => {
    const response = await handleRefreshToken();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ status: 401, message: 'Missing refresh token' });
    expect(refresh).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toContain('accessToken=');
    expect(response.headers.get('set-cookie')).toContain('refreshToken=');
  });

  it('rotates the access and refresh cookies after successful refresh', async () => {
    cookieStore.get.mockReturnValue({ value: 'old-refresh' });
    refresh.mockResolvedValue({
      success: true,
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    });

    const response = await handleRefreshToken();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 200,
      message: 'OK',
      data: { accessToken: 'new-access' },
    });
    expect(refresh).toHaveBeenCalledWith('old-refresh');
    expect(response.cookies.get('accessToken')?.value).toBe('new-access');
    expect(response.cookies.get('refreshToken')?.value).toBe('new-refresh');
  });

  it('clears session cookies on logout even when revocation fails', async () => {
    cookieStore.get.mockReturnValue({ value: 'current-refresh' });
    logout.mockRejectedValue(new Error('revocation unavailable'));

    const response = await handleLogout();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 200, message: 'OK' });
    expect(logout).toHaveBeenCalledWith('current-refresh');
    expect(response.headers.get('set-cookie')).toContain('accessToken=');
    expect(response.headers.get('set-cookie')).toContain('refreshToken=');
  });
});
