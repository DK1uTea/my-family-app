import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  avatar: text("avatar"),
  roleKey: varchar("role_key", { length: 50 }).default("admin"),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  navbar: jsonb("navbar").$type<string[] | null>().default(null),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  isLocked: boolean("is_locked").default(false).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(5).notNull(),
  mustChangePassword: boolean("must_change_password").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  preferredLanguage: varchar("preferred_language", { length: 10 })
    .default("vi")
    .notNull(),
  appearance: varchar("appearance", { length: 10 }).default("light").notNull(),
  currency: varchar("currency", { length: 10 }).default("EUR").notNull(),
  dateFormat: varchar("date_format", { length: 20 })
    .default("DD/MM/YYYY")
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
