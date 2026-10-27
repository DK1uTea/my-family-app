'use client'

import Image from 'next/image'
import { RefreshCwIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'

type Props = {
  /** Full viewport height (global outage) vs inside the module's content area. */
  fullPage?: boolean
  onRetry?: () => void
}

export function MaintenanceView({ fullPage = true, onRetry }: Props) {
  const t = useTranslations('common.maintenance')

  // A whole-app outage and a single module going down are different situations —
  // saying "our service is unavailable" while the rest of the app still works misleads.
  const title = fullPage ? t('title') : t('moduleTitle')
  const description = fullPage ? t('description') : t('moduleDescription')

  return (
    <div
      className={cn('flex items-center justify-center p-6', {
        'min-h-screen': fullPage,
        'min-h-100': !fullPage,
      })}
    >
      <div className="flex flex-col items-center text-center">
        <div className={cn('flex items-center flex-col text-center')}>
          <Image
            src="/images/maintenance.webp"
            alt="maintenance"
            width={500}
            height={500}
            priority
            sizes="500px"
            className="w-125 object-contain"
          />
        </div>
        <div className="mb-6 flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="max-w-125 text-sm whitespace-pre-line text-muted-foreground">{description}</p>
        </div>
        <Button onClick={onRetry ?? (() => window.location.reload())}>
          <RefreshCwIcon className="size-4" />
          {t('retry')}
        </Button>
      </div>
    </div>
  )
}
