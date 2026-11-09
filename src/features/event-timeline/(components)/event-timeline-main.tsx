import { getTranslations } from 'next-intl/server';

export async function EventTimelineMain() {
  const t = await getTranslations('eventTimeline');

  return (
    <div className="space-y-2">
      <h1 data-testid="event-timeline-heading" className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground">{t('comingSoon')}</p>
    </div>
  );
}
