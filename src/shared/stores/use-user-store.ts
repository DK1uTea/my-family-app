import { create } from "zustand";
import { type DateFormat, DEFAULT_DATE_FORMAT } from "@/lib/date-utils";

export type { DateFormat };

export type Currency = {
  code: string;
  symbol: string;
};

export type UserPreferences = {
  currency: Currency;
  language: string;
  appearance: Appearance;
  dateFormat: DateFormat;
};

export type Appearance = "light" | "dark";

export type UserInfo = {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  lastLoginAt?: string;
};

type UserStore = {
  user: UserInfo;
  preferences: UserPreferences;
  permissions: string[] | null;
  navbar: string[] | null;
  setUser: (user: Partial<UserInfo>) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setCurrency: (currency: Currency) => void;
  setDateFormat: (dateFormat: DateFormat) => void;
  setPermissions: (permissions: string[]) => void;
  setNavbar: (navbar: string[]) => void;
};

export const DEFAULT_CURRENCY: Currency = { code: "VND", symbol: "₫" };

export const useUserStore = create<UserStore>((set) => ({
  user: {},
  preferences: {
    currency: DEFAULT_CURRENCY,
    language: "en",
    appearance: "light",
    dateFormat: DEFAULT_DATE_FORMAT,
  },
  permissions: null,
  navbar: null,
  setUser: (user) => set((s) => ({ user: { ...s.user, ...user } })),
  setPreferences: (preferences) =>
    set((s) => ({ preferences: { ...s.preferences, ...preferences } })),
  setCurrency: (currency) =>
    set((s) => ({ preferences: { ...s.preferences, currency } })),
  setDateFormat: (dateFormat) =>
    set((s) => ({ preferences: { ...s.preferences, dateFormat } })),
  setPermissions: (permissions) => set({ permissions }),
  setNavbar: (navbar) => set({ navbar }),
}));

export function useHasPermission(keys: string | string[]): boolean {
  return useUserStore((state) => {
    if (state.permissions === null) return true;
    if (state.permissions.includes('*')) return true;
    const required = Array.isArray(keys) ? keys : [keys];
    return required.some((key) => state.permissions?.includes(key));
  });
}

/** Convenience selector — use this in components: `const { symbol } = useCurrency()` */
export function useCurrency(): Currency {
  return useUserStore((s) => s.preferences.currency);
}

/** Convenience selector — use this in components: `const dateFormat = useDateFormat()` */
export function useDateFormat(): DateFormat {
  return useUserStore((s) => s.preferences.dateFormat);
}
