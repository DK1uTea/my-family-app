import "server-only";
import { randomUUID } from "node:crypto";

import {
  tenantsRepository,
  type TenantListQuery,
  type TenantPage,
  type TenantsRepository,
} from "@/server/layer-data/tenants";

export class TenantsService {
  constructor(private readonly repo: TenantsRepository = tenantsRepository) {}

  list(query: TenantListQuery): Promise<TenantPage> {
    return this.repo.list(query);
  }

  create(payload: { name: string; description: string | null }) {
    const slug = payload.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 13)
      .replace(/-+$/g, "") || "tenant";

    return this.repo.create({ ...payload, id: `${slug}-${randomUUID()}` });
  }

  update(id: string, payload: { name: string; description?: string | null }) {
    return this.repo.update(id, payload);
  }

  activate(id: string) {
    return this.repo.updateStatus(id, true);
  }

  deactivate(id: string) {
    return this.repo.updateStatus(id, false);
  }
}

export const tenantsService = new TenantsService();
