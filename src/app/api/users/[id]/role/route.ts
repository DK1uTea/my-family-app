import { requireRoles } from "@/app/api/_shared/require-roles";
import { UserRole } from "@/server/modules/roles";
import { usersController } from "../../users.controller";

export const PUT = requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
  usersController.assignRole,
);
