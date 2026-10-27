import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CORE_API_URL } from "@/lib/constant";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  const locale = req.headers.get("x-lang") || "";
  const visitorId = req.headers.get("x-user-identifier") || "";
  const rawToken = cookieStore.get("accessToken")?.value;
  const accessToken = rawToken ? `Bearer ${rawToken}` : "";

  try {
    await fetch(`${CORE_API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken,
        "x-lang": locale,
        "x-user-identifier": visitorId,
      },
      body: JSON.stringify({ token: refreshToken ?? "" }),
    });
  } catch {
    // Best-effort — clear cookies regardless of backend response
  }

  const response = NextResponse.json({ status: 200, message: "OK" });
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
}
