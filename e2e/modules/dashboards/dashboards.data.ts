import { dayjs } from '@/lib/date-utils';

/**
 * dashboards — visible copy (Vietnamese, the default locale), read from
 * `src/messages/vi.json` under the `dashboard` namespace and cross-checked against
 * `src/features/dashboard/(components)/*` and `(helpers)/dashboard-greeting.tsx`.
 */
export const COPY = {
  welcomeGeneric: 'Chào mừng bạn đến với bảng điều khiển!',
  createEvent: 'Tạo sự kiện',
  goToCalendar: 'Đến lịch',
  yourUpcomingEvents: 'Sự kiện sắp tới của bạn',
  yourUpcomingEventsDescription: '3 sự kiện tiếp theo trong lịch của bạn',
  teamUpcomingEvents: 'Sự kiện sắp tới của nhóm',
  teamUpcomingEventsDescription: '3 sự kiện tiếp theo của tất cả người dùng',
  noUpcomingEvents: 'Không có sự kiện sắp tới',
  noUpcomingEventsDescription: 'Bạn chưa lên lịch sự kiện nào trong thời gian tới.',
  noTeamEvents: 'Không có sự kiện nhóm',
  noTeamEventsDescription: 'Nhóm của bạn không có sự kiện sắp tới.',
  metrics: 'Chỉ số',
  includeFutureEvents: 'Bao gồm sự kiện trong tương lai',
  at: 'lúc',
  organizedBy: (name: string) => `Được tổ chức bởi ${name}`,
  eventStartsIn: (count: number) =>
    `Còn ${count} ngày`,
} as const;

/**
 * The greeting shown in the h1 mirrors
 * `src/features/dashboard/(helpers)/dashboard-greeting.tsx#getGreeting` — driven by the
 * current UTC hour, so a hardcoded string would go stale by time of day.
 */
export function expectedGreeting(): string {
  const hour = dayjs.utc().hour();

  if (hour >= 5 && hour < 11) return 'Chào buổi sáng';
  if (hour >= 11 && hour < 18) return 'Chào buổi chiều';
  if (hour >= 18 && hour < 22) return 'Chào buổi tối';
  return 'Chúc ngủ ngon';
}

/** Full name greeting, built the same way `dashboard-main.tsx` does. */
export function expectedNamedGreeting(firstName: string, lastName: string): string {
  return `${expectedGreeting()}, ${firstName} ${lastName}`;
}
