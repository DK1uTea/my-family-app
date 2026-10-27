import { CORE_API_URL } from "@/lib/constant";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const visitorId = req.headers.get("x-user-identifier");
    const locale = req.headers.get("x-lang");

    const response = await fetch(`${CORE_API_URL}/auth/forgot-password`, {
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
      return NextResponse.json(
        { error_code: result?.message },
        { status: statusCode },
      );
    }

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: ["Internal Server Error"] },
      { status: 500 },
    );
  }
}
