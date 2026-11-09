import { describe, expect, it, vi } from 'vitest';

const { listPermissions, modulePermissions } = vi.hoisted(() => ({
  listPermissions: vi.fn(),
  modulePermissions: [{ name: 'Event Timeline', key: 'event-timeline', children: [] }],
}));

vi.mock('@/server/modules/roles', () => ({
  rolesService: { listPermissions },
}));

import { permissionsController } from '@/app/api/permissions/permissions.controller';

describe('permissions API controller', () => {
  it('returns the supported permission catalogue', async () => {
    listPermissions.mockReturnValue(modulePermissions);
    const response = await permissionsController.list();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 200,
      message: 'OK',
      data: { permissions: modulePermissions },
    });
    expect(listPermissions).toHaveBeenCalledOnce();
  });
});
