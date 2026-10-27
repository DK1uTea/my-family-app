'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { Separator } from '@/shared/components/ui/separator'
import {
  IconSocialFacebook,
  IconSocialInstagram,
  IconSocialLinkedin,
  IconSocialYoutube,
} from '@/shared/components/common/icons'

const SOCIAL_LINKS = [
  {
    key: 'linkedin',
    href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL,
    Icon: IconSocialLinkedin,
    labelKey: 'socialLinkedIn',
  },
  {
    key: 'facebook',
    href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL,
    Icon: IconSocialFacebook,
    labelKey: 'socialFacebook',
  },
  {
    key: 'instagram',
    href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL,
    Icon: IconSocialInstagram,
    labelKey: 'socialInstagram',
  },
  {
    key: 'youtube',
    href: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL,
    Icon: IconSocialYoutube,
    labelKey: 'socialYouTube',
  },
] as const

export function AppFooter() {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()
  const { version, date } = parseAppVersion(process.env.NEXT_PUBLIC_VERSION)

  return (
    <footer className="px-6 py-6">
      <div className={cn('rounded-[20px] bg-footer px-4 py-7 sm:p-10 md:px-5 md:pt-10 md:pb-5')}>

        {/* Top: Logo + Social icons */}
        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
          <Image
            src="/images/logo_gray.png"
            alt="Footer Logo"
            width={180}
            height={58}
            className="w-full max-w-69 object-contain"
            loading="eager"
          />
          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.filter(({ href }) => href).map(({ key, href, Icon, labelKey }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(labelKey)}
                className="transition-opacity hover:opacity-80"
              >
                <Icon
                  className="size-10"
                  color="var(--footer-icon)"
                  bgColor="var(--footer-icon-bg)"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <Separator className="md:mt-10! md:mb-5! my-5 bg-footer-foreground/20" />

        {/* Bottom: Copyright + Links */}
        <div className="flex flex-col-reverse items-center justify-between gap-5 text-[15px] font-light sm:flex-row font-brand-wide">
          <p className="text-footer-foreground/50 order-1 md:order-0">{t('copyrightCocaCola', { year })}</p>
          <div className="flex items-center gap-2 md:gap-8">
            <Link href="/support" className="text-footer-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
              {t('supportLink')}
            </Link>
            <Link href="/datenschutz" className="text-footer-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
              {t('privacyPolicy')}
            </Link>
            <Link href="/impressum" className="text-footer-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
              {t('impressum')}
            </Link>
          </div>
        </div>

        {/* Version */}
        {(version || date) && (
          <p className="mt-2 text-sm font-light text-muted-foreground opacity-50 text-center md:text-start">
            {version && <span>{t('version')}: {version}</span>}
            {version && date && <span> - </span>}
            {date && <span>{t('lastUpdate')}: {date}</span>}
          </p>
        )}
      </div>
    </footer>
  )
}

function parseAppVersion(value?: string) {
  if (!value) return { version: '', date: '' }
  const parts = value.split('-')
  const date = parts.pop() ?? ''
  const version = parts.join('-')
  return { version, date }
}
