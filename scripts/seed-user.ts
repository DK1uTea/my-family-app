import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import bcrypt from "bcryptjs";
import { users, userPreferences } from "../src/server/drizzle/schema";

config({ path: ".env.local" });
config({ path: ".env" });

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The super admin seed is disabled in production.");
  }
  if (process.env.NEON_BRANCH !== "development") {
    throw new Error("Set NEON_BRANCH=development and verify neon status before seeding.");
  }

  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const email = process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const firstName = process.env.SEED_SUPER_ADMIN_FIRST_NAME?.trim() || "Super";
  const lastName = process.env.SEED_SUPER_ADMIN_LAST_NAME?.trim() || "Admin";

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL or DATABASE_URL_UNPOOLED in environment.");
  }
  if (!email || !password) {
    throw new Error(
      "Set SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD in .env.local before running pnpm db:seed.",
    );
  }
  if (password.length < 12) {
    throw new Error("SEED_SUPER_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const pool = new Pool({ connectionString });

  try {
    const db = drizzle(pool);
    const passwordHash = await bcrypt.hash(password, 12);
    const insertedUsers = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        roleKey: "admin",
        permissions: ["*"],
        navbar: null,
        failedAttempts: 0,
        isLocked: false,
      })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });

    const user = insertedUsers[0];
    if (!user) {
      console.log(`User ${email} already exists; no account data was changed.`);
      return;
    }

    await db.insert(userPreferences).values({
      userId: user.id,
      preferredLanguage: "vi",
      appearance: "light",
      currency: "EUR",
      dateFormat: "DD/MM/YYYY",
    });

    console.log(`Super admin ${email} created (ID: ${user.id}).`);
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Seed error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
