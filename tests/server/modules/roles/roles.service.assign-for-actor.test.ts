import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolesService } from '@/server/modules/roles/roles.service';
import type { RoleRecord, RolesRepository } from '@/server/layer-data/roles';

vi.mock('server-only', () => ({}));
vi.mock('@/server/layer-data/roles', () => ({ rolesRepository: {} }));

function setupService() {
  const roles = new Map<string, RoleRecord>([
    ['admin', { key: 'admin', name: 'Admin', permissionKeys: ['*'] }],
    ['adult', { key: 'adult', name: 'Adult', permissionKeys: [] }],
  ]);
  const users = new Map<string, string>([
    ['admin-user', 'admin'],
    ['adult-user', 'adult'],
  ]);
  const repository: RolesRepository = {
    list: vi.fn(async () => [...roles.values()]),
    findByKey: vi.fn(async (key) => roles.get(key) ?? null),
    findUserRoleKey: vi.fn(async (userId) => users.get(userId) ?? null),
    create: vi.fn(async (role) => { roles.set(role.key, role); return role; }),
    update: vi.fn(async () => null),
    assign: vi.fn(async (userId, roleKey) => {
      if (!users.has(userId)) return false;
      users.set(userId, roleKey);
      return true;
    }),
  };
  return { service: new RolesService(repository), repository, users };
}

describe('RolesService.assignForActor', () => {
  let setup: ReturnType<typeof setupService>;

  beforeEach(() => {
    setup = setupService();
  });

  it('forbids an administrator from removing their own admin role', async () => {
    await expect(setup.service.assignForActor('admin-user', 'admin-user', 'adult'))
      .resolves.toBe('forbidden');
    expect(setup.repository.assign).not.toHaveBeenCalled();
  });

  it('allows an administrator to keep their own admin role', async () => {
    await expect(setup.service.assignForActor('admin-user', 'admin-user', 'admin'))
      .resolves.toBe('assigned');
    expect(setup.users.get('admin-user')).toBe('admin');
  });

  it('assigns a valid role to another existing user', async () => {
    await expect(setup.service.assignForActor('admin-user', 'adult-user', 'admin'))
      .resolves.toBe('assigned');
    expect(setup.users.get('adult-user')).toBe('admin');
  });

  it('returns not_found when the user or role does not exist', async () => {
    await expect(setup.service.assignForActor('admin-user', 'missing-user', 'adult'))
      .resolves.toBe('not_found');
    await expect(setup.service.assignForActor('admin-user', 'adult-user', 'missing-role'))
      .resolves.toBe('not_found');
  });
});
