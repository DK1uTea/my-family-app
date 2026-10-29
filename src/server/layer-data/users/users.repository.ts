import "server-only";

import type { UpdateUserProfile, UserProfileRecord } from "./users.types";

/** Persistence contract for a user's own profile and preferences. */
export interface UsersRepository {
  findProfileById(userId: string): Promise<UserProfileRecord | null>;
  updateProfile(
    userId: string,
    update: UpdateUserProfile,
  ): Promise<UserProfileRecord | null>;
}
