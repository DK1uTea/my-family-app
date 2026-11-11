import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleAcceptInvite } from '@/app/api/auth/_controllers/accept-invite.controller';
import { handleForgotPassword } from '@/app/api/auth/_controllers/forgot-password.controller';
import { handleRegistrationToken } from '@/app/api/auth/_controllers/registration-token.controller';
import { handleVerifyInviteUser } from '@/app/api/auth/_controllers/verify-invite-user.controller';

function request(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('auth proxy controllers', () => {
  it.each([
    ['accept invite', handleAcceptInvite, 'http://localhost/api/auth/accept-invite'],
    ['forgot password', handleForgotPassword, 'http://localhost/api/auth/forgot-password'],
    ['verify invite user', handleVerifyInviteUser, 'http://localhost/api/auth/verify-invite-user'],
  ])('forwards %s payload and preserves the successful response envelope', async (_name, handler, url) => {
    const payload = { email: 'adult@example.test', token: 'invite-token' };
    const result = { status: 201, message: 'Accepted', data: { userId: 'user-1' } };
    const fetchMock = mockFetch(result);

    const response = await handler(request(url, payload, {
      'x-user-identifier': 'visitor-1',
      'x-lang': 'vi',
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'x-user-identifier': 'visitor-1',
        'x-lang': 'vi',
      }),
      body: JSON.stringify(payload),
    }));
  });

  it('preserves a known upstream invite error key in both envelope fields', async () => {
    mockFetch({ status: 422, message: ['INVITATION_EXPIRED'] });

    const response = await handleAcceptInvite(request(
      'http://localhost/api/auth/accept-invite',
      { token: 'expired' },
    ));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      status: 422, message: 'INVITATION_EXPIRED', error_code: 'INVITATION_EXPIRED',
    });
  });

  it('does not send arbitrary upstream English text as a frontend message', async () => {
    mockFetch({ status: 422, message: 'Invite expired' });

    const response = await handleAcceptInvite(request(
      'http://localhost/api/auth/accept-invite',
      { token: 'expired' },
    ));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      status: 422, message: 'UPSTREAM_REQUEST_FAILED', error_code: 'UPSTREAM_REQUEST_FAILED',
    });
  });

  it('issues a registration token from the access token returned by login', async () => {
    const fetchMock = mockFetch({ data: { accessToken: 'avatar-upload-token' } });

    const response = await handleRegistrationToken(request(
      'http://localhost/api/auth/registration-token',
      { email: 'adult@example.test', password: 'secret' },
    ));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ accessToken: 'avatar-upload-token' });
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'adult@example.test', password: 'secret' }),
    }));
  });

  it('returns a translation key when registration token credentials are missing', async () => {
    const response = await handleRegistrationToken(request(
      'http://localhost/api/auth/registration-token', { email: 'adult@example.test' },
    ));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      status: 400,
      message: 'AUTH_REGISTRATION_CREDENTIALS_MISSING',
      error_code: 'AUTH_REGISTRATION_CREDENTIALS_MISSING',
    });
  });
});
