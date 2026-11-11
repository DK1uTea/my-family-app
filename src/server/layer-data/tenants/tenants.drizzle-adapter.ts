import "server-only";

import { asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { nowUtc } from "@/lib/date-utils";
import { tenants } from "@/server/drizzle/schema";
import { db } from "@/server/third-party/drizzle/client";
import type { TenantListQuery, TenantPage, TenantRecord } from "./tenants.types";
import type { TenantsRepository } from "./tenants.repository";

function searchCondition(search: string) {
  const value = search.trim();
  return value
    ? or(ilike(tenants.id, `%${value}%`), ilike(tenants.name, `%${value}%`))
    : undefined;
}

export class DrizzleTenantsRepository implements TenantsRepository {
  async list(query: TenantListQuery): Promise<TenantPage> {
    const where = searchCondition(query.search);
    const createdAtOrder = query.sort === "createdAt:asc"
      ? asc(tenants.createdAt)
      : desc(tenants.createdAt);
    const [items, totals] = await Promise.all([
      db.select().from(tenants).where(where)
        .orderBy(createdAtOrder, asc(tenants.id))
        .limit(query.limit).offset((query.page - 1) * query.limit),
      db.select({ total: count() }).from(tenants).where(where),
    ]);

    return {
      items,
      total: totals[0]?.total ?? 0,
      page: query.page,
      limit: query.limit,
    };
  }

  async create(payload: Pick<TenantRecord, "id" | "name" | "description">): Promise<TenantRecord | null> {
    const rows = await db.insert(tenants).values(payload)
      .onConflictDoNothing({ target: tenants.id }).returning();
    return rows[0] ?? null;
  }

  async update(
    id: string,
    payload: Pick<TenantRecord, "name"> & { description?: string | null },
  ): Promise<TenantRecord | null> {
    const rows = await db.update(tenants).set({
      name: payload.name,
      ...(payload.description === undefined ? {} : { description: payload.description }),
      updatedAt: nowUtc(),
    })
      .where(eq(tenants.id, id)).returning();
    return rows[0] ?? null;
  }

  async updateStatus(id: string, isActive: boolean): Promise<TenantRecord | null> {
    const rows = await db.update(tenants).set({ isActive, updatedAt: nowUtc() })
      .where(eq(tenants.id, id)).returning();
    return rows[0] ?? null;
  }
}

export const tenantsRepository = new DrizzleTenantsRepository();
