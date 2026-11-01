"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { apiProxy, clientLogout } from "@/lib/api";
import { setLocale, type AppLocale } from "@/lib/locale";
import { type Appearance, useUserStore } from "@/shared/stores/use-user-store";
import type { DateFormat } from "@/lib/date-utils";
import { getErrorStatus, isMaintenanceStatus } from "@/lib/get-error-status";

type MeData = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  lastLoginAt?: string;
  permissions?: string[];
  role?: {
    key?: string;
    permissions?: string[];
    navbar?: string[];
  };
  settings: {
    preferredLanguage: string;
    appearance?: string;
    theme?: string;
    currency?: string;
    dateFormat: DateFormat;
  };
};

async function fetchMe(): Promise<MeData> {
  const response = await apiProxy.get("/user/me");
  return response.data.data as MeData;
}

export function useMe() {
  const t = useTranslations("common");
  const { setTheme } = useTheme();
  const lastAppliedPreferencesAt = useRef(0);
  const setUser = useUserStore((s) => s.setUser);
  const setPreferences = useUserStore((s) => s.setPreferences);
  const setPermissions = useUserStore((s) => s.setPermissions);
  const setNavbar = useUserStore((s) => s.setNavbar);

  const query = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
    // Handled manually below (full-page maintenance vs logout) — the default
    // queryClient's throwOnError would otherwise send this to a module error.tsx.
    throwOnError: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (query.data) {
      if (
        !query.dataUpdatedAt ||
        lastAppliedPreferencesAt.current === query.dataUpdatedAt
      )
        return;

      lastAppliedPreferencesAt.current = query.dataUpdatedAt;

      const { id, email, firstName, lastName, settings, avatar, lastLoginAt, permissions, role } = query.data;
      const name = [firstName, lastName].filter(Boolean).join(" ");
      const preferredLanguage = normalizeLocale(settings?.preferredLanguage);
      const appearance = normalizeAppearance(
        settings?.appearance ?? settings?.theme,
      );
      setUser({ id, name, email, firstName, lastName, avatar, lastLoginAt });
      setPreferences({
        language: preferredLanguage,
        appearance,
        dateFormat: settings?.dateFormat,
        currency: {
          code: settings?.currency ?? "EUR",
          symbol: settings?.currency === "EUR" || !settings?.currency ? "€" : settings?.currency,
        },
      });
      setPermissions(permissions ?? role?.permissions ?? []);
      setNavbar(role?.navbar ?? []);
      setLocale(preferredLanguage);
      setAppearance(appearance);
      setTheme(appearance);
    }
  }, [query.data, query.dataUpdatedAt, setTheme, setUser, setPreferences, setPermissions, setNavbar]);

  const status = getErrorStatus(query.error);

  useEffect(() => {
    if (query.isError && status === 401) {
      toast.error(t("sessionExpired"));
      clientLogout();
    }
  }, [query.isError, status, t]);

  return { ...query, isMaintenance: query.isError && isMaintenanceStatus(status) };
}

function normalizeLocale(locale: string | null | undefined): AppLocale {
  const normalized = locale?.toLowerCase();
  return normalized === "en" || normalized === "vi" ? normalized : "vi";
}

function normalizeAppearance(
  appearance: string | null | undefined,
): Appearance {
  const normalized = appearance?.toLowerCase();
  return normalized === "dark" || normalized === "light" ? normalized : "light";
}

function setAppearance(appearance: Appearance) {
  document.cookie = `appearance=${appearance}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}
