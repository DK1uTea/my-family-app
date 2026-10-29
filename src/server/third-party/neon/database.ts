import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/server/third-party/drizzle/client";

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await db.execute(sql`SELECT 1 AS connected`);
    const rows = result.rows as Array<{ connected: number }>;
    return Number(rows[0]?.connected) === 1;
  } catch {
    return false;
  }
}
