export type TenantSeedAccount = {
  roleKey: "admin" | "adult" | "child";
  email: string;
  password: string;
  firstName: string;
  lastName: "Seed";
};

const ACCOUNT_CONFIG = [
  { roleKey: "admin", prefix: "SEED_TENANT_ADMIN", firstName: "Tenant Admin" },
  { roleKey: "adult", prefix: "SEED_TENANT_ADULT", firstName: "Adult" },
  { roleKey: "child", prefix: "SEED_TENANT_CHILD", firstName: "Child" },
] as const;

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getTenantSeedAccounts(
  env: Record<string, string | undefined>,
): TenantSeedAccount[] {
  const accounts = ACCOUNT_CONFIG.map(({ roleKey, prefix, firstName }) => {
    const rawEmail = env[`${prefix}_EMAIL`];
    const password = env[`${prefix}_PASSWORD`];
    if (!rawEmail || !password) {
      throw new Error(`Set ${prefix}_EMAIL and ${prefix}_PASSWORD in .env.local.`);
    }
    const email = rawEmail.trim().toLowerCase();
    if (!isEmail(email)) throw new Error(`${prefix}_EMAIL must be a valid email address.`);
    if (password.length < 12) throw new Error(`${prefix}_PASSWORD must be at least 12 characters.`);
    return { roleKey, email, password, firstName, lastName: "Seed" as const };
  });

  const emails = accounts.map((account) => account.email);
  if (new Set(emails).size !== emails.length) {
    throw new Error("Tenant seed account emails must be unique.");
  }
  return accounts;
}

export function getSeedRoleAccountsMissingUsers(
  accounts: readonly TenantSeedAccount[],
  existingRoleKeys: readonly (string | null)[],
): TenantSeedAccount[] {
  return accounts.filter((account) => !existingRoleKeys.includes(account.roleKey));
}
