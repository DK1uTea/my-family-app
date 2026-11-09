import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rolesService } from "@/server/modules/roles";
import { usersService } from "@/server/modules/users";

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
      return NextResponse.json({ status: 404, message: "User not found" }, { status: 404 });
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
      return NextResponse.json({ status: 400, message: "Invalid role assignment" }, { status: 400 });
    }
    const result = await rolesService.assignForActor(actorId, id, parsed.data.roleKey);
    if (result === "forbidden") {
      return NextResponse.json({ status: 403, message: "Cannot remove own admin role" }, { status: 403 });
    }
    if (result === "not_found") {
      return NextResponse.json({ status: 404, message: "User or role not found" }, { status: 404 });
    }
    return NextResponse.json({ status: 200, message: "OK" });
  },
};
