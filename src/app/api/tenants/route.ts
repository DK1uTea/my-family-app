import { requireRoles } from "@/app/api/_shared/require-roles";
import { UserRole } from "@/server/modules/roles";
import { tenantsController } from "./tenants.controller";

export const GET = requireRoles([UserRole.SUPER_ADMIN])(tenantsController.list);
export const POST = requireRoles([UserRole.SUPER_ADMIN])(tenantsController.create);
