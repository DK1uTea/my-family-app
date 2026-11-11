import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { assignForActor, findProfileById } = vi.hoisted(() => ({
  assignForActor: vi.fn(),
  findProfileById: vi.fn(),
}));

vi.mock('@/server/modules/roles', () => ({
  rolesService: { assignForActor },
  UserRole: { ADMIN: 'admin' },
}));
vi.mock('@/server/modules/users', () => ({ usersService: { findProfileById } }));

import { usersController } from '@/app/api/users/users.controller';

const profile = {
  id: 'd5d783e0-b4a4-4c1b-960e-0ba2f65b06b6',
  email: 'adult@example.test',
  firstName: 'Adult',
  lastName: 'Seed',
  avatar: null,
  lastLoginAt: null,
  role: { key: 'adult' },
  preferences: {
    preferredLanguage: 'en',
    appearance: 'dark',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
  },
};

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/test', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('users API controllers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the current profile and sets its locale and appearance cookies', async () => {
    findProfileById.mockResolvedValue(profile);

    const response = await usersController.getMe(
      new NextRequest('http://localhost/api/users/me'),
      profile.id,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 200,
      data: {
        id: profile.id,
        settings: {
          preferredLanguage: 'en',
          appearance: 'dark',
          theme: 'dark',
          currency: 'USD',
          dateFormat: 'MM/dd/yyyy',
        },
      },
    });
    expect('preferredLanguage=en').toContain(
      response.headers.get('set-cookie')?.match(/preferredLanguage=en/)?.[0],
    );
    expect(response.headers.get('set-cookie')).toContain('NEXT_LOCALE=en');
    expect(response.headers.get('set-cookie')).toContain('appearance=dark');
  });

  it('returns 404 when the authenticated profile no longer exists', async () => {
    findProfileById.mockResolvedValue(null);

    const response = await usersController.getMe(
      new NextRequest('http://localhost/api/users/me'),
      profile.id,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ status: 404, message: 'USER_NOT_FOUND', error_code: 'USER_NOT_FOUND' });
  });

  it('rejects malformed role assignment input without calling the service', async () => {
    const response = await usersController.assignRole(
      jsonRequest({ roleKey: '' }),
      'admin-id',
      { params: Promise.resolve({ id: profile.id }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ status: 400, message: 'USER_ROLE_ASSIGNMENT_INVALID', error_code: 'USER_ROLE_ASSIGNMENT_INVALID' });
    expect(assignForActor).not.toHaveBeenCalled();
  });

  it('returns a generic forbidden response for a rejected role assignment', async () => {
    assignForActor.mockResolvedValue('forbidden');

    const response = await usersController.assignRole(
      jsonRequest({ roleKey: 'adult' }),
      profile.id,
      { params: Promise.resolve({ id: profile.id }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      message: 'USER_ROLE_ASSIGNMENT_FORBIDDEN', error_code: 'USER_ROLE_ASSIGNMENT_FORBIDDEN',
    });
    expect(assignForActor).toHaveBeenCalledWith(profile.id, profile.id, 'adult');
  });

  it('returns forbidden when a tenant administrator targets a user outside their tenant', async () => {
    assignForActor.mockResolvedValue('forbidden');

    const response = await usersController.assignRole(
      jsonRequest({ roleKey: 'adult' }),
      'tenant-admin-a',
      { params: Promise.resolve({ id: profile.id }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      message: 'USER_ROLE_ASSIGNMENT_FORBIDDEN', error_code: 'USER_ROLE_ASSIGNMENT_FORBIDDEN',
    });
  });

  it('returns forbidden when a tenant administrator tries to grant super admin', async () => {
    assignForActor.mockResolvedValue('forbidden');

    const response = await usersController.assignRole(
      jsonRequest({ roleKey: 'super_admin' }),
      'tenant-admin-a',
      { params: Promise.resolve({ id: profile.id }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      message: 'USER_ROLE_ASSIGNMENT_FORBIDDEN', error_code: 'USER_ROLE_ASSIGNMENT_FORBIDDEN',
    });
  });

  it('returns 404 when the user or role cannot be assigned', async () => {
    assignForActor.mockResolvedValue('not_found');

    const response = await usersController.assignRole(
      jsonRequest({ roleKey: 'adult' }),
      'admin-id',
      { params: Promise.resolve({ id: profile.id }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ status: 404, message: 'USER_ROLE_ASSIGNMENT_NOT_FOUND', error_code: 'USER_ROLE_ASSIGNMENT_NOT_FOUND' });
    expect(assignForActor).toHaveBeenCalledWith('admin-id', profile.id, 'adult');
  });

  it('assigns a role and returns the established success response', async () => {
    assignForActor.mockResolvedValue('assigned');

    const response = await usersController.assignRole(
      jsonRequest({ roleKey: 'adult' }),
      'admin-id',
      { params: Promise.resolve({ id: profile.id }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 200, message: 'OK' });
    expect(assignForActor).toHaveBeenCalledWith('admin-id', profile.id, 'adult');
  });
});
