import { requireRoles } from "@/app/api/_shared/require-roles";
import { UserRole } from "@/server/modules/roles";
import { tenantsController } from "../tenants.controller";

type Context = { params: Promise<{ id: string }> };

export const PATCH = requireRoles([UserRole.SUPER_ADMIN])<Context>(
  tenantsController.update,
);
