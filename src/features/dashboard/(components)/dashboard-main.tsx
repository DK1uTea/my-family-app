"use client";

import { useTranslations } from "next-intl";
import { nowUtc } from "@/lib/date-utils";
import { useUserStore } from "@/shared/stores/use-user-store";

function getGreeting(
  t: (key: "morning" | "afternoon" | "evening" | "night") => string,
): string {
  const hour = nowUtc().getUTCHours();
  if (hour >= 4 && hour < 12) return t("morning");
  if (hour >= 12 && hour < 17) return t("afternoon");
  if (hour >= 17 && hour < 22) return t("evening");
  return t("night");
}

export default function DashboardMain() {
  const t = useTranslations("dashboard");
  const user = useUserStore((s) => s.user);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const greeting = fullName
    ? `${getGreeting(t)}, ${fullName}`
    : t("welcome");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 data-testid="dashboard-heading" className="text-3xl font-bold tracking-tight">{greeting}</h1>
      </div>

    </div>
  );
}
