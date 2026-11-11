import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@/server/third-party/neon/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const connected = await checkDatabaseConnection();

    return NextResponse.json(
      connected
        ? { status: "ok" }
        : { status: "unavailable", message: "DATABASE_UNAVAILABLE", error_code: "DATABASE_UNAVAILABLE" },
      { status: connected ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable", message: "DATABASE_UNAVAILABLE", error_code: "DATABASE_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
