'use client'

import Image from 'next/image'
import { type ChangeEvent, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Download } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useFormContext } from 'react-hook-form'
import { useRegistrationImageValidation } from '../(hooks)/use-registration-image-validation'
import { useState } from 'react'
import { CropImageDialog } from '@/shared/components/ui/crop-image-dialog'

export function RegistrationImageField() {
  const t = useTranslations('registration')
  const { setValue } = useFormContext()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { validateImage } = useRegistrationImageValidation()
  const [registrationImage, setRegistrationImage] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)

  const handleSelectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    const imageData = await validateImage(file)
    if (!imageData) {
      event.target.value = ''
      return
    }

    setSelectedImage(imageData)
    setIsCropDialogOpen(true)
    event.target.value = ''
  }

  const handleCloseCropDialog = () => {
    setIsCropDialogOpen(false)
    setSelectedImage('')
  }

  const handleSaveCroppedImage = (imageData: string) => {
    setRegistrationImage(imageData)
    setValue('avatar', imageData, { shouldValidate: true, shouldDirty: true })
    handleCloseCropDialog()
  }

  const handleRemoveImage = () => {
    setRegistrationImage('')
    handleCloseCropDialog()
    setValue('avatar', '', { shouldValidate: true, shouldDirty: true })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <Input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        className="hidden"
        onChange={handleSelectImage}
        translate="no"
      />
      <CropImageDialog
        open={isCropDialogOpen}
        image={selectedImage}
        onClose={handleCloseCropDialog}
        onSave={handleSaveCroppedImage}
      />
      <div className="flex flex-col md:flex-row items-center gap-4">
        {registrationImage && (
          <Image
            src={registrationImage}
            alt={t('registrationImageAlt')}
            width={100}
            height={100}
            className="h-20 w-20 rounded-full shrink-0 border-border object-cover"
          />
        )}
        {!registrationImage && (
          <div className="h-20 w-20 rounded-full bg-muted shrink-0" />
        )}
        <div className="w-full md:sgrow flex flex-col gap-3">
          <p>{t('profilePicture')}</p>
          <div className="flex flex-col md:flex-row gap-3">
            <Button type="button" variant="outline" className="border-destructive" onClick={() => fileInputRef.current?.click()}>
              <span className="text-destructive">{t('uploadImage')}</span>
              <Download className="text-destructive" />
            </Button>
            <Button type="button" variant="outline" className="border-destructive text-destructive" disabled={!registrationImage} onClick={handleRemoveImage}>
              {t('removeImage')}
            </Button>
          </div>
          <p className="text-sm">{t('imageHint')}</p>
        </div>
      </div>
    </>
  )
}
