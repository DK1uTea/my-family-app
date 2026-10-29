import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@/server/third-party/neon/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const connected = await checkDatabaseConnection();

    return NextResponse.json(
      { status: connected ? "ok" : "unavailable" },
      { status: connected ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
