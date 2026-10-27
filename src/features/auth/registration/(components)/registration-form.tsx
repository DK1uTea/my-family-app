'use client'

import Image from 'next/image'
import { FormProvider } from 'react-hook-form'
import { useRegistrationForm } from '../(hooks)/use-registration-form'
import RegistrationFields from './registration-fields'
import { Button } from '@/shared/components/ui/button'
import { useTranslations } from 'next-intl'

type Props = {
  email: string
  code: string
}

export default function RegistrationForm({ email, code }: Props) {
  const t = useTranslations('registration')
  const { form, onSubmit } = useRegistrationForm({ email, code })
  const { formState } = form

  return (
    <div className="w-full rounded-4xl bg-card px-5 py-10 shadow-lg max-w-260 md:p-10 flex justify-center items-center">
      <div className="h-full flex flex-col gap-17 items-center justify-center w-full max-w-100">
        <div className="flex justify-center">
          <Image src="/images/logo_red.png" alt={t('logoAlt')} width={800} height={143} className="h-auto w-50 md:w-67.25" priority />
        </div>
        <FormProvider {...form}>
          <form noValidate onSubmit={onSubmit} className="w-full flex flex-col gap-6">
            <RegistrationFields email={email} />
            <Button type="submit" className="w-full" isLoading={formState.isSubmitting}>
              {t('submit')}
            </Button>

            <Button variant="ghost" href="/login" className="w-full">
              {t('backToLogin')}
            </Button>
          </form>
        </FormProvider>

        <p className="text-xs text-justify">{t('footerText')}</p>
      </div>
    </div>
  )
}
