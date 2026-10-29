import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import bcrypt from "bcryptjs";
import { users, userPreferences } from "../src/server/drizzle/schema";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL or DATABASE_URL_UNPOOLED in environment");
  process.exit(1);
}

async function seed() {
  const email = process.argv[2] || "admin@example.com";
  const password = process.argv[3] || "Password123!";
  const firstName = process.argv[4] || "Admin";
  const lastName = process.argv[5] || "User";

  console.log(`Seeding user: ${email}...`);

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const passwordHash = await bcrypt.hash(password, 10);

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
    .onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash,
        firstName,
        lastName,
        isLocked: false,
        failedAttempts: 0,
        lockedUntil: null,
      },
    })
    .returning({ id: users.id });

  const userId = insertedUsers[0].id;

  await db
    .insert(userPreferences)
    .values({
      userId,
      preferredLanguage: "de",
      appearance: "light",
      currency: "EUR",
      dateFormat: "DD/MM/YYYY",
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        preferredLanguage: "de",
        appearance: "light",
      },
    });

  console.log(`✓ Seeded user ${email} (ID: ${userId}) with password "${password}"`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
