'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useQueryState, parseAsString } from 'nuqs'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'

async function verifyInvite(code: string) {
  const res = await fetch('/api/auth/verify-invite-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error('invalid')
  return res.json()
}

export function useVerifyInvite() {
  const t = useTranslations('registration')
  const router = useRouter()
  const [invite] = useQueryState('invite', parseAsString)

  const { isLoading, isError, isSuccess, data } = useQuery({
    queryKey: ['verify-invite', invite],
    queryFn: () => verifyInvite(invite!),
    enabled: !!invite,
    retry: false,
    gcTime: 0,
  })

  useEffect(() => {
    if (!invite) {
      toast.error(t('inviteMissing'))
      router.replace('/login' as '/')
    }
  }, [invite, router, t])

  useEffect(() => {
    if (isError) {
      router.replace('/login' as '/')
    }
  }, [isError, router])

  return {
    isVerifying: !!invite && (isLoading || (!isSuccess && !isError)),
    isReady: isSuccess,
    email: data?.data?.email as string | undefined,
    code: invite ?? '',
  }
}
