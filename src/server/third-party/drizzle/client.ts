import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/server/drizzle/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to connect to Neon Postgres");
}

type DatabaseInstance = ReturnType<typeof createDrizzleClient>;

const globalForDrizzle = globalThis as typeof globalThis & {
  drizzleDb?: DatabaseInstance;
  drizzlePool?: Pool;
};

function createDrizzleClient() {
  const pool =
    globalForDrizzle.drizzlePool ??
    new Pool({
      connectionString,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDrizzle.drizzlePool = pool;
  }

  return drizzle(pool, { schema });
}

export const db = globalForDrizzle.drizzleDb ?? createDrizzleClient();

if (process.env.NODE_ENV !== "production") {
  globalForDrizzle.drizzleDb = db;
}
