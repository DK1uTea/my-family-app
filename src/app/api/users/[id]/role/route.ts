import { requireRoles } from "@/app/api/_shared/require-roles";
import { UserRole } from "@/server/modules/roles";
import { usersController } from "../../users.controller";

export const PUT = requireRoles([UserRole.ADMIN])(usersController.assignRole);
