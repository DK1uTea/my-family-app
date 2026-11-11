import 'server-only';

export type RoleRecord = { key: string; name: string; permissionKeys: string[] };

export interface RolesRepository {
  list(): Promise<RoleRecord[]>;
  findByKey(key: string): Promise<RoleRecord | null>;
  findUserRoleKey(userId: string): Promise<string | null>;
  findUserTenantId(userId: string): Promise<string | null>;
  create(role: RoleRecord): Promise<RoleRecord | null>;
  update(key: string, role: Pick<RoleRecord, 'name' | 'permissionKeys'>): Promise<RoleRecord | null>;
  assign(userId: string, roleKey: string): Promise<boolean>;
  assignWithinTenant(userId: string, tenantId: string, roleKey: string): Promise<boolean>;
}
