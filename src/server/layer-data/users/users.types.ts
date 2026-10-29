import "server-only";

import type { DateFormat } from "@/lib/date-utils";

export type UserPreferencesRecord = {
  preferredLanguage: "de" | "en";
  appearance: "light" | "dark";
  currency: string;
  dateFormat: DateFormat;
};

export type UserRoleRecord = {
  key?: string;
  permissions?: string[];
  navbar?: string[] | null;
};

/** Persistence-neutral current-user profile shape based on the existing FE contract. */
export type UserProfileRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  lastLoginAt: string | null;
  permissions?: string[];
  role?: UserRoleRecord;
  preferences: UserPreferencesRecord;
};

export type UpdateUserProfile = {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  preferences?: Partial<UserPreferencesRecord>;
};
