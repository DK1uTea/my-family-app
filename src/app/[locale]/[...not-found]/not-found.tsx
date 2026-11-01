'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/shared/components/ui/button'

export default function NotFoundPage() {
  const t = useTranslations('common.notFound')

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-8xl font-bold text-primary">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <Button href="/">
        {t('backHome')}
      </Button>
    </div>
  )
}
