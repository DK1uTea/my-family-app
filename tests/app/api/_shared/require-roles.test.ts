import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { canAccessAnyPermission, hasAnyRole, requireAuthenticated } = vi.hoisted(() => ({
  canAccessAnyPermission: vi.fn(),
  hasAnyRole: vi.fn(),
  requireAuthenticated: vi.fn(),
}));

vi.mock('@/app/api/_shared/require-authenticated', () => ({ requireAuthenticated }));
vi.mock('@/server/modules/roles', () => ({
  rolesService: { canAccessAnyPermission, hasAnyRole },
  UserRole: { ADMIN: 'admin' },
}));

import { requireRoles } from '@/app/api/_shared/require-roles';

describe('requireRoles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the authentication response without calling the handler', async () => {
    const unauthorized = NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 });
    requireAuthenticated.mockResolvedValue(unauthorized);
    const handler = vi.fn();

    const response = await requireRoles(['admin'])(handler)(
      new NextRequest('http://localhost/api/roles'),
      undefined,
    );

    expect(response).toBe(unauthorized);
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 403 when the authenticated user lacks the required role', async () => {
    requireAuthenticated.mockResolvedValue('user-1');
    hasAnyRole.mockResolvedValue(false);
    const handler = vi.fn();

    const response = await requireRoles(['admin'])(handler)(
      new NextRequest('http://localhost/api/roles'),
      undefined,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ status: 403, message: 'Forbidden' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls the controller with the authenticated actor when the role is allowed', async () => {
    requireAuthenticated.mockResolvedValue('admin-1');
    hasAnyRole.mockResolvedValue(true);
    const expected = NextResponse.json({ status: 200 });
    const handler = vi.fn().mockResolvedValue(expected);
    const req = new NextRequest('http://localhost/api/roles');
    const context = { params: Promise.resolve({}) };

    const response = await requireRoles(['admin'])(handler)(req, context);

    expect(response).toBe(expected);
    expect(handler).toHaveBeenCalledWith(req, 'admin-1', context);
  });
});
