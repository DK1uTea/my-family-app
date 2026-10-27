'use client'

import Image from 'next/image'
import { FormProvider } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/components/ui/button'
import { useResetPasswordForm } from '../(hooks)/use-reset-password-form'
import ResetPasswordFields from './reset-password-fields'

type Props = {
  token: string
}

export default function ResetPasswordForm({ token }: Props) {
  const t = useTranslations('resetPassword')
  const { form, onSubmit } = useResetPasswordForm({ token })
  const { formState } = form

  return (
    <div className="w-full rounded-4xl bg-card px-5 py-10 max-w-270 md:p-10 flex justify-center items-center grow border border-border">
      <div className="h-full flex flex-col gap-17 items-center justify-center w-full max-w-100">
        <div className="flex justify-center">
          <Image src="/images/logo_red.png" alt={t('logoAlt')} width={800} height={143} className="h-auto w-50 md:w-67.25" priority />
        </div>
        <FormProvider {...form}>
          <form noValidate onSubmit={onSubmit} className="w-full flex flex-col gap-6">
            <ResetPasswordFields />
            <Button type="submit" className="w-full" isLoading={formState.isSubmitting}>
              {t('submit')}
            </Button>

            <Button variant="ghost" href="/login" className="w-full">
              {t('backToLogin')}
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
