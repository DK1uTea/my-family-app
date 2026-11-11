import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rolesService } from "@/server/modules/roles";
import { apiError } from "@/app/api/_shared/error-response";

type RoleContext = { params: Promise<{ key: string }> };

const createRoleSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9-]{1,49}$/),
  name: z.string().trim().min(1).max(100),
  permissionKeys: z.array(z.string()).max(50),
});

const updateRoleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  permissionKeys: z.array(z.string()).max(50),
});

export const rolesController = {
  async list(): Promise<Response> {
    const roles = await rolesService.list();
    return NextResponse.json({ status: 200, message: "OK", data: { roles } });
  },

  async create(req: NextRequest): Promise<Response> {
    const parsed = createRoleSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return apiError(400, "ROLE_INVALID");
    }
    if (!rolesService.validPermissionKeys(parsed.data.permissionKeys)) {
      return apiError(400, "ROLE_UNKNOWN_PERMISSION");
    }
    const role = await rolesService.create(parsed.data);
    if (!role) {
      return apiError(409, "ROLE_ALREADY_EXISTS");
    }
    return NextResponse.json({ status: 201, message: "Created", data: { role } }, { status: 201 });
  },

  async findByKey(_req: NextRequest, _actorId: string, context: RoleContext): Promise<Response> {
    const { key } = await context.params;
    const role = await rolesService.findByKey(key);
    if (!role) {
      return apiError(404, "ROLE_NOT_FOUND");
    }
    return NextResponse.json({ status: 200, message: "OK", data: { role } });
  },

  async update(req: NextRequest, _actorId: string, context: RoleContext): Promise<Response> {
    const parsed = updateRoleSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return apiError(400, "ROLE_INVALID");
    }
    const { key } = await context.params;
    const result = await rolesService.updateForAdmin(key, parsed.data);
    if (result.kind === "invalid_permissions") {
      return apiError(400, "ROLE_UNKNOWN_PERMISSION");
    }
    if (result.kind === "reserved") {
      return apiError(403, "ROLE_RESERVED");
    }
    if (result.kind === "not_found") {
      return apiError(404, "ROLE_NOT_FOUND");
    }
    return NextResponse.json({ status: 200, message: "OK", data: { role: result.role } });
  },
};
