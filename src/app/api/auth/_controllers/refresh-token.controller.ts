import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authService } from "@/server/modules/auth";
import { apiError } from "@/app/api/_shared/error-response";

export async function handleRefreshToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value || "";

  if (!refreshToken) {
    const nextResponse = apiError(401, "AUTH_REFRESH_TOKEN_MISSING");
    nextResponse.cookies.delete("accessToken");
    nextResponse.cookies.delete("refreshToken");
    return nextResponse;
  }

  const result = await authService.refresh(refreshToken);

  const newAccessToken = result.data?.accessToken;
  const newRefreshToken = result.data?.refreshToken;

  if (!result.success || !newAccessToken) {
    const nextResponse = apiError(401, result.message || "AUTH_REFRESH_TOKEN_INVALID");
    nextResponse.cookies.delete("accessToken");
    nextResponse.cookies.delete("refreshToken");
    return nextResponse;
  }

  const isProd = process.env.NODE_ENV !== "development";
  const nextResponse = NextResponse.json({
    status: 200,
    message: "OK",
    data: {
      accessToken: newAccessToken,
    },
  });

  nextResponse.cookies.set("accessToken", newAccessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });

  if (newRefreshToken) {
    nextResponse.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return nextResponse;
}
