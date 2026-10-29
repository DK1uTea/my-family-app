import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authService } from "@/server/modules/auth";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value || "";

  if (!refreshToken) {
    const nextResponse = NextResponse.json(
      { status: 401, message: "Missing refresh token" },
      { status: 401 },
    );
    nextResponse.cookies.delete("accessToken");
    nextResponse.cookies.delete("refreshToken");
    return nextResponse;
  }

  const result = await authService.refresh(refreshToken);

  const newAccessToken = result.data?.accessToken;
  const newRefreshToken = result.data?.refreshToken;

  if (!result.success || !newAccessToken) {
    const nextResponse = NextResponse.json(
      { status: 401, message: result.message || "Failed to refresh token" },
      { status: 401 },
    );
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
