import "server-only";

import type { TenantListQuery, TenantPage, TenantRecord } from "./tenants.types";

export interface TenantsRepository {
  list(query: TenantListQuery): Promise<TenantPage>;
  create(payload: Pick<TenantRecord, "id" | "name" | "description">): Promise<TenantRecord | null>;
  update(
    id: string,
    payload: Pick<TenantRecord, "name"> & { description?: string | null },
  ): Promise<TenantRecord | null>;
  updateStatus(id: string, isActive: boolean): Promise<TenantRecord | null>;
}
