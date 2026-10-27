import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CORE_API_URL } from "@/lib/constant";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const locale = req.headers.get("x-lang");
  const refreshToken = cookieStore.get("refreshToken")?.value || "";

  if (!refreshToken) {
    console.log("[refresh-token] 401 — missing refresh token cookie");
    const nextResponse = NextResponse.json(
      { status: 401, message: "Missing refresh token" },
      { status: 401 },
    );
    nextResponse.cookies.delete("accessToken");
    nextResponse.cookies.delete("refreshToken");
    return nextResponse;
  }

  const response = await fetch(`${CORE_API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-lang": locale || "",
      "x-user-identifier": req.headers.get("x-user-identifier") || "",
      Authorization: refreshToken ? `Bearer ${refreshToken}` : "",
    },
    body: JSON.stringify({ token: refreshToken }),
  });

  const result = await response.json();

  const newAccessToken = result?.data?.accessToken;
  const newRefreshToken = result?.data?.refreshToken;

  if (result?.status !== 200 || !newAccessToken) {
    const nextResponse = NextResponse.json(result, { status: 401 });
    nextResponse.cookies.delete("accessToken");
    nextResponse.cookies.delete("refreshToken");
    return nextResponse;
  }

  const { refreshToken: _refreshToken, ...dataWithoutRefreshToken } =
    result.data;
  const nextResponse = NextResponse.json({
    ...result,
    data: dataWithoutRefreshToken,
  });

  nextResponse.cookies.set("accessToken", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });

  if (newRefreshToken) {
    nextResponse.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return nextResponse;
}
