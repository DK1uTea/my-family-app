import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import bcrypt from "bcryptjs";
import { roles, users, userPreferences } from "../src/server/drizzle/schema";
import {
  BUILT_IN_ROLE_SEED_ACCOUNTS,
  getRoleSeedAccountsMissingUsers,
  getSeedRolePassword,
} from "../src/server/modules/auth/seed-users";

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
  const resetExisting = process.argv.includes("--reset-existing");

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
    await db
      .insert(roles)
      .values({ key: "admin", name: "Admin", permissionKeys: ["*"] })
      .onConflictDoNothing({ target: roles.key });

    let superAdminId: string | undefined;
    if (resetExisting) {
      const updatedUsers = await db
        .update(users)
        .set({
          passwordHash,
          failedAttempts: 0,
          isLocked: false,
          lockedUntil: null,
        })
        .where(eq(users.email, email))
        .returning({ id: users.id });

      if (updatedUsers[0]) {
        superAdminId = updatedUsers[0].id;
        console.log(`Super admin ${email} password reset (ID: ${superAdminId}).`);
      }
    }

    if (!superAdminId) {
      const insertedUsers = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          firstName,
          lastName,
          roleKey: "admin",
          failedAttempts: 0,
          isLocked: false,
        })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id });

      superAdminId = insertedUsers[0]?.id;
      if (superAdminId) {
        console.log(`Super admin ${email} created (ID: ${superAdminId}).`);
      } else {
        console.log(
          `User ${email} already exists; no account data was changed. Use --reset-existing to reset its password and lockout state.`,
        );
      }
    }

    if (superAdminId) {
      await db.insert(userPreferences).values({
        userId: superAdminId,
        preferredLanguage: "vi",
        appearance: "light",
        currency: "VND",
        dateFormat: "DD/MM/YYYY",
      }).onConflictDoNothing({ target: userPreferences.userId });
    }

    const [adminAccount] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.roleKey, "admin"))
      .limit(1);
    if (!adminAccount) {
      throw new Error(
        "No admin account exists. Check that SEED_SUPER_ADMIN_EMAIL is not already assigned to a different role.",
      );
    }

    const existingRoleUsers = await db
      .select({ roleKey: users.roleKey })
      .from(users)
      .where(inArray(users.roleKey, BUILT_IN_ROLE_SEED_ACCOUNTS.map((account) => account.roleKey)));
    const accountsToCreate = getRoleSeedAccountsMissingUsers(
      existingRoleUsers.map((user) => user.roleKey),
    );

    for (const account of accountsToCreate) {
      const [role] = await db
        .select({ key: roles.key })
        .from(roles)
        .where(eq(roles.key, account.roleKey))
        .limit(1);
      if (!role) {
        throw new Error(`Missing ${account.roleKey} role; run pnpm db:migrate first.`);
      }

      const [roleUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.roleKey, account.roleKey))
        .limit(1);
      if (roleUser) {
        console.log(`Role ${account.roleKey} already has an account; no changes made.`);
        continue;
      }

      const [emailOwner] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, account.email))
        .limit(1);
      if (emailOwner) {
        throw new Error(
          `${account.email} already belongs to a different account; refusing to change its role.`,
        );
      }

      const rolePassword = getSeedRolePassword(account.email);
      const rolePasswordHash = await bcrypt.hash(rolePassword, 12);
      const [roleSeedUser] = await db
        .insert(users)
        .values({
          email: account.email,
          passwordHash: rolePasswordHash,
          firstName: account.firstName,
          lastName: "Seed",
          roleKey: account.roleKey,
          failedAttempts: 0,
          isLocked: false,
        })
        .returning({ id: users.id });
      if (!roleSeedUser) {
        throw new Error(`Failed to create ${account.roleKey} seed account.`);
      }

      await db.insert(userPreferences).values({
        userId: roleSeedUser.id,
        preferredLanguage: "vi",
        appearance: "light",
        currency: "VND",
        dateFormat: "DD/MM/YYYY",
      });
      console.log(`Seeded ${account.roleKey} account ${account.email}.`);
    }
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Seed error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
