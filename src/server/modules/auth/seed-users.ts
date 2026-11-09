export const BUILT_IN_ROLE_SEED_ACCOUNTS = [
  { roleKey: "adult", email: "adult.seed@local.test", firstName: "Adult", lastName: "User" },
  { roleKey: "child", email: "child.seed@local.test", firstName: "Child", lastName: "User" },
] as const;

export function getSeedRolePassword(email: string): string {
  return `${email.split("@")[0]}@1234`;
}

export function getRoleSeedAccountsMissingUsers(
  existingRoleKeys: readonly (string | null)[],
) {
  return BUILT_IN_ROLE_SEED_ACCOUNTS.filter(
    (account) => !existingRoleKeys.includes(account.roleKey),
  );
}
