'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Cropper from 'react-easy-crop'
import { Loader2 } from 'lucide-react'
import { useCropImage } from '@/shared/hooks/common/use-crop-image'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Slider } from '@/shared/components/ui/slider'

type Props = {
  open: boolean
  image: string
  title?: string
  onClose: () => void
  onSave: (base64: string) => void | Promise<void>
}

export function CropImageDialog({ open, image, title, onClose, onSave }: Props) {
  const t = useTranslations('cropImageDialog')
  const { crop, zoom, rotation, preview, isGenerating, setCrop, setZoom, setRotation, onCropComplete, reset } = useCropImage(image)

  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!preview) return
    await onSave(preview)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="flex flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title ?? t('title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="relative h-72 overflow-hidden rounded-lg border bg-muted">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="flex flex-col gap-5 md:flex-row">
            <div className="flex flex-1 flex-col gap-3">
              <p className="text-sm font-medium">{t('zoom', { value: zoom.toFixed(1) })}</p>
              <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={([v]) => setZoom(v)} />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <p className="text-sm font-medium">{t('rotation', { value: rotation })}</p>
              <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={([v]) => setRotation(v)} />
            </div>
          </div>

          {preview && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">{t('preview')}</p>
              <Image
                src={preview}
                alt={t('previewAlt')}
                width={120}
                height={120}
                unoptimized
                className="size-30 rounded-full border object-cover"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{t('cancel')}</Button>
          <Button disabled={!preview || isGenerating} onClick={handleSave}>
            {isGenerating && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
