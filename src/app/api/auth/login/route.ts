import { CORE_API_URL } from "@/lib/constant";
import { verifyCaptcha } from "@/lib/verify-captcha";
import { type NextRequest, NextResponse } from "next/server";

function normalizeLocale(locale: unknown) {
  if (typeof locale !== "string") return "de";
  const normalized = locale.toLowerCase();
  return normalized === "en" || normalized === "de" ? normalized : "de";
}

function normalizeAppearance(appearance: unknown) {
  if (typeof appearance !== "string") return "light";
  const normalized = appearance.toLowerCase();
  return normalized === "dark" || normalized === "light" ? normalized : "light";
}

type LoginResponse = {
  status: number;
  message: string;
  data: {
    accessToken?: string;
    refreshToken?: string;
    attemptsRemaining?: number;
  };
  errors?: { attemptsRemaining?: number; loginBlockDuration?: number }[];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body) {
      return NextResponse.json(
        { status: 400, message: ["Email and Password are required"] },
        { status: 200 },
      );
    }

    const { email, password, rememberMe, captchaToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { status: 400, message: ["Email and Password are required"] },
        { status: 200 },
      );
    }

    const isCaptchaValid = await verifyCaptcha(captchaToken ?? "");
    if (!isCaptchaValid) {
      return NextResponse.json(
        { status: 400, message: ["Captcha verification failed"] },
        { status: 200 },
      );
    }

    const visitorId = req.headers.get("x-user-identifier");
    const locale = req.headers.get("x-lang");
    const userAgent = req.headers.get("user-agent") || "";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    const response = await fetch(`${CORE_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-identifier": visitorId || "",
        "x-lang": locale || "",
        "user-agent": userAgent,
        "x-forwarded-for": clientIp,
      },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const result = (await response.json()) as LoginResponse;

    const statusCode = result?.status ?? response.status;
    const errorMessage = result?.message;
    const accessToken = result?.data?.accessToken;
    const refreshToken = result?.data?.refreshToken;
    const attemptsRemaining =
      result?.data?.attemptsRemaining ?? result?.errors?.[0]?.attemptsRemaining;
    const loginBlockDuration = result?.errors?.[0]?.loginBlockDuration;

    // Wrong password — backend returns 200 with attemptsRemaining instead of accessToken
    if (statusCode === 200 && !accessToken && attemptsRemaining !== undefined) {
      return NextResponse.json(
        { status: 401, error_code: "WRONG_PASSWORD", attemptsRemaining },
        { status: 200 },
      );
    }

    if (statusCode === 200 || statusCode === 203) {
      if (!accessToken) {
        return NextResponse.json(
          { status: 400, message: ["Tokens are required"] },
          { status: 200 },
        );
      }

      let preferredLanguage = "de";
      let appearance = "light";

      try {
        const meResponse = await fetch(`${CORE_API_URL}/user/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-user-identifier": visitorId || "",
            "x-lang": locale || "",
          },
        });
        const me = await meResponse.json();
        preferredLanguage = normalizeLocale(
          me?.data?.settings?.preferredLanguage,
        );
        appearance = normalizeAppearance(
          me?.data?.settings?.appearance ?? me?.data?.settings?.theme,
        );
      } catch {
        // Non-fatal — login still succeeds with default locale and appearance
      }

      const nextResponse = NextResponse.json(
        {
          status: statusCode,
          data: result.data,
          message: errorMessage,
        },
        { status: 200 },
      );

      nextResponse.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 15,
      });

      nextResponse.cookies.set("preferredLanguage", preferredLanguage, {
        httpOnly: false,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });

      nextResponse.cookies.set("NEXT_LOCALE", preferredLanguage, {
        httpOnly: false,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 10,
      });

      nextResponse.cookies.set("appearance", appearance, {
        httpOnly: false,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });

      if (refreshToken) {
        nextResponse.cookies.set("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }

      return nextResponse;
    }

    // Pass backend error code directly — interceptor maps it to a localized toast via getErrorMessage()
    return NextResponse.json(
      {
        status: statusCode >= 400 ? statusCode : 401,
        error_code: errorMessage,
        ...(attemptsRemaining !== undefined ? { attemptsRemaining } : {}),
        ...(loginBlockDuration !== undefined ? { loginBlockDuration } : {}),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { status: 500, message: ["Internal Server Error"] },
      { status: 200 },
    );
  }
}
