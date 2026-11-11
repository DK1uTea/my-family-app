import { verifyCaptcha } from "@/lib/verify-captcha";
import { type NextRequest, NextResponse } from "next/server";
import { authService, verifyAccessToken } from "@/server/modules/auth";
import { usersService } from "@/server/modules/users";
import { apiError } from "@/app/api/_shared/error-response";

function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken?: string,
  preferredLanguage = "vi",
  appearance = "light",
) {
  const isProd = process.env.NODE_ENV !== "development";

  res.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 15,
  });

  res.cookies.set("preferredLanguage", preferredLanguage, {
    httpOnly: false,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  res.cookies.set("NEXT_LOCALE", preferredLanguage, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10,
  });

  res.cookies.set("appearance", appearance, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  if (refreshToken) {
    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
}

export async function handleLogin(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.email || !body?.password) {
      return apiError(400, "AUTH_LOGIN_MISSING_CREDENTIALS", { transportStatus: 200 });
    }

    const { email, password, rememberMe, captchaToken } = body;

    const isCaptchaValid = await verifyCaptcha(captchaToken ?? "");
    if (!isCaptchaValid) {
      return apiError(400, "AUTH_CAPTCHA_FAILED", { transportStatus: 200 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    const result = await authService.login({
      email,
      password,
      rememberMe,
      userAgent,
      clientIp,
    });

    if (result.success && result.data?.accessToken) {
      const { accessToken, refreshToken } = result.data;
      const payload = await verifyAccessToken(accessToken);
      const user = payload?.sub
        ? await usersService.findProfileById(payload.sub)
        : null;

      const preferredLanguage = user?.preferences?.preferredLanguage ?? "vi";
      const appearance = user?.preferences?.appearance ?? "light";

      const nextResponse = NextResponse.json(
        {
          status: result.status,
          data: result.data,
          message: result.message,
        },
        { status: 200 },
      );

      setAuthCookies(
        nextResponse,
        accessToken,
        refreshToken,
        preferredLanguage,
        appearance,
      );

      return nextResponse;
    }

    return apiError(result.status >= 400 ? result.status : 401,
      result.errorCode ?? "AUTH_LOGIN_FAILED", {
        transportStatus: 200,
        details: {
          ...(result.attemptsRemaining !== undefined
            ? { attemptsRemaining: result.attemptsRemaining }
            : {}),
          ...(result.loginBlockDuration !== undefined
            ? { loginBlockDuration: result.loginBlockDuration }
            : {}),
        },
      });
  } catch (error) {
    console.error("Login error:", error);
    return apiError(500, "INTERNAL_SERVER_ERROR", { transportStatus: 200 });
  }
}
