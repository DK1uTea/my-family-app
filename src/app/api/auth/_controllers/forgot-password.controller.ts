import { API_URL } from "@/lib/constant";
import { type NextRequest, NextResponse } from "next/server";
import { apiError } from "@/app/api/_shared/error-response";
import { upstreamErrorResponse } from "./upstream-error";

export async function handleForgotPassword(req: NextRequest) {
  try {
    const body = await req.json();

    const visitorId = req.headers.get("x-user-identifier");
    const locale = req.headers.get("x-lang");

    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-identifier": visitorId || "",
        "x-lang": locale || "",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    const statusCode = result?.status ?? response.status;

    if (statusCode >= 400) {
      return upstreamErrorResponse(result, statusCode);
    }

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiError(500, "INTERNAL_SERVER_ERROR");
  }
}
