import { CORE_API_URL } from "@/lib/constant";
import { type NextRequest, NextResponse } from "next/server";

type LoginResponse = {
  status: number;
  data: { accessToken?: string };
};

// Internal-only route: issues a short-lived token after registration for avatar upload.
// No captcha — caller must be trusted (immediately after accept-invite).
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing credentials" }, { status: 400 });
    }

    const response = await fetch(`${CORE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = (await response.json()) as LoginResponse;
    const accessToken = result?.data?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ message: "Login failed" }, { status: 401 });
    }

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("Registration token error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
