import "server-only";

import {
  usersRepository,
  type UpdateUserProfile,
  type UserProfileRecord,
  type UsersRepository,
} from "@/server/layer-data/users";
import { getNavbarPermissions } from "@/server/modules/roles/permissions";

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async findProfileById(userId: string): Promise<UserProfileRecord | null> {
    const profile = await this.repo.findProfileById(userId);
    if (!profile?.role) return profile;
    const permissions = Array.isArray(profile.role.permissions)
      ? profile.role.permissions
      : [];
    return {
      ...profile,
      role: { ...profile.role, permissions, navbar: getNavbarPermissions(permissions) },
    };
  }

  async updateProfile(
    userId: string,
    update: UpdateUserProfile,
  ): Promise<UserProfileRecord | null> {
    return this.repo.updateProfile(userId, update);
  }
}

export const usersService = new UsersService();

