'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { apiProxy } from '@/lib/api'
import { resetPasswordSchema, type ResetPasswordFormData } from '../(helpers)/reset-password-schema'

type Props = {
  token: string
}

export function useResetPasswordForm({ token }: Props) {
  const router = useRouter()
  const t = useTranslations('resetPassword')

  const form = useForm<ResetPasswordFormData>({
    mode: 'onChange',
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      repeatPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await apiProxy.post('/auth/reset-password', {
        token,
        newPassword: data.password,
        confirmPassword: data.repeatPassword,
      })
    } catch {
      return
    }

    toast.success(t('successMessage'))
    router.replace('/login' as '/')
  })

  return { form, onSubmit }
}
