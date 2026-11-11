import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import bcrypt from "bcryptjs";
import { roles, tenants, users, userPreferences } from "../src/server/drizzle/schema";
import { getTenantSeedAccounts } from "../src/server/modules/auth/seed-users";

config({ path: ".env.local" });
config({ path: ".env" });

const DEFAULT_TENANT_ID = "default";
const DEFAULT_TENANT_NAME = "Default Tenant";
const ROLE_SEEDS = [
  { key: "super_admin", name: "Super Admin", permissionKeys: ["*"] },
  {
    key: "admin",
    name: "Admin",
    permissionKeys: [
      "event-timeline.read", "event-timeline.create",
      "event-timeline.edit", "event-timeline.delete", "event-timeline.upload",
    ],
  },
  {
    key: "adult",
    name: "Adult",
    permissionKeys: [
      "event-timeline.read", "event-timeline.create",
      "event-timeline.edit", "event-timeline.delete", "event-timeline.upload",
    ],
  },
  { key: "child", name: "Child", permissionKeys: ["event-timeline.read", "event-timeline.upload"] },
] as const;

function readSeedConfig() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const email = process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const tenantId = process.env.SEED_TENANT_ID?.trim() || DEFAULT_TENANT_ID;
  const tenantName = process.env.SEED_TENANT_NAME?.trim() || DEFAULT_TENANT_NAME;
  if (!connectionString) throw new Error("Missing DATABASE_URL or DATABASE_URL_UNPOOLED.");
  if (!email || !password) throw new Error("Set SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD.");
  if (password.length < 12) throw new Error("SEED_SUPER_ADMIN_PASSWORD must be at least 12 characters.");
  if (tenantId !== DEFAULT_TENANT_ID || tenantName !== DEFAULT_TENANT_NAME) {
    throw new Error(`This migration seeds tenant ${DEFAULT_TENANT_ID} / ${DEFAULT_TENANT_NAME}.`);
  }
  const accounts = getTenantSeedAccounts(process.env);
  if (accounts.some((account) => account.email === email)) {
    throw new Error("The super-admin email must differ from tenant seed account emails.");
  }
  return { connectionString, email, password, tenantId, tenantName, accounts };
}

async function seed() {
  if (process.env.NODE_ENV === "production") throw new Error("Seeding is disabled in production.");
  if (process.env.NEON_BRANCH !== "development") {
    throw new Error("Set NEON_BRANCH=development and verify neon status before seeding.");
  }

  const config = readSeedConfig();
  const resetExisting = process.argv.includes("--reset-existing");
  const pool = new Pool({ connectionString: config.connectionString });

  try {
    const db = drizzle(pool);
    for (const role of ROLE_SEEDS) {
      await db.insert(roles).values({ ...role, permissionKeys: [...role.permissionKeys], moduleKeys: [] })
        .onConflictDoUpdate({
          target: roles.key,
          set: { name: role.name, permissionKeys: [...role.permissionKeys] },
        });
    }

    const [tenant] = await db.select({ id: tenants.id, name: tenants.name })
      .from(tenants).where(eq(tenants.id, config.tenantId)).limit(1);
    if (!tenant) throw new Error("Tenant default is missing; run pnpm db:migrate first.");
    if (tenant.name !== config.tenantName) throw new Error("Seed tenant name does not match the migration.");

    const passwordHash = resetExisting ? await bcrypt.hash(config.password, 12) : undefined;
    const existingSuperAdmins = await db.select({ id: users.id })
      .from(users).where(eq(users.email, config.email)).limit(1);
    let superAdminId = existingSuperAdmins[0]?.id;
    if (superAdminId) {
      await db.update(users).set({
        roleKey: "super_admin",
        tenantId: null,
        ...(passwordHash ? { passwordHash, failedAttempts: 0, isLocked: false, lockedUntil: null } : {}),
      }).where(eq(users.id, superAdminId));
      console.log(`Super admin ${config.email} is configured (ID: ${superAdminId}).`);
    } else {
      const [created] = await db.insert(users).values({
        email: config.email,
        passwordHash: await bcrypt.hash(config.password, 12),
        firstName: process.env.SEED_SUPER_ADMIN_FIRST_NAME?.trim() || "Super",
        lastName: process.env.SEED_SUPER_ADMIN_LAST_NAME?.trim() || "Admin",
        roleKey: "super_admin",
        tenantId: null,
        failedAttempts: 0,
        isLocked: false,
      }).returning({ id: users.id });
      superAdminId = created.id;
      console.log(`Super admin ${config.email} created (ID: ${superAdminId}).`);
    }

    await ensurePreferences(db, superAdminId);
    for (const account of config.accounts) {
      await ensureTenantRoleAccount(db, account, config.tenantId, resetExisting);
    }
  } finally {
    await pool.end();
  }
}

async function ensurePreferences(db: ReturnType<typeof drizzle>, userId: string) {
  await db.insert(userPreferences).values({
    userId, preferredLanguage: "vi", appearance: "light", currency: "VND", dateFormat: "DD/MM/YYYY",
  }).onConflictDoNothing({ target: userPreferences.userId });
}

async function ensureTenantRoleAccount(
  db: ReturnType<typeof drizzle>,
  account: ReturnType<typeof getTenantSeedAccounts>[number],
  tenantId: string,
  resetExisting: boolean,
) {
  const [emailOwner] = await db.select({ id: users.id, roleKey: users.roleKey, tenantId: users.tenantId })
    .from(users).where(eq(users.email, account.email)).limit(1);
  const [roleUser] = await db.select({ id: users.id, email: users.email }).from(users)
    .where(and(eq(users.roleKey, account.roleKey), eq(users.tenantId, tenantId))).limit(1);

  if (emailOwner && emailOwner.id !== roleUser?.id) {
    throw new Error(`${account.email} belongs to a different account; refusing to change it.`);
  }
  if (roleUser) {
    if (roleUser.email !== account.email && !resetExisting) {
      throw new Error(`Tenant ${tenantId} already has role ${account.roleKey} under another email; use --reset-existing to apply configured credentials.`);
    }
    if (resetExisting) {
      await db.update(users).set({
        email: account.email,
        passwordHash: await bcrypt.hash(account.password, 12),
        firstName: account.firstName,
        lastName: account.lastName,
        failedAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      }).where(eq(users.id, roleUser.id));
      console.log(`Tenant ${tenantId} role ${account.roleKey} credentials reset (${account.email}).`);
      return;
    }
    console.log(`Tenant ${tenantId} role ${account.roleKey} already matches configured account.`);
    return;
  }
  const [created] = await db.insert(users).values({
    email: account.email,
    passwordHash: await bcrypt.hash(account.password, 12),
    firstName: account.firstName,
    lastName: account.lastName,
    roleKey: account.roleKey,
    tenantId,
    failedAttempts: 0,
    isLocked: false,
  }).returning({ id: users.id });
  await ensurePreferences(db, created.id);
  console.log(`Seeded tenant ${tenantId} role ${account.roleKey} (${account.email}).`);
}

seed().catch((error) => {
  console.error("Seed error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
