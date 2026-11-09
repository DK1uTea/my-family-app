import 'server-only';

import {
  rolesRepository,
  type RoleRecord,
  type RolesRepository,
} from '@/server/layer-data/roles';
import {
  hasModuleAccess,
  hasPermission,
  MODULE_PERMISSIONS,
  PERMISSION_ALL_WILDCARD,
  PERMISSION_KEYS,
  UserRole,
  type UserRole as UserRoleType,
} from './permissions';

export type RoleInput = { key: string; name: string; permissionKeys: string[] };
export type RoleAssignmentResult = "assigned" | "forbidden" | "not_found";
export type RoleUpdateResult =
  | { kind: "updated"; role: RoleRecord }
  | { kind: "invalid_permissions" }
  | { kind: "reserved" }
  | { kind: "not_found" };

export class RolesService {
  constructor(private readonly repo: RolesRepository = rolesRepository) {}

  async isAdmin(userId: string): Promise<boolean> {
    const role = await this.findUserRole(userId);
    return role?.key === UserRole.ADMIN
      && Array.isArray(role.permissionKeys)
      && role.permissionKeys.includes(PERMISSION_ALL_WILDCARD);
  }

  async hasAnyRole(userId: string, requiredRoles: readonly UserRoleType[]): Promise<boolean> {
    const role = await this.findUserRole(userId);
    if (!role || !Array.isArray(role.permissionKeys)) return false;
    if (role.key === UserRole.ADMIN && role.permissionKeys.includes(PERMISSION_ALL_WILDCARD)) {
      return true;
    }
    return requiredRoles.includes(role.key as UserRoleType);
  }

  async canAccess(userId: string, moduleKey: string): Promise<boolean> {
    const role = await this.findUserRole(userId);
    return Array.isArray(role?.permissionKeys)
      ? hasModuleAccess(role.permissionKeys, moduleKey)
      : false;
  }

  async canAccessPermission(userId: string, permissionKey: string): Promise<boolean> {
    const role = await this.findUserRole(userId);
    return Array.isArray(role?.permissionKeys)
      ? hasPermission(role.permissionKeys, permissionKey)
      : false;
  }

  async canAccessAnyPermission(userId: string, permissionKeys: readonly string[]): Promise<boolean> {
    const role = await this.findUserRole(userId);
    return Array.isArray(role?.permissionKeys)
      && (role.permissionKeys.includes(PERMISSION_ALL_WILDCARD)
        || permissionKeys.some((key) => role.permissionKeys.includes(key)));
  }

  list(): Promise<RoleRecord[]> {
    return this.repo.list();
  }

  listPermissions() {
    return MODULE_PERMISSIONS;
  }

  findByKey(key: string): Promise<RoleRecord | null> {
    return this.repo.findByKey(key);
  }

  validPermissionKeys(keys: string[]): boolean {
    return keys.every((key) => PERMISSION_KEYS.includes(key as (typeof PERMISSION_KEYS)[number]));
  }

  async create(input: RoleInput): Promise<RoleRecord | null> {
    if (input.key === UserRole.ADMIN || !this.validPermissionKeys(input.permissionKeys)) return null;
    if (await this.repo.findByKey(input.key)) return null;
    return this.repo.create({
      ...input,
      permissionKeys: [...new Set(input.permissionKeys)],
    });
  }

  async update(
    key: string,
    input: Pick<RoleInput, 'name' | 'permissionKeys'>,
  ): Promise<RoleRecord | null> {
    if (key === UserRole.ADMIN || !this.validPermissionKeys(input.permissionKeys)) return null;
    return this.repo.update(key, {
      ...input,
      permissionKeys: [...new Set(input.permissionKeys)],
    });
  }

  async updateForAdmin(
    key: string,
    input: Pick<RoleInput, "name" | "permissionKeys">,
  ): Promise<RoleUpdateResult> {
    if (!this.validPermissionKeys(input.permissionKeys)) {
      return { kind: "invalid_permissions" };
    }
    if (key === UserRole.ADMIN) return { kind: "reserved" };
    const role = await this.update(key, input);
    return role ? { kind: "updated", role } : { kind: "not_found" };
  }

  async assign(userId: string, roleKey: string): Promise<boolean> {
    if (!await this.repo.findByKey(roleKey)) return false;
    return this.repo.assign(userId, roleKey);
  }

  async assignForActor(
    actorId: string,
    targetUserId: string,
    roleKey: string,
  ): Promise<RoleAssignmentResult> {
    if (actorId === targetUserId && roleKey !== UserRole.ADMIN) return "forbidden";
    if (!await this.repo.findByKey(roleKey)) return "not_found";
    return await this.repo.assign(targetUserId, roleKey) ? "assigned" : "not_found";
  }

  private async findUserRole(userId: string): Promise<RoleRecord | null> {
    const roleKey = await this.repo.findUserRoleKey(userId);
    return roleKey ? this.repo.findByKey(roleKey) : null;
  }
}

export const rolesService = new RolesService();
