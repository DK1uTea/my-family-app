'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryState, parseAsString } from 'nuqs'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { apiProxy } from '@/lib/api'

async function verifyResetToken(token: string) {
  const { data } = await apiProxy.get('/auth/verify-reset-token', {
    params: { token },
    _skipToast: true,
  } as object)
  return data
}

export function useVerifyResetToken() {
  const t = useTranslations('resetPassword')
  const router = useRouter()
  const [token] = useQueryState('token', parseAsString)

  const { isLoading, isError, isSuccess } = useQuery({
    queryKey: ['verify-reset-token', token],
    queryFn: () => verifyResetToken(token!),
    enabled: !!token,
    retry: false,
    gcTime: 0,
  })

  useEffect(() => {
    if (!token) {
      toast.error(t('tokenMissing'))
      router.replace('/login' as '/')
    }
  }, [token, router, t])

  useEffect(() => {
    if (isError) {
      toast.error(t('tokenInvalid'))
      router.replace('/login' as '/')
    }
  }, [isError, router, t])

  return {
    isVerifying: !!token && (isLoading || (!isSuccess && !isError)),
    isReady: isSuccess,
    token: token ?? '',
  }
}
