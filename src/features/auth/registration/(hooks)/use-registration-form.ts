'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { registrationSchema, type RegistrationFormData } from '../(helpers)/registration-schema'
import { getApiUrl } from '@/lib/constant'

type Props = {
  email: string
  code: string
}

const API_BASE = getApiUrl('core')

function base64ToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

function getExtension(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  return 'jpg'
}

async function uploadAvatar(avatar: string, accessToken: string): Promise<void> {
  const blob = base64ToBlob(avatar)
  const filename = `avatar.${getExtension(blob.type)}`

  const presignRes = await fetch(
    `${API_BASE}/user/presigned-upload-url?filename=${filename}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!presignRes.ok) throw new Error('presign failed')

  const presignData = await presignRes.json()
  const { key, presignedUrl } = presignData.data

  const s3Res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type },
    body: blob,
  })
  if (!s3Res.ok) throw new Error('S3 upload failed')

  await fetch(`${API_BASE}/user/avatar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ avatar: key }),
  })
}

export function useRegistrationForm({ email, code }: Props) {
  const router = useRouter()
  const t = useTranslations('registration')

  const form = useForm<RegistrationFormData>({
    mode: 'onChange',
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      avatar: '',
      firstName: '',
      lastName: '',
      password: '',
      repeatPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    const acceptRes = await fetch('/api/auth/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        code,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        confirmPassword: data.repeatPassword,
      }),
    })

    if (!acceptRes.ok) {
      const result = await acceptRes.json()
      const message = result?.error_code ?? result?.message
      const text = Array.isArray(message) ? message[0] : message
      if (text) toast.error(text)
      return
    }

    if (data.avatar) {
      try {
        const tokenRes = await fetch('/api/auth/registration-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: data.password }),
        })

        if (tokenRes.ok) {
          const { accessToken } = await tokenRes.json()
          await uploadAvatar(data.avatar, accessToken)
        }
      } catch {
        // Avatar upload is non-fatal — account already created
      }
    }

    toast.success(t('successMessage'))
    router.replace('/login' as '/')
  })

  return { form, onSubmit }
}
