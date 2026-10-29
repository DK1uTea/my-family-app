import { NextResponse } from "next/server";
import { openApiSpec } from "@/server/openapi/spec";

export const dynamic = "force-dynamic";

export function GET() {
  if (process.env.NODE_ENV === "production" && process.env.API_DOCS_ENABLED !== "true") {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json(openApiSpec, {
    headers: { "Cache-Control": "no-store" },
  });
}
