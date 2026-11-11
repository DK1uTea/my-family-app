import 'server-only';

import { and, eq } from 'drizzle-orm';
import { roles, users } from '@/server/drizzle/schema';
import { db } from '@/server/third-party/drizzle/client';
import type { RoleRecord, RolesRepository } from './roles.repository';

export class DrizzleRolesRepository implements RolesRepository {
  async list(): Promise<RoleRecord[]> {
    return db.select({
      key: roles.key,
      name: roles.name,
      permissionKeys: roles.permissionKeys,
    }).from(roles).orderBy(roles.name);
  }

  async findByKey(key: string): Promise<RoleRecord | null> {
    const rows = await db.select({
      key: roles.key,
      name: roles.name,
      permissionKeys: roles.permissionKeys,
    }).from(roles).where(eq(roles.key, key)).limit(1);
    return rows[0] ?? null;
  }

  async findUserRoleKey(userId: string): Promise<string | null> {
    const rows = await db.select({ roleKey: users.roleKey }).from(users)
      .where(eq(users.id, userId)).limit(1);
    return rows[0]?.roleKey ?? null;
  }

  async findUserTenantId(userId: string): Promise<string | null> {
    const rows = await db.select({ tenantId: users.tenantId }).from(users)
      .where(eq(users.id, userId)).limit(1);
    return rows[0]?.tenantId ?? null;
  }

  async create(role: RoleRecord): Promise<RoleRecord | null> {
    const rows = await db.insert(roles).values(role)
      .onConflictDoNothing({ target: roles.key })
      .returning({ key: roles.key, name: roles.name, permissionKeys: roles.permissionKeys });
    return rows[0] ?? null;
  }

  async update(key: string, role: Pick<RoleRecord, 'name' | 'permissionKeys'>): Promise<RoleRecord | null> {
    const rows = await db.update(roles).set(role).where(eq(roles.key, key))
      .returning({ key: roles.key, name: roles.name, permissionKeys: roles.permissionKeys });
    return rows[0] ?? null;
  }

  async assign(userId: string, roleKey: string): Promise<boolean> {
    const rows = await db.update(users).set({ roleKey }).where(eq(users.id, userId))
      .returning({ id: users.id });
    return rows.length > 0;
  }

  async assignWithinTenant(
    userId: string,
    tenantId: string,
    roleKey: string,
  ): Promise<boolean> {
    const rows = await db.update(users).set({ roleKey })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .returning({ id: users.id });
    return rows.length > 0;
  }
}

export const rolesRepository = new DrizzleRolesRepository();
