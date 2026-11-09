import { withAuth } from "@/app/api/_shared/require-roles";
import { usersController } from "../users.controller";

export const GET = withAuth(usersController.getMe);
