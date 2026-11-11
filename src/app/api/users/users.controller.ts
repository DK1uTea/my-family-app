import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rolesService } from "@/server/modules/roles";
import { usersService } from "@/server/modules/users";
import { apiError } from "@/app/api/_shared/error-response";

type RoleContext = { params: Promise<{ id: string }> };

function setPreferenceCookies(
  res: NextResponse,
  locale: string,
  appearance: string,
) {
  res.cookies.set("preferredLanguage", locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  res.cookies.set("NEXT_LOCALE", locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10,
  });
  res.cookies.set("appearance", appearance, {
    httpOnly: false,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export const usersController = {
  async getMe(_req: NextRequest, userId: string): Promise<Response> {
    const user = await usersService.findProfileById(userId);
    if (!user) {
      return apiError(404, "USER_NOT_FOUND");
    }

    const preferredLanguage = user.preferences.preferredLanguage ?? "vi";
    const appearance = user.preferences.appearance ?? "light";
    const response = NextResponse.json(
      {
        status: 200,
        message: "OK",
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          lastLoginAt: user.lastLoginAt,
          role: user.role,
          tenant: user.tenant,
          settings: {
            preferredLanguage,
            appearance,
            theme: appearance,
            currency: user.preferences.currency,
            dateFormat: user.preferences.dateFormat,
          },
        },
      },
      { status: 200 },
    );
    setPreferenceCookies(response, preferredLanguage, appearance);
    return response;
  },

  async assignRole(
    req: NextRequest,
    actorId: string,
    context: RoleContext,
  ): Promise<Response> {
    const parsed = z.object({ roleKey: z.string().min(1) })
      .safeParse(await req.json().catch(() => null));
    const { id } = await context.params;
    if (!parsed.success || !z.uuid().safeParse(id).success) {
      return apiError(400, "USER_ROLE_ASSIGNMENT_INVALID");
    }
    const result = await rolesService.assignForActor(actorId, id, parsed.data.roleKey);
    if (result === "forbidden") {
      return apiError(403, "USER_ROLE_ASSIGNMENT_FORBIDDEN");
    }
    if (result === "not_found") {
      return apiError(404, "USER_ROLE_ASSIGNMENT_NOT_FOUND");
    }
    return NextResponse.json({ status: 200, message: "OK" });
  },
};
