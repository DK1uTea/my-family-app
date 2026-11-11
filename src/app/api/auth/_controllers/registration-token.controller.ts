import { API_URL } from "@/lib/constant";
import { type NextRequest, NextResponse } from "next/server";
import { apiError } from "@/app/api/_shared/error-response";

type LoginResponse = {
  status: number;
  data: { accessToken?: string };
};

// Internal-only route: issues a short-lived token after registration for avatar upload.
// No captcha — caller must be trusted (immediately after accept-invite).
export async function handleRegistrationToken(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return apiError(400, "AUTH_REGISTRATION_CREDENTIALS_MISSING");
    }

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = (await response.json()) as LoginResponse;
    const accessToken = result?.data?.accessToken;

    if (!accessToken) {
      return apiError(401, "AUTH_LOGIN_INVALID_CREDENTIALS");
    }

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("Registration token error:", error);
    return apiError(500, "INTERNAL_SERVER_ERROR");
  }
}
