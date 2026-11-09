import { requireRoles } from "@/app/api/_shared/require-roles";
import { UserRole } from "@/server/modules/roles";
import { rolesController } from "../roles.controller";

export const GET = requireRoles([UserRole.ADMIN])(rolesController.findByKey);
export const PUT = requireRoles([UserRole.ADMIN])(rolesController.update);
