'use client'

import { ClockIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { dayjs, DEFAULT_DATE_FORMAT, type DateFormat } from '@/lib/date-utils'

type WelcomeGreetingProps = {
  firstName?: string
  lastName?: string
  lastLogin?: string | null
  dateFormat: DateFormat
}

const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export function WelcomeGreeting({ firstName, lastName, lastLogin, dateFormat }: WelcomeGreetingProps) {
  const t = useTranslations('dashboard')
  const now = dayjs.utc()
  const hour = now.hour()
  const hasName = firstName || lastName

  const hourGreeting = (): string => {
    if (hour >= 5 && hour < 11) return t('morning')
    if (hour >= 11 && hour < 18) return t('afternoon')
    if (hour >= 18 && hour < 22) return t('evening')
    return t('night')
  }

  const vibeGreeting = (): string => {
    if (hour >= 5 && hour < 11) return t('textLunch')
    if (hour >= 11 && hour < 17) return t('textAfternoon')
    if (hour >= 17 && hour < 22) return t('textNight')
    return t('textNight')
  }

  const lastLoginMoment = lastLogin ? dayjs.utc(lastLogin) : now

  return (
    <div>
      <h1 className="text-[22px] font-bold">
        {hasName ? `${hourGreeting()}, ${firstName} ${lastName}` : t('welcome')}
      </h1>
      <p className="text-foreground/70">{`${t(WEEKDAY_KEYS[now.day()])} ${vibeGreeting()}`}</p>
      <div className="flex items-center gap-2 mt-1">
        <ClockIcon className="size-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {`${t('lastLogin')} ${lastLoginMoment.format(`HH:mm ${dateFormat || DEFAULT_DATE_FORMAT}`)}`}
        </p>
      </div>
    </div>
  )
}
