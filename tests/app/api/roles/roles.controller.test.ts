import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create, findByKey, list, updateForAdmin, validPermissionKeys } = vi.hoisted(() => ({
  create: vi.fn(),
  findByKey: vi.fn(),
  list: vi.fn(),
  updateForAdmin: vi.fn(),
  validPermissionKeys: vi.fn(),
}));

vi.mock('@/server/modules/roles', () => ({
  rolesService: { create, findByKey, list, updateForAdmin, validPermissionKeys },
  UserRole: { ADMIN: 'admin' },
}));

import { rolesController } from '@/app/api/roles/roles.controller';

function jsonRequest(method: 'POST' | 'PUT', body: unknown) {
  return new NextRequest('http://localhost/api/roles', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('roles API controllers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the available roles', async () => {
    const roles = [{ key: 'adult', name: 'Adult' }];
    list.mockResolvedValue(roles);

    const response = await rolesController.list();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 200,
      message: 'OK',
      data: { roles },
    });
  });

  it('rejects invalid role creation input without calling the service', async () => {
    const response = await rolesController.create(
      jsonRequest('POST', { key: 'INVALID KEY', name: '', permissionKeys: [] }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ message: 'ROLE_INVALID', error_code: 'ROLE_INVALID' });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects unknown permissions when creating a role', async () => {
    validPermissionKeys.mockReturnValue(false);

    const response = await rolesController.create(
      jsonRequest('POST', { key: 'adult', name: 'Adult', permissionKeys: ['unknown'] }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ message: 'ROLE_UNKNOWN_PERMISSION', error_code: 'ROLE_UNKNOWN_PERMISSION' });
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a valid role and returns 201', async () => {
    const role = { key: 'adult', name: 'Adult', permissionKeys: [] };
    validPermissionKeys.mockReturnValue(true);
    create.mockResolvedValue(role);

    const response = await rolesController.create(
      jsonRequest('POST', role),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      status: 201,
      message: 'Created',
      data: { role },
    });
    expect(create).toHaveBeenCalledWith(role);
  });

  it('returns 409 when a role cannot be created because its key is reserved or taken', async () => {
    validPermissionKeys.mockReturnValue(true);
    create.mockResolvedValue(null);

    const response = await rolesController.create(
      jsonRequest('POST', { key: 'adult', name: 'Adult', permissionKeys: [] }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      message: 'ROLE_ALREADY_EXISTS', error_code: 'ROLE_ALREADY_EXISTS',
    });
  });

  it('returns 404 when a requested role does not exist', async () => {
    findByKey.mockResolvedValue(null);

    const response = await rolesController.findByKey(
      new NextRequest('http://localhost/api/roles/missing'),
      'admin-id',
      { params: Promise.resolve({ key: 'missing' }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ status: 404, message: 'ROLE_NOT_FOUND', error_code: 'ROLE_NOT_FOUND' });
  });

  it('returns the established 404 response when a role update target is missing', async () => {
    updateForAdmin.mockResolvedValue({ kind: 'not_found' });

    const response = await rolesController.update(
      jsonRequest('PUT', { name: 'Adult', permissionKeys: [] }),
      'admin-id',
      { params: Promise.resolve({ key: 'missing' }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ status: 404, message: 'ROLE_NOT_FOUND', error_code: 'ROLE_NOT_FOUND' });
  });

  it('rejects role updates with unknown permissions', async () => {
    updateForAdmin.mockResolvedValue({ kind: 'invalid_permissions' });

    const response = await rolesController.update(
      jsonRequest('PUT', { name: 'Adult', permissionKeys: ['unknown'] }),
      'admin-id',
      { params: Promise.resolve({ key: 'adult' }) },
    );

    expect(response.status).toBe(400);
    expect(updateForAdmin).toHaveBeenCalledWith('adult', {
      name: 'Adult',
      permissionKeys: ['unknown'],
    });
  });

  it('prevents editing the reserved administrator role', async () => {
    updateForAdmin.mockResolvedValue({ kind: 'reserved' });

    const response = await rolesController.update(
      jsonRequest('PUT', { name: 'Administrator', permissionKeys: [] }),
      'admin-id',
      { params: Promise.resolve({ key: 'admin' }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      status: 403,
      message: 'ROLE_RESERVED',
      error_code: 'ROLE_RESERVED',
    });
    expect(updateForAdmin).toHaveBeenCalledWith('admin', {
      name: 'Administrator',
      permissionKeys: [],
    });
  });
});
