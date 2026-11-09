import { getTranslations } from 'next-intl/server';

export default async function SettingsPage() {
  const t = await getTranslations('settings');

  return <h1 data-testid="settings-heading" className="text-3xl font-bold tracking-tight">{t('userSettings')}</h1>;
}
