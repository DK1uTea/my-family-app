import { NextResponse } from "next/server";
import { rolesService } from "@/server/modules/roles";

export const permissionsController = {
  async list(): Promise<Response> {
    const permissions = rolesService.listPermissions();
    return NextResponse.json({
      status: 200,
      message: "OK",
      data: { permissions },
    });
  },
};
