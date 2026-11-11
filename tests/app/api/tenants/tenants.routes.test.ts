import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  hasAnyRole,
  requireAuthenticated,
  create,
  list,
  update,
  activate,
  deactivate,
} = vi.hoisted(() => ({
  hasAnyRole: vi.fn(),
  requireAuthenticated: vi.fn(),
  create: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
}));

vi.mock('@/app/api/_shared/require-authenticated', () => ({
  requireAuthenticated,
}));
vi.mock('@/server/modules/roles', () => ({
  rolesService: { hasAnyRole, canAccessAnyPermission: vi.fn() },
  UserRole: { SUPER_ADMIN: 'super_admin' },
}));
vi.mock('@/server/modules/tenants', () => ({
  tenantsService: { create, list, update, activate, deactivate },
}));

import { PATCH as updateTenant } from '@/app/api/tenants/[id]/route';
import { PATCH as activateTenant } from '@/app/api/tenants/[id]/activate/route';
import { PATCH as deactivateTenant } from '@/app/api/tenants/[id]/deactivate/route';
import { GET, POST } from '@/app/api/tenants/route';

const context = { params: Promise.resolve({ id: 'tenant-a' }) };

describe('tenant management route authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticated.mockResolvedValue({
      userId: 'actor-1',
      email: 'actor@example.test',
      roleKey: 'admin',
      tenantId: 'tenant-a',
    });
    hasAnyRole.mockResolvedValue(false);
  });

  it('denies tenant admins all tenant-management methods', async () => {
    const getResponse = await GET(
      new NextRequest('http://localhost/api/tenants'),
      undefined,
    );
    const createResponse = await POST(
      new NextRequest('http://localhost/api/tenants', {
        method: 'POST',
        body: JSON.stringify({ id: 'tenant-b', name: 'Tenant B' }),
      }),
      undefined,
    );
    const updateResponse = await updateTenant(
      new NextRequest('http://localhost/api/tenants/tenant-a', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      }),
      context,
    );
    const activateResponse = await activateTenant(
      new NextRequest('http://localhost/api/tenants/tenant-a/activate', {
        method: 'PATCH',
      }),
      context,
    );
    const deactivateResponse = await deactivateTenant(
      new NextRequest('http://localhost/api/tenants/tenant-a/deactivate', {
        method: 'PATCH',
      }),
      context,
    );

    expect([
      getResponse.status,
      createResponse.status,
      updateResponse.status,
      activateResponse.status,
      deactivateResponse.status,
    ]).toEqual([403, 403, 403, 403, 403]);
    expect(hasAnyRole).toHaveBeenCalledTimes(5);
    expect(hasAnyRole).toHaveBeenCalledWith('actor-1', ['super_admin']);
    expect(list).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(activate).not.toHaveBeenCalled();
    expect(deactivate).not.toHaveBeenCalled();
  });

  it('allows a super admin through the tenant list route', async () => {
    requireAuthenticated.mockResolvedValue({
      userId: 'platform-admin',
      email: 'root@example.test',
      roleKey: 'super_admin',
      tenantId: null,
    });
    hasAnyRole.mockResolvedValue(true);
    list.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });

    const response = await GET(
      new NextRequest('http://localhost/api/tenants'),
      undefined,
    );

    expect(response.status).toBe(200);
    expect(hasAnyRole).toHaveBeenCalledWith('platform-admin', ['super_admin']);
  });
});
