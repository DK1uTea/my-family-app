import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { dayjs } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

type AuthFooterCopyrightProps = {
  className?: string
}

export function AuthFooterCopyright({ className }: AuthFooterCopyrightProps) {
  const tf = useTranslations('footer')
  const year = dayjs.utc().year()

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-121.25 flex-col items-center justify-center gap-3 text-base font-medium text-foreground md:flex-row md:gap-12 font-brand-wide',
        className
      )}
    >
      <span className="order-1 whitespace-nowrap text-center md:order-0 md:text-left">
        {tf('copyright', { year })}
      </span>
      <div className="flex items-center justify-center gap-3 md:justify-start md:gap-5.5">
        <Link href="/impressum" className="underline underline-offset-2 hover:opacity-80">
          {tf('impressum')}
        </Link>
        <Link href="/datenschutz" className="whitespace-nowrap underline underline-offset-2 hover:opacity-80">
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
