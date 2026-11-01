import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { dayjs } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

type AuthFooterCopyrightProps = {
  className?: string
}

export function AuthFooterCopyright({ className }: AuthFooterCopyrightProps) {
  const tf = useTranslations('footer')
  const year = dayjs().year()

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-x-8 gap-y-3 text-center text-base font-medium text-foreground font-brand-wide md:flex-row',
        className
      )}
    >
      <span className="order-1 md:order-0">
        {tf('copyright', { year })}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link href="/impressum" className="underline underline-offset-2 hover:opacity-80">
          {tf('impressum')}
        </Link>
        <Link href="/datenschutz" className="underline underline-offset-2 hover:opacity-80">
          {tf('privacyPolicy')}
        </Link>
        <Link href="/agb" className="underline underline-offset-2 hover:opacity-80">
          {tf('agb')}
        </Link>
        <Link href="/support" className="underline underline-offset-2 hover:opacity-80">
          {tf('support')}
        </Link>
      </div>
    </div>
  )
}
