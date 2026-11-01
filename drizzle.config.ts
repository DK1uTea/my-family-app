import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/server/drizzle/schema/index.ts",
  out: "./src/server/drizzle/migrations",
  migrations: {
    prefix: "timestamp",
  },
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.DATABASE_URL ||
      "",
  },
});
