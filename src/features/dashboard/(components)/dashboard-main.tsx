"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { nowUtc } from "@/lib/date-utils";
import { ComponentGuard } from "@/shared/components/common/component-guard";
import { PERMISSIONS } from "@/shared/constants/permissions";
import { useUserStore } from "@/shared/stores/use-user-store";
import DashboardCharts from "./dashboard-charts";
import DashboardEvents from "./dashboard-events";

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
        <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
      </div>

      <div className="flex gap-4">
        <ComponentGuard
          requiredKeys={[
            PERMISSIONS.Event.Create,
            PERMISSIONS.Event.Management,
          ]}
        >
          <Link href="/events/create">{t("createEvent")}</Link>
        </ComponentGuard>

        <ComponentGuard
          requiredKeys={[
            PERMISSIONS.Event.List.Draft,
            PERMISSIONS.Calendar.List,
          ]}
        >
          <Link href="/calendar">{t("goToCalendar")}</Link>
        </ComponentGuard>
      </div>

      <ComponentGuard requiredKeys={[PERMISSIONS.Event.List.Active]}>
        <DashboardEvents />
      </ComponentGuard>

      <div>
        <DashboardCharts />
      </div>
    </div>
  );
}
