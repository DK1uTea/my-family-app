import { dayjs } from '@/lib/date-utils';

/**
 * dashboards — visible copy (German, the default locale), read from
 * `src/messages/de.json` under the `dashboard` namespace and cross-checked against
 * `src/features/dashboard/(components)/*` and `(helpers)/dashboard-greeting.tsx`.
 */
export const COPY = {
  welcomeGeneric: 'Willkommen in Ihrem Dashboard!',
  createEvent: 'Event erstellen',
  goToCalendar: 'Zum Kalender',
  yourUpcomingEvents: 'Ihre bevorstehenden Events',
  yourUpcomingEventsDescription: 'Die nächsten 3 Events in Ihrem Kalender',
  teamUpcomingEvents: 'Bevorstehende Team-Events',
  teamUpcomingEventsDescription: 'Die nächsten 3 Events aller Benutzer',
  noUpcomingEvents: 'Keine bevorstehenden Events',
  noUpcomingEventsDescription: 'Sie haben keine Events in naher Zukunft geplant.',
  noTeamEvents: 'Keine Team-Events',
  noTeamEventsDescription: 'Ihr Team hat keine bevorstehenden Events.',
  metrics: 'Kennzahlen',
  includeFutureEvents: 'zukünftige Events einbeziehen',
  at: 'um',
  organizedBy: (name: string) => `Organisiert von ${name}`,
  eventStartsIn: (count: number) =>
    count === 1 ? `Fällig in ${count} Tag` : `Fällig in ${count} Tagen`,
} as const;

/**
 * The greeting shown in the h1 mirrors
 * `src/features/dashboard/(helpers)/dashboard-greeting.tsx#getGreeting` — driven by the
 * current UTC hour, so a hardcoded string would go stale by time of day.
 */
export function expectedGreeting(): string {
  const hour = dayjs.utc().hour();

  if (hour >= 5 && hour < 11) return 'Guten Morgen';
  if (hour >= 11 && hour < 18) return 'Guten Nachmittag';
  if (hour >= 18 && hour < 22) return 'Guten Abend';
  return 'Gute Nacht';
}

/** Full name greeting, built the same way `dashboard-main.tsx` does. */
export function expectedNamedGreeting(firstName: string, lastName: string): string {
  return `${expectedGreeting()}, ${firstName} ${lastName}`;
}
