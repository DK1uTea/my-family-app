'use client'

import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024

async function convertFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('FILE_READ_FAILED'))
        return
      }

      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(new Error('FILE_READ_FAILED'))
    }

    reader.readAsDataURL(file)
  })
}

export function useRegistrationImageValidation() {
  const t = useTranslations('registration.imageValidation')

  const validateImage = async (file: File): Promise<string | null> => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
      toast.error(t('unsupportedType'))
      return null
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('maxFileSize'))
      return null
    }

    try {
      return await convertFileToDataUrl(file)
    } catch {
      toast.error(t('processingFailed'))
      return null
    }
  }

  return {
    validateImage,
  }
}
