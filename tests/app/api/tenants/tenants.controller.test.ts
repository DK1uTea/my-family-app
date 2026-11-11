import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create, list, update, activate, deactivate } = vi.hoisted(() => ({
  create: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
}));

vi.mock('@/server/modules/tenants', () => ({
  tenantsService: { create, list, update, activate, deactivate },
}));

import { tenantsController } from '@/app/api/tenants/tenants.controller';

const tenant = {
  id: 'default',
  name: 'Default Tenant',
  description: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function jsonRequest(method: 'POST' | 'PATCH', body: unknown) {
  return new NextRequest('http://localhost/api/tenants', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function tenantContext(id = 'default') {
  return { params: Promise.resolve({ id }) };
}

describe('tenant API controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists tenants with normalized search and shared pagination metadata', async () => {
    const page = { items: [tenant], total: 1, page: 1, limit: 10 };
    list.mockResolvedValue(page);

    const response = await tenantsController.list(
      new NextRequest('http://localhost/api/tenants?search=%20default%20'),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 200,
      message: 'OK',
      data: {
        items: [tenant],
        pagination: {
          total: 1,
          limit: 10,
          page: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });
    expect(list).toHaveBeenCalledWith({
      search: 'default',
      page: 1,
      limit: 10,
      sort: 'createdAt:desc',
    });
  });

  it('passes requested page, limit, and sort to the list service', async () => {
    list.mockResolvedValue({ items: [], total: 0, page: 3, limit: 25 });

    const response = await tenantsController.list(
      new NextRequest(
        'http://localhost/api/tenants?page=3&limit=25&sort=createdAt%3Aasc',
      ),
    );

    expect(response.status).toBe(200);
    expect(list).toHaveBeenCalledWith({
      search: '',
      page: 3,
      limit: 25,
      sort: 'createdAt:asc',
    });
  });

  it('rejects invalid pagination without querying the tenant list', async () => {
    const response = await tenantsController.list(
      new NextRequest('http://localhost/api/tenants?page=0&limit=101'),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      status: 400,
      message: 'TENANT_PAGINATION_INVALID',
      error_code: 'TENANT_PAGINATION_INVALID',
    });
    expect(list).not.toHaveBeenCalled();
  });

  it('rejects unsupported tenant sort formats', async () => {
    const response = await tenantsController.list(
      new NextRequest('http://localhost/api/tenants?sort=name:asc'),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: 'TENANT_SORT_INVALID',
      error_code: 'TENANT_SORT_INVALID',
    });
    expect(list).not.toHaveBeenCalled();
  });

  it('creates a tenant with a trimmed description', async () => {
    const tenantWithDescription = { ...tenant, description: 'Family workspace' };
    create.mockResolvedValue(tenantWithDescription);

    const response = await tenantsController.create(
      jsonRequest('POST', {
        name: ' Default Tenant ',
        description: '  Family workspace  ',
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      data: { tenant: tenantWithDescription },
    });
    expect(create).toHaveBeenCalledWith({
      name: 'Default Tenant',
      description: 'Family workspace',
    });
  });

  it('stores a missing or blank tenant description as null', async () => {
    create.mockResolvedValue(tenant);

    await tenantsController.create(
      jsonRequest('POST', {
        name: 'Default Tenant',
        description: '   ',
      }),
    );

    expect(create).toHaveBeenCalledWith({
      name: 'Default Tenant',
      description: null,
    });
  });

  it('rejects tenant descriptions longer than 500 characters', async () => {
    const response = await tenantsController.create(
      jsonRequest('POST', {
        name: 'Default Tenant',
        description: 'x'.repeat(501),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      status: 400,
      message: 'TENANT_INVALID',
      error_code: 'TENANT_INVALID',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a client-supplied tenant ID', async () => {
    const response = await tenantsController.create(
      jsonRequest('POST', {
        id: 'custom-id',
        name: 'Other',
      }),
    );

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('returns conflict when a generated tenant ID collides', async () => {
    create.mockResolvedValue(null);

    const response = await tenantsController.create(
      jsonRequest('POST', { name: 'Default Tenant' }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      message: 'TENANT_ID_EXISTS',
      error_code: 'TENANT_ID_EXISTS',
    });
  });

  it('updates tenant name and description', async () => {
    const updatedTenant = {
      ...tenant,
      name: 'Renamed',
      description: 'Updated description',
    };
    update.mockResolvedValue(updatedTenant);

    const response = await tenantsController.update(
      jsonRequest('PATCH', {
        name: ' Renamed ',
        description: ' Updated description ',
      }),
      'super-admin-id',
      tenantContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: { tenant: updatedTenant },
    });
    expect(update).toHaveBeenCalledWith('default', {
      name: 'Renamed',
      description: 'Updated description',
    });
  });

  it('leaves description unchanged when it is omitted from an update payload', async () => {
    update.mockResolvedValue(tenant);

    await tenantsController.update(
      jsonRequest('PATCH', { name: 'Renamed' }),
      'super-admin-id',
      tenantContext(),
    );

    expect(update).toHaveBeenCalledWith('default', { name: 'Renamed' });
  });

  it('returns not found when updating an unknown tenant', async () => {
    update.mockResolvedValue(null);

    const response = await tenantsController.update(
      jsonRequest('PATCH', { name: 'Renamed' }),
      'super-admin-id',
      tenantContext('missing'),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      status: 404,
      message: 'TENANT_NOT_FOUND',
      error_code: 'TENANT_NOT_FOUND',
    });
  });

  it('activates a tenant without requiring a request payload', async () => {
    activate.mockResolvedValue(tenant);

    const response = await tenantsController.activate(
      new NextRequest('http://localhost/api/tenants/default/activate'),
      'super-admin-id',
      tenantContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: { tenant },
    });
    expect(activate).toHaveBeenCalledWith('default');
  });

  it('deactivates a tenant without requiring a request payload', async () => {
    const inactiveTenant = { ...tenant, isActive: false };
    deactivate.mockResolvedValue(inactiveTenant);

    const response = await tenantsController.deactivate(
      new NextRequest('http://localhost/api/tenants/default/deactivate'),
      'super-admin-id',
      tenantContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: { tenant: inactiveTenant },
    });
    expect(deactivate).toHaveBeenCalledWith('default');
  });
});
