import { requireRoles } from "@/app/api/_shared/require-roles";
import { UserRole } from "@/server/modules/roles";
import { permissionsController } from "./permissions.controller";

export const GET = requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
  permissionsController.list,
);
