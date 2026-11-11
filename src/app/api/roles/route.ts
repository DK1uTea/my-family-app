import { requireRoles } from "@/app/api/_shared/require-roles";
import { UserRole } from "@/server/modules/roles";
import { rolesController } from "./roles.controller";

export const GET = requireRoles([UserRole.SUPER_ADMIN])(rolesController.list);
export const POST = requireRoles([UserRole.SUPER_ADMIN])(rolesController.create);
