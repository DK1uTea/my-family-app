import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const roles = pgTable("roles", {
  key: varchar("key", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  moduleKeys: jsonb("module_keys").$type<string[]>().default([]).notNull(),
  permissionKeys: jsonb("permission_keys").$type<string[]>().default([]).notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  avatar: text("avatar"),
  roleKey: varchar("role_key", { length: 50 }).references(() => roles.key),
  tenantId: varchar("tenant_id", { length: 50 }).references(() => tenants.id),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  isLocked: boolean("is_locked").default(false).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(5).notNull(),
  mustChangePassword: boolean("must_change_password").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_users_tenant_id").on(table.tenantId),
  check(
    "users_tenant_scope_check",
    sql`(${table.roleKey} = 'super_admin' AND ${table.tenantId} IS NULL) OR (${table.roleKey} IS DISTINCT FROM 'super_admin' AND ${table.tenantId} IS NOT NULL)`,
  ),
]);

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  preferredLanguage: varchar("preferred_language", { length: 10 })
    .default("vi")
    .notNull(),
  appearance: varchar("appearance", { length: 10 }).default("light").notNull(),
  currency: varchar("currency", { length: 10 }).default("VND").notNull(),
  dateFormat: varchar("date_format", { length: 20 })
    .default("DD/MM/YYYY")
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
