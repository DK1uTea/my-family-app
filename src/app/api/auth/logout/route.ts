import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authService } from "@/server/modules/auth";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  try {
    await authService.logout(refreshToken);
  } catch {
    // Best-effort — clear cookies regardless of errors
  }

  const response = NextResponse.json({ status: 200, message: "OK" });
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
}
