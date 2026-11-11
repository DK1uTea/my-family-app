import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findProfileById, login, verifyAccessToken, verifyCaptcha } = vi.hoisted(() => ({
  findProfileById: vi.fn(),
  login: vi.fn(),
  verifyAccessToken: vi.fn(),
  verifyCaptcha: vi.fn(),
}));

vi.mock('@/lib/verify-captcha', () => ({ verifyCaptcha }));
vi.mock('@/server/modules/auth', () => ({
  authService: { login },
  verifyAccessToken,
}));
vi.mock('@/server/modules/users', () => ({ usersService: { findProfileById } }));

import { handleLogin } from '@/app/api/auth/_controllers/login.controller';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('login controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyCaptcha.mockResolvedValue(true);
  });

  it('preserves the HTTP 200 validation envelope when credentials are missing', async () => {
    const response = await handleLogin(request({ email: 'adult@example.test' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 400,
      message: 'AUTH_LOGIN_MISSING_CREDENTIALS',
      error_code: 'AUTH_LOGIN_MISSING_CREDENTIALS',
    });
    expect(login).not.toHaveBeenCalled();
  });

  it('returns the captcha failure envelope without attempting login', async () => {
    verifyCaptcha.mockResolvedValue(false);

    const response = await handleLogin(request({
      email: 'adult@example.test',
      password: 'secret',
      captchaToken: 'bad-token',
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 400,
      message: 'AUTH_CAPTCHA_FAILED',
      error_code: 'AUTH_CAPTCHA_FAILED',
    });
    expect(login).not.toHaveBeenCalled();
  });

  it('returns login failure metadata inside the HTTP 200 envelope', async () => {
    login.mockResolvedValue({
      success: false,
      status: 423,
      errorCode: 'AUTH.LOGIN.ACCOUNT_LOCKED',
      attemptsRemaining: 0,
      loginBlockDuration: 900,
      message: 'Account locked',
    });

    const response = await handleLogin(request({
      email: 'adult@example.test',
      password: 'wrong',
      captchaToken: 'valid-token',
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 423,
      message: 'AUTH.LOGIN.ACCOUNT_LOCKED',
      error_code: 'AUTH.LOGIN.ACCOUNT_LOCKED',
      attemptsRemaining: 0,
      loginBlockDuration: 900,
    });
  });

  it('uses a translation key for unexpected login errors while preserving HTTP 200', async () => {
    const response = await handleLogin(new NextRequest('http://localhost/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 500, message: 'INTERNAL_SERVER_ERROR', error_code: 'INTERNAL_SERVER_ERROR',
    });
  });

  it('sets authentication and profile preference cookies after successful login', async () => {
    login.mockResolvedValue({
      success: true,
      status: 200,
      message: 'OK',
      data: { accessToken: 'access-token', refreshToken: 'refresh-token' },
    });
    verifyAccessToken.mockResolvedValue({ sub: 'user-1' });
    findProfileById.mockResolvedValue({
      preferences: { preferredLanguage: 'en', appearance: 'dark' },
    });

    const response = await handleLogin(request({
      email: 'adult@example.test',
      password: 'secret',
      rememberMe: true,
      captchaToken: 'valid-token',
    }, {
      'user-agent': 'qa-browser',
      'x-forwarded-for': '203.0.113.7, 10.0.0.1',
    }));

    expect(response.status).toBe(200);
    expect(login).toHaveBeenCalledWith({
      email: 'adult@example.test',
      password: 'secret',
      rememberMe: true,
      userAgent: 'qa-browser',
      clientIp: '203.0.113.7',
    });
    expect(response.cookies.get('accessToken')?.value).toBe('access-token');
    expect(response.cookies.get('refreshToken')?.value).toBe('refresh-token');
    expect(response.cookies.get('preferredLanguage')?.value).toBe('en');
    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('en');
    expect(response.cookies.get('appearance')?.value).toBe('dark');
  });
});
