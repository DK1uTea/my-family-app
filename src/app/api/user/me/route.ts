import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/server/modules/auth";
import { usersService } from "@/server/modules/users";

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

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("accessToken")?.value;
  const authHeader = req.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  const accessToken = tokenFromCookie ?? tokenFromHeader;

  if (!accessToken) {
    return NextResponse.json(
      { status: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const payload = await verifyAccessToken(accessToken);
  if (!payload?.sub) {
    return NextResponse.json(
      { status: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const user = await usersService.findProfileById(payload.sub);
  if (!user) {
    return NextResponse.json(
      { status: 404, message: "User not found" },
      { status: 404 },
    );
  }

  const preferredLanguage = user.preferences.preferredLanguage ?? "de";
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
        permissions: user.permissions,
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
}

