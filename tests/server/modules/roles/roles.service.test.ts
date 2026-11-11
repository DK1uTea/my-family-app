import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolesService } from '@/server/modules/roles/roles.service';
import { UserRole } from '@/server/modules/roles/permissions';
import type { RoleRecord, RolesRepository } from '@/server/layer-data/roles';

vi.mock('server-only', () => ({}));
vi.mock('@/server/layer-data/roles', () => ({ rolesRepository: {} }));

function makeRepository() {
  const roles = new Map<string, RoleRecord>([
    ['admin', {
      key: 'admin', name: 'Admin', permissionKeys: [
        'event-timeline.read', 'event-timeline.create', 'event-timeline.edit', 'event-timeline.delete',
      ],
    }],
    ['super_admin', { key: 'super_admin', name: 'Super Admin', permissionKeys: ['*'] }],
    ['viewer', { key: 'viewer', name: 'Viewer', permissionKeys: ['event-timeline.read'] }],
    ['empty', { key: 'empty', name: 'Empty', permissionKeys: [] }],
  ]);
  const users = new Map<string, string>([
    ['admin-user', 'admin'],
    ['super-admin-user', 'super_admin'],
    ['viewer-user', 'viewer'],
    ['empty-user', 'empty'],
    ['missing-role-user', 'deleted-role'],
  ]);
  const userTenants = new Map<string, string>([
    ['admin-user', 'tenant-a'],
    ['super-admin-user', ''],
    ['viewer-user', 'tenant-a'],
    ['empty-user', 'tenant-a'],
    ['missing-role-user', 'tenant-a'],
  ]);
  const repository: RolesRepository = {
    list: vi.fn(async () => [...roles.values()]),
    findByKey: vi.fn(async (key) => roles.get(key) ?? null),
    findUserRoleKey: vi.fn(async (id) => users.get(id) ?? null),
    findUserTenantId: vi.fn(async (id) => userTenants.get(id) ?? null),
    create: vi.fn(async (role) => { roles.set(role.key, role); return role; }),
    update: vi.fn(async (key, input) => {
      const existing = roles.get(key);
      if (!existing) return null;
      const next = { ...existing, ...input };
      roles.set(key, next);
      return next;
    }),
    assign: vi.fn(async (id, key) => {
      if (!users.has(id)) return false;
      users.set(id, key);
      return true;
    }),
    assignWithinTenant: vi.fn(async (id, tenantId, key) => {
      if (!users.has(id) || userTenants.get(id) !== tenantId) return false;
      users.set(id, key);
      return true;
    }),
  };
  return { repository, roles, users };
}

describe('RolesService module access', () => {
  let setup: ReturnType<typeof makeRepository>;
  let service: RolesService;

  beforeEach(() => {
    setup = makeRepository();
    service = new RolesService(setup.repository);
  });

  it('grants Event Timeline to tenant admin permissions and platform wildcard', async () => {
    await expect(service.canAccess('viewer-user', 'event-timeline')).resolves.toBe(true);
    await expect(service.canAccess('admin-user', 'event-timeline')).resolves.toBe(true);
    await expect(service.canAccess('super-admin-user', 'event-timeline')).resolves.toBe(true);
  });

  it('denies empty, missing, and unrelated role grants', async () => {
    await expect(service.canAccess('empty-user', 'event-timeline')).resolves.toBe(false);
    await expect(service.canAccess('missing-role-user', 'event-timeline')).resolves.toBe(false);
    await expect(service.canAccess('unknown-user', 'event-timeline')).resolves.toBe(false);
    await expect(service.canAccess('viewer-user', 'unrelated-module')).resolves.toBe(false);
  });

  it('recognizes tenant admin by role without granting it platform wildcard status', async () => {
    await expect(service.isAdmin('admin-user')).resolves.toBe(true);
    await expect(service.isAdmin('viewer-user')).resolves.toBe(false);
    await expect(service.isAdmin('super-admin-user')).resolves.toBe(false);
    setup.roles.set('viewer', { key: 'viewer', name: 'Viewer', permissionKeys: ['*'] });
    await expect(service.isAdmin('viewer-user')).resolves.toBe(false);
  });

  it('defines super admin as a separate built-in role', () => {
    expect(UserRole.SUPER_ADMIN).toBe('super_admin');
  });

  it('does not treat a platform super admin as every tenant role', async () => {
    await expect(service.hasAnyRole('super-admin-user', [UserRole.ADULT])).resolves.toBe(false);
  });

  it('rejects unknown permission keys and wildcard grants on new roles', async () => {
    await expect(service.create({ key: 'legacy', name: 'Legacy', permissionKeys: ['event.create'] })).resolves.toBeNull();
    await expect(service.create({ key: 'super', name: 'Super', permissionKeys: ['*'] })).resolves.toBeNull();
    await expect(service.create({ key: 'admin', name: 'Other Admin', permissionKeys: [] })).resolves.toBeNull();
    expect(setup.repository.create).not.toHaveBeenCalled();
  });

  it('deduplicates valid module grants and assigns only existing roles', async () => {
    const role = await service.create({
      key: 'organizer', name: 'Organizer', permissionKeys: ['event-timeline.read', 'event-timeline.read'],
    });
    expect(role?.permissionKeys).toEqual(['event-timeline.read']);
    await expect(service.assign('empty-user', 'organizer')).resolves.toBe(true);
    await expect(service.canAccess('empty-user', 'event-timeline')).resolves.toBe(true);
    await expect(service.assign('empty-user', 'nonexistent')).resolves.toBe(false);
  });
});
