import "server-only";

import { eq } from "drizzle-orm";
import type { DateFormat } from "@/lib/date-utils";
import { nowUtc } from "@/lib/date-utils";
import { userPreferences, users } from "@/server/drizzle/schema";
import { db } from "@/server/third-party/drizzle/client";
import type { UsersRepository } from "./users.repository";
import type {
  UpdateUserProfile,
  UserPreferencesRecord,
  UserProfileRecord,
} from "./users.types";

const DEFAULT_PREFERENCES: UserPreferencesRecord = {
  preferredLanguage: "de",
  appearance: "light",
  currency: "EUR",
  dateFormat: "DD/MM/YYYY",
};

export class DrizzleUsersRepository implements UsersRepository {
  async findProfileById(userId: string): Promise<UserProfileRecord | null> {
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userRows[0];
    if (!user) return null;

    const prefRows = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const pref = prefRows[0];
    const preferences: UserPreferencesRecord = {
      preferredLanguage:
        (pref?.preferredLanguage as "de" | "en") ??
        DEFAULT_PREFERENCES.preferredLanguage,
      appearance:
        (pref?.appearance as "light" | "dark") ??
        DEFAULT_PREFERENCES.appearance,
      currency: pref?.currency ?? DEFAULT_PREFERENCES.currency,
      dateFormat:
        (pref?.dateFormat as DateFormat) ?? DEFAULT_PREFERENCES.dateFormat,
    };

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      permissions: user.permissions ?? [],
      role: {
        key: user.roleKey ?? "admin",
        permissions: user.permissions ?? [],
        navbar: user.navbar,
      },
      preferences,
    };
  }

  async updateProfile(
    userId: string,
    update: UpdateUserProfile,
  ): Promise<UserProfileRecord | null> {
    const now = nowUtc();
    const userUpdates: Partial<typeof users.$inferInsert> = {
      updatedAt: now,
    };

    if (update.firstName !== undefined) userUpdates.firstName = update.firstName;
    if (update.lastName !== undefined) userUpdates.lastName = update.lastName;
    if (update.avatar !== undefined) userUpdates.avatar = update.avatar;

    await db.update(users).set(userUpdates).where(eq(users.id, userId));

    if (update.preferences) {
      await db
        .insert(userPreferences)
        .values({
          userId,
          preferredLanguage: update.preferences.preferredLanguage ?? "de",
          appearance: update.preferences.appearance ?? "light",
          currency: update.preferences.currency ?? "EUR",
          dateFormat: update.preferences.dateFormat ?? "DD/MM/YYYY",
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            preferredLanguage: update.preferences.preferredLanguage,
            appearance: update.preferences.appearance,
            currency: update.preferences.currency,
            dateFormat: update.preferences.dateFormat,
          },
        });
    }

    return this.findProfileById(userId);
  }
}

export const usersRepository = new DrizzleUsersRepository();
