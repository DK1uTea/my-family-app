import "server-only";

import {
  usersRepository,
  type UpdateUserProfile,
  type UserProfileRecord,
  type UsersRepository,
} from "@/server/layer-data/users";

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async findProfileById(userId: string): Promise<UserProfileRecord | null> {
    return this.repo.findProfileById(userId);
  }

  async updateProfile(
    userId: string,
    update: UpdateUserProfile,
  ): Promise<UserProfileRecord | null> {
    return this.repo.updateProfile(userId, update);
  }
}

export const usersService = new UsersService();

